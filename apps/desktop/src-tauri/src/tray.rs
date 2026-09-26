use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    AppHandle, Wry,
};

use crate::windows;

const SETTINGS_ID: &str = "settings";
const QUIT_ID: &str = "quit";

#[derive(Debug, PartialEq, Eq)]
enum Action {
    ShowSettings,
    Quit,
}

fn action_for(id: &str) -> Option<Action> {
    match id {
        SETTINGS_ID => Some(Action::ShowSettings),
        QUIT_ID => Some(Action::Quit),
        _ => None,
    }
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let settings = MenuItem::with_id(app, SETTINGS_ID, "Settings…", true, Some("CmdOrCtrl+,"))?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, QUIT_ID, "Quit Layout Fixer", true, Some("CmdOrCtrl+Q"))?;
    Menu::with_items(app, &[&settings, &separator, &quit])
}

fn on_menu_event(app: &AppHandle, event: MenuEvent) {
    match action_for(event.id().as_ref()) {
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
    TrayIconBuilder::with_id("main")
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
        assert_eq!(action_for(SETTINGS_ID), Some(Action::ShowSettings));
        assert_eq!(action_for(QUIT_ID), Some(Action::Quit));
        assert_eq!(action_for("unknown"), None);
    }
}
