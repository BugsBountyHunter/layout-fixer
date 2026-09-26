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
        .setup(|app| {
            // A menu-bar utility: no Dock icon and no app switcher entry.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            tray::create(app.handle())?;
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
