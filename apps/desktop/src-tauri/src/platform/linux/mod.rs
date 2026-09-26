mod clipboard;
mod keyboard;
pub mod session;

pub use clipboard::LinuxClipboard as SystemClipboard;
pub use keyboard::LinuxKeyboard as SystemKeyboard;

/// X11 needs no permission to send keys.
pub mod permissions {
    pub fn accessibility_trusted() -> bool {
        true
    }
    pub fn request_accessibility() {}
}
