use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use crate::fix::{self, FixError, LayoutSwitch, Snapshot, Timing};
use crate::platform::{
    permissions, preferred_ids, ArabicLayout, SystemClipboard, SystemInputSources, SystemKeyboard,
};
use crate::{hud, shortcut, tray, windows};

/// The user's clipboard between capturing the selection and pasting the fix.
#[derive(Default)]
pub struct PendingClipboard(Mutex<Option<Snapshot>>);

impl PendingClipboard {
    fn put(&self, snapshot: Option<Snapshot>) {
        *self
            .0
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner()) = snapshot;
    }
    fn take(&self) -> Option<Snapshot> {
        self.0
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .take()
    }
}

/// Clipboard polling and key timing block, so they run off the main thread.
async fn blocking<T: Send + 'static>(
    work: impl FnOnce() -> Result<T, FixError> + Send + 'static,
) -> Result<T, FixError> {
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|error| FixError::System(error.to_string()))?
}

/// Copies the focused app's selection. `None` means nothing was selected.
#[tauri::command]
pub async fn capture_selection(app: AppHandle) -> Result<Option<String>, FixError> {
    let captured =
        blocking(|| fix::capture(&SystemClipboard, &SystemKeyboard, Timing::default())).await?;
    let pending = app.state::<PendingClipboard>();
    Ok(captured.map(|captured| {
        pending.put(Some(captured.previous));
        captured.text
    }))
}

/// Pastes the fixed text over the selection and restores the user's clipboard.
#[tauri::command]
pub async fn paste_text(
    text: String,
    pending: State<'_, PendingClipboard>,
) -> Result<(), FixError> {
    let previous = pending.take().unwrap_or_default();
    blocking(move || {
        fix::replace(
            &SystemClipboard,
            &SystemKeyboard,
            &text,
            &previous,
            Timing::default(),
        )
    })
    .await
}

/// Puts the user's clipboard back without pasting (for example when there was nothing to fix).
#[tauri::command]
pub async fn restore_clipboard(pending: State<'_, PendingClipboard>) -> Result<(), FixError> {
    match pending.take() {
        Some(previous) => {
            blocking(move || fix::Clipboard::restore(&SystemClipboard, &previous)).await
        }
        None => Ok(()),
    }
}

/// A language code the web side may ask for: `ar`, `en`, later others. Rejects anything else.
fn is_language_code(code: &str) -> bool {
    (2..=3).contains(&code.len()) && code.bytes().all(|byte| byte.is_ascii_lowercase())
}

/// After a fix: switches the OS keyboard layout to one that types `language`, if one is enabled.
/// Runs on the main thread, which macOS requires for input-source changes.
#[tauri::command]
pub async fn switch_layout(
    app: AppHandle,
    language: String,
    layout: ArabicLayout,
) -> Result<LayoutSwitch, FixError> {
    if !is_language_code(&language) {
        return Err(FixError::System(format!("invalid language {language:?}")));
    }
    let (sender, receiver) = std::sync::mpsc::channel();
    app.run_on_main_thread(move || {
        let _ = sender.send(fix::switch_to(
            &SystemInputSources,
            &language,
            preferred_ids(layout),
        ));
    })
    .map_err(|error| FixError::System(error.to_string()))?;
    blocking(move || {
        receiver
            .recv()
            .map_err(|error| FixError::System(error.to_string()))?
    })
    .await
}

#[tauri::command]
pub fn accessibility_status() -> bool {
    permissions::accessibility_trusted()
}

/// Also brings up Settings, where the permission row updates once the user switches it on.
#[tauri::command]
pub fn request_accessibility(app: AppHandle) {
    permissions::request_accessibility();
    windows::show_settings(&app);
}

#[tauri::command]
pub fn shortcut_info(hotkey: State<'_, shortcut::Hotkey>) -> shortcut::ShortcutInfo {
    hotkey.info()
}

/// Registers a new shortcut chosen in Settings; the web side saves it once this succeeds.
#[tauri::command]
pub fn set_shortcut(
    app: AppHandle,
    accelerator: String,
) -> Result<shortcut::ShortcutInfo, shortcut::ShortcutError> {
    let info = shortcut::change(&app, &accelerator)?;
    tray::refresh(&app);
    Ok(info)
}

#[tauri::command]
pub fn set_tray_labels(app: AppHandle, labels: tray::Labels) {
    tray::set_labels(&app, labels);
}

/// Shows (or hides, with `None`) the "Update to …" item in the tray menu.
#[tauri::command]
pub fn set_update_label(app: AppHandle, label: Option<String>) {
    tray::set_update_label(&app, label);
}

#[tauri::command]
pub fn install_location() -> crate::install::InstallLocation {
    crate::install::current()
}

#[tauri::command]
pub fn reveal_applications_folder() {
    crate::install::reveal_applications_folder();
}

#[tauri::command]
pub fn show_settings(app: AppHandle) {
    windows::show_settings(&app);
}

#[derive(Serialize)]
pub struct SessionInfo {
    wayland: bool,
}

#[tauri::command]
pub fn session_info() -> SessionInfo {
    SessionInfo {
        wayland: crate::platform::is_wayland(),
    }
}

#[tauri::command]
pub fn show_hud(app: AppHandle, message: String) {
    hud::show(&app, &message);
}

#[cfg(test)]
mod tests {
    use super::is_language_code;

    #[test]
    fn accepts_only_plain_language_codes() {
        for code in ["ar", "en", "fil"] {
            assert!(is_language_code(code), "{code}");
        }
        for code in ["", "a", "EN", "en-GB", "arab", "../"] {
            assert!(!is_language_code(code), "{code}");
        }
    }
}
