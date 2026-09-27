use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use crate::fix::{self, FixError, InputLayout, InputSources, LayoutSwitch, Snapshot, Timing};
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

/// Input-source calls run on the main thread, which macOS requires.
async fn on_main_thread<T: Send + 'static>(
    app: &AppHandle,
    work: impl FnOnce() -> Result<T, FixError> + Send + 'static,
) -> Result<T, FixError> {
    let (sender, receiver) = std::sync::mpsc::channel();
    app.run_on_main_thread(move || {
        let _ = sender.send(work());
    })
    .map_err(|error| FixError::System(error.to_string()))?;
    blocking(move || {
        receiver
            .recv()
            .map_err(|error| FixError::System(error.to_string()))?
    })
    .await
}

/// After a fix: switches the OS keyboard layout to one that types `language`, if one is enabled.
#[tauri::command]
pub async fn switch_layout(
    app: AppHandle,
    language: String,
    layout: ArabicLayout,
) -> Result<LayoutSwitch, FixError> {
    if !fix::is_language_code(&language) {
        return Err(FixError::System(format!("invalid language {language:?}")));
    }
    on_main_thread(&app, move || {
        fix::switch_to(&SystemInputSources, &language, preferred_ids(layout))
    })
    .await
}

/// An enabled keyboard layout as Settings sees it.
#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LayoutInfo {
    id: String,
    language: Option<String>,
    /// Set when the layout is one of our Arabic layouts (PC or Mac).
    arabic_layout: Option<ArabicLayout>,
}

fn describe(layouts: &[InputLayout]) -> Vec<LayoutInfo> {
    layouts
        .iter()
        .map(|layout| LayoutInfo {
            id: layout.id.clone(),
            language: layout.language().map(str::to_ascii_lowercase),
            arabic_layout: ArabicLayout::of_id(&layout.id),
        })
        .collect()
}

/// The enabled keyboard layouts, for the Settings hints (missing language, Arabic layout mismatch).
#[tauri::command]
pub async fn list_layouts(app: AppHandle) -> Result<Vec<LayoutInfo>, FixError> {
    on_main_thread(&app, || Ok(describe(&SystemInputSources.enabled()?))).await
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
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    wayland: bool,
    /// The shortcut fixes text in this Wayland session as it is (KDE Plasma).
    fixes_on_wayland: bool,
}

#[tauri::command]
pub fn session_info() -> SessionInfo {
    SessionInfo {
        wayland: crate::platform::is_wayland(),
        fixes_on_wayland: crate::platform::fixes_on_wayland(),
    }
}

#[tauri::command]
pub async fn gnome_switching() -> crate::platform::GnomeSwitching {
    crate::platform::gnome_switching()
}

#[tauri::command]
pub async fn enable_gnome_switching() -> Result<crate::platform::GnomeSwitching, String> {
    crate::platform::enable_gnome_switching()
}

#[tauri::command]
pub fn show_hud(app: AppHandle, message: String) {
    hud::show(&app, &message);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_only_plain_language_codes() {
        for code in ["ar", "en", "fil"] {
            assert!(fix::is_language_code(code), "{code}");
        }
        for code in ["", "a", "EN", "en-GB", "arab", "../"] {
            assert!(!fix::is_language_code(code), "{code}");
        }
    }

    #[test]
    fn describes_layouts_for_settings() {
        let arabic_id = preferred_ids(ArabicLayout::ArMac).first().copied();
        let mut layouts = vec![InputLayout {
            id: "english".into(),
            languages: vec!["en-GB".into(), "fr".into()],
        }];
        layouts.extend(arabic_id.map(|id| InputLayout {
            id: id.into(),
            languages: vec!["ar".into()],
        }));

        let described = describe(&layouts);
        assert_eq!(
            described[0],
            LayoutInfo {
                id: "english".into(),
                language: Some("en".into()),
                arabic_layout: None,
            }
        );
        // Windows has no Mac Arabic layout, so only the platforms that do list it here.
        if let Some(id) = arabic_id {
            assert_eq!(described[1].id, id);
            assert_eq!(described[1].arabic_layout, Some(ArabicLayout::ArMac));
        }
    }

    #[test]
    fn serializes_for_the_web_side() {
        let info = LayoutInfo {
            id: "com.apple.keylayout.ArabicPC".into(),
            language: Some("ar".into()),
            arabic_layout: Some(ArabicLayout::ArPc),
        };
        assert_eq!(
            serde_json::to_value(info).unwrap(),
            serde_json::json!({
                "id": "com.apple.keylayout.ArabicPC",
                "language": "ar",
                "arabicLayout": "ar-pc"
            })
        );
    }
}
