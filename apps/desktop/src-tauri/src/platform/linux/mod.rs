mod cinnamon;
mod clipboard;
mod gnome;
mod gnome_clipboard;
pub mod gnome_extension;
mod input_sources;
mod kde;
pub mod kde_input;
mod keyboard;
mod kglobalaccel;
pub mod session;
pub mod wayland_shortcut;

pub use clipboard::LinuxClipboard as SystemClipboard;
pub use input_sources::{preferred_ids, LinuxInputSources as SystemInputSources};
pub use keyboard::LinuxKeyboard as SystemKeyboard;

/// X11 needs no permission to send keys.
pub mod permissions {
    pub fn accessibility_trusted() -> bool {
        true
    }
    pub fn request_accessibility() {}
}
