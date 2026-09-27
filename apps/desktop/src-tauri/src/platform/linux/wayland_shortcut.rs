//! The global shortcut under Wayland, where apps can't grab keys: GNOME through Layout Fixer's
//! GNOME Shell extension, KDE Plasma through kglobalaccel. Elsewhere the global-shortcut plugin does
//! it (on X11), or nothing can (other Wayland desktops).

use super::{gnome, gnome_extension, kglobalaccel, session};

pub fn handles() -> bool {
    session::is_wayland() && (session::is_gnome() || session::is_kde())
}

/// Grabs (or keeps) the shortcut; `false` when it can't (no extension, or another app owns it).
pub fn grab(accelerator: &str) -> bool {
    if session::is_gnome() {
        gnome_extension::grab_shortcut(accelerator)
    } else {
        kglobalaccel::grab(accelerator)
    }
}

pub fn release() {
    if session::is_gnome() {
        gnome_extension::release_shortcut();
    } else {
        kglobalaccel::release();
    }
}

/// Runs for the life of the app, calling `on_activated` for each use of the shortcut: on press
/// for GNOME (the extension waits for the modifiers itself), on release for KDE.
pub fn watch(on_activated: impl Fn()) {
    loop {
        let watched = if session::is_gnome() {
            gnome::watch_activated(&on_activated)
        } else {
            kglobalaccel::watch_released(&on_activated)
        };
        if let Err(error) = watched {
            eprintln!("[layout-fixer] shortcut watch stopped: {error}");
        }
        std::thread::sleep(std::time::Duration::from_secs(5));
    }
}
