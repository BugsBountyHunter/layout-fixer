use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

use crate::windows;

/// Same default as the extension: ⌥⇧F on macOS, Alt+Shift+F elsewhere.
pub const DEFAULT: &str = "Alt+Shift+F";
pub const FIX_EVENT: &str = "fix-selection";

#[derive(Default)]
pub struct Status(AtomicBool);

impl Status {
    pub fn registered(&self) -> bool {
        self.0.load(Ordering::Relaxed)
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
        // Acting on release means the user's ⌥⇧ are up before ⌘C is sent.
        .with_handler(|app, _shortcut, event| {
            if event.state() == ShortcutState::Released {
                request_fix(app);
            }
        })
        .build()
}

/// Another app may already own the combination; the app keeps working from the tray menu then.
pub fn register<R: Runtime>(app: &AppHandle<R>) {
    let registered = match app.global_shortcut().register(DEFAULT) {
        Ok(()) => true,
        Err(error) => {
            eprintln!("[layout-fixer] could not register {DEFAULT}: {error}");
            false
        }
    };
    app.state::<Status>().0.store(registered, Ordering::Relaxed);
}
