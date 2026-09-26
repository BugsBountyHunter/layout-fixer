use tauri::{AppHandle, Manager};

pub const SETTINGS: &str = "settings";

/// Closing Settings only hides it: the app keeps running in the tray until Quit.
pub fn hides_on_close(label: &str) -> bool {
    label == SETTINGS
}

pub fn show_settings(app: &AppHandle) {
    let Some(window) = app.get_webview_window(SETTINGS) else {
        eprintln!("[layout-fixer] settings window is missing");
        return;
    };
    for result in [window.unminimize(), window.show(), window.set_focus()] {
        if let Err(error) = result {
            eprintln!("[layout-fixer] could not show settings: {error}");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_settings_hides_on_close() {
        assert!(hides_on_close(SETTINGS));
        assert!(!hides_on_close("main"));
    }
}
