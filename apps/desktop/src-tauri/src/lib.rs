mod commands;
mod fix;
mod hud;
mod platform;
mod shortcut;
mod tray;
mod windows;

use tauri::WindowEvent;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Registered first so a second launch only focuses the running app.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            windows::show_settings(app);
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(shortcut::plugin())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(commands::PendingClipboard::default())
        .manage(shortcut::Hotkey::default())
        .manage(tray::TrayLabels::default())
        .manage(hud::Generation::default())
        .invoke_handler(tauri::generate_handler![
            commands::capture_selection,
            commands::paste_text,
            commands::restore_clipboard,
            commands::accessibility_status,
            commands::request_accessibility,
            commands::shortcut_info,
            commands::set_shortcut,
            commands::set_tray_labels,
            commands::show_settings,
            commands::session_info,
            commands::show_hud,
        ])
        .setup(|app| {
            // A menu-bar utility: no Dock icon and no app switcher entry.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            shortcut::register_saved(app.handle());
            tray::create(app.handle())?;
            hud::create(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if windows::hides_on_close(window.label()) {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Layout Fixer");
}
