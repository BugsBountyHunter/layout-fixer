use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use crate::fix::{self, FixError, Snapshot, Timing};
use crate::platform::{permissions, SystemClipboard, SystemKeyboard};
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
