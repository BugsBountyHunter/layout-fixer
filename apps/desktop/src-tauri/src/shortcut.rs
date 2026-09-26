use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_store::StoreExt;

use crate::windows;

/// Same default as the extension: ⌥⇧F on macOS, Alt+Shift+F elsewhere.
pub const DEFAULT: &str = "Alt+Shift+F";
pub const FIX_EVENT: &str = "fix-selection";
const SETTINGS_FILE: &str = "settings.json";

pub struct Hotkey {
    accelerator: Mutex<String>,
    registered: AtomicBool,
    paused: AtomicBool,
}

impl Default for Hotkey {
    fn default() -> Self {
        Self {
            accelerator: Mutex::new(DEFAULT.into()),
            registered: AtomicBool::new(false),
            paused: AtomicBool::new(false),
        }
    }
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutInfo {
    pub accelerator: String,
    pub registered: bool,
    pub paused: bool,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(tag = "code", rename_all = "kebab-case")]
pub enum ShortcutError {
    /// Not a shortcut the OS can register.
    Invalid,
    /// Another app already owns it; the previous shortcut stays active.
    Taken,
}

impl Hotkey {
    pub fn accelerator(&self) -> String {
        self.accelerator
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .clone()
    }
    pub fn is_paused(&self) -> bool {
        self.paused.load(Ordering::Relaxed)
    }
    pub fn info(&self) -> ShortcutInfo {
        ShortcutInfo {
            accelerator: self.accelerator(),
            registered: self.registered.load(Ordering::Relaxed),
            paused: self.is_paused(),
        }
    }
    fn set_accelerator(&self, accelerator: &str) {
        *self
            .accelerator
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner()) = accelerator.into();
    }
}

/// Asks the web side to run the fix. It runs in the Settings window's page, which is loaded
/// (hidden) for the whole life of the app.
pub fn request_fix<R: Runtime>(app: &AppHandle<R>) {
    if let Err(error) = app.emit_to(windows::SETTINGS, FIX_EVENT, ()) {
        eprintln!("[layout-fixer] could not start a fix: {error}");
    }
}

pub fn plugin<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri_plugin_global_shortcut::Builder::new()
        // Acting on release means the user's modifiers are up (or about to be) before the copy.
        .with_handler(|app, _shortcut, event| {
            if event.state() == ShortcutState::Released {
                request_fix(app);
            }
        })
        .build()
}

fn parse(accelerator: &str) -> Result<Shortcut, ShortcutError> {
    accelerator.parse().map_err(|_| ShortcutError::Invalid)
}

/// The shortcut saved by the Settings window, if it is one the OS understands.
fn saved_accelerator<R: Runtime>(app: &AppHandle<R>) -> Option<String> {
    let store = app.store(SETTINGS_FILE).ok()?;
    let accelerator = store.get("settings")?.get("shortcut")?.as_str()?.to_owned();
    parse(&accelerator).is_ok().then_some(accelerator)
}

/// At launch: the saved shortcut, or the default. Another app may already own it; the app then
/// keeps working from the tray menu and Settings says so.
pub fn register_saved<R: Runtime>(app: &AppHandle<R>) {
    let accelerator = saved_accelerator(app).unwrap_or_else(|| DEFAULT.into());
    let hotkey = app.state::<Hotkey>();
    hotkey.set_accelerator(&accelerator);
    let registered = app.global_shortcut().register(accelerator.as_str()).is_ok();
    if !registered {
        eprintln!("[layout-fixer] could not register {accelerator}");
    }
    hotkey.registered.store(registered, Ordering::Relaxed);
}

/// Swaps the shortcut; if the new one can't be registered the old one is restored.
pub fn change<R: Runtime>(
    app: &AppHandle<R>,
    accelerator: &str,
) -> Result<ShortcutInfo, ShortcutError> {
    let next = parse(accelerator)?;
    let hotkey = app.state::<Hotkey>();
    let previous = hotkey.accelerator();
    let shortcuts = app.global_shortcut();
    if previous != accelerator {
        let _ = shortcuts.unregister(previous.as_str());
    }
    if hotkey.is_paused() {
        hotkey.set_accelerator(accelerator);
        return Ok(hotkey.info());
    }
    if shortcuts.is_registered(next) || shortcuts.register(next).is_ok() {
        hotkey.set_accelerator(accelerator);
        hotkey.registered.store(true, Ordering::Relaxed);
        return Ok(hotkey.info());
    }
    let restored = shortcuts.register(previous.as_str()).is_ok();
    hotkey.registered.store(restored, Ordering::Relaxed);
    Err(ShortcutError::Taken)
}

/// Paused means the shortcut is released entirely, so the key combination reaches other apps.
pub fn set_paused<R: Runtime>(app: &AppHandle<R>, paused: bool) {
    let hotkey = app.state::<Hotkey>();
    hotkey.paused.store(paused, Ordering::Relaxed);
    let accelerator = hotkey.accelerator();
    let shortcuts = app.global_shortcut();
    let registered = if paused {
        let _ = shortcuts.unregister(accelerator.as_str());
        false
    } else {
        shortcuts.register(accelerator.as_str()).is_ok()
    };
    hotkey.registered.store(registered, Ordering::Relaxed);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_what_the_settings_recorder_produces() {
        for accelerator in [DEFAULT, "Cmd+Ctrl+2", "Ctrl+F12", "Super+Alt+K"] {
            assert!(parse(accelerator).is_ok(), "{accelerator}");
        }
        assert_eq!(parse("not a shortcut"), Err(ShortcutError::Invalid));
    }

    #[test]
    fn starts_unpaused_with_the_default() {
        let hotkey = Hotkey::default();
        assert_eq!(
            hotkey.info(),
            ShortcutInfo {
                accelerator: DEFAULT.into(),
                registered: false,
                paused: false
            }
        );
    }
}
