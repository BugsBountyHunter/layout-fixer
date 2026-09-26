use std::sync::Mutex;

use serde::Deserialize;
use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, Wry,
};

use crate::{shortcut, windows};

const TRAY_ID: &str = "main";
const FIX_ID: &str = "fix";
const PAUSE_ID: &str = "pause";
const SETTINGS_ID: &str = "settings";
const QUIT_ID: &str = "quit";

/// Menu text in the user's language; the web side sends it once it knows the language.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Labels {
    fix: String,
    pause: String,
    resume: String,
    settings: String,
    quit: String,
}

impl Default for Labels {
    fn default() -> Self {
        Self {
            fix: "Fix Selection".into(),
            pause: "Pause".into(),
            resume: "Resume".into(),
            settings: "Settings…".into(),
            quit: "Quit Layout Fixer".into(),
        }
    }
}

#[derive(Default)]
pub struct TrayLabels(Mutex<Labels>);

#[derive(Debug, PartialEq, Eq)]
enum Action {
    Fix,
    TogglePause,
    ShowSettings,
    Quit,
}

fn action_for(id: &str) -> Option<Action> {
    match id {
        FIX_ID => Some(Action::Fix),
        PAUSE_ID => Some(Action::TogglePause),
        SETTINGS_ID => Some(Action::ShowSettings),
        QUIT_ID => Some(Action::Quit),
        _ => None,
    }
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let labels = app
        .state::<TrayLabels>()
        .0
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
        .clone();
    let hotkey = app.state::<shortcut::Hotkey>();
    let accelerator = hotkey.accelerator();
    let pause_label = if hotkey.is_paused() {
        &labels.resume
    } else {
        &labels.pause
    };

    // Menu bar extras don't activate the app, so the fix still reaches the app the user was in.
    let fix = MenuItem::with_id(app, FIX_ID, &labels.fix, true, Some(accelerator.as_str()))?;
    let pause = MenuItem::with_id(app, PAUSE_ID, pause_label, true, None::<&str>)?;
    let settings = MenuItem::with_id(
        app,
        SETTINGS_ID,
        &labels.settings,
        true,
        Some("CmdOrCtrl+,"),
    )?;
    let quit = MenuItem::with_id(app, QUIT_ID, &labels.quit, true, Some("CmdOrCtrl+Q"))?;
    Menu::with_items(
        app,
        &[
            &fix,
            &pause,
            &PredefinedMenuItem::separator(app)?,
            &settings,
            &PredefinedMenuItem::separator(app)?,
            &quit,
        ],
    )
}

/// Rebuilds the menu after the language, the shortcut or the paused state changed.
pub fn refresh(app: &AppHandle) {
    let result = build_menu(app).and_then(|menu| match app.tray_by_id(TRAY_ID) {
        Some(tray) => tray.set_menu(Some(menu)),
        None => Ok(()),
    });
    if let Err(error) = result {
        eprintln!("[layout-fixer] could not update the tray menu: {error}");
    }
}

pub fn set_labels(app: &AppHandle, labels: Labels) {
    *app.state::<TrayLabels>()
        .0
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner()) = labels;
    refresh(app);
}

fn on_menu_event(app: &AppHandle, event: MenuEvent) {
    match action_for(event.id().as_ref()) {
        Some(Action::Fix) => shortcut::request_fix(app),
        Some(Action::TogglePause) => {
            let paused = app.state::<shortcut::Hotkey>().is_paused();
            shortcut::set_paused(app, !paused);
            refresh(app);
        }
        Some(Action::ShowSettings) => windows::show_settings(app),
        Some(Action::Quit) => app.exit(0),
        None => {}
    }
}

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::AssetNotFound("default window icon".into()))?;
    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .tooltip("Layout Fixer")
        .menu(&build_menu(app)?)
        .show_menu_on_left_click(true)
        .on_menu_event(on_menu_event)
        .build(app)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_menu_ids_to_actions() {
        assert_eq!(action_for(FIX_ID), Some(Action::Fix));
        assert_eq!(action_for(PAUSE_ID), Some(Action::TogglePause));
        assert_eq!(action_for(SETTINGS_ID), Some(Action::ShowSettings));
        assert_eq!(action_for(QUIT_ID), Some(Action::Quit));
        assert_eq!(action_for("unknown"), None);
    }

    #[test]
    fn reads_labels_sent_by_the_web_side() {
        let labels: Labels = serde_json::from_str(
            r#"{"fix":"تصحيح النص المحدد","pause":"إيقاف مؤقت","resume":"استئناف","settings":"الإعدادات…","quit":"إنهاء"}"#,
        )
        .unwrap();
        assert_eq!(labels.resume, "استئناف");
    }
}
