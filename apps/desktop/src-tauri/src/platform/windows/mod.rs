mod clipboard;
mod input_sources;
mod keyboard;

pub use clipboard::WindowsClipboard as SystemClipboard;
pub use input_sources::{preferred_ids, WindowsInputSources as SystemInputSources};
pub use keyboard::WindowsKeyboard as SystemKeyboard;

/// Windows needs no permission to send keys; only elevated target apps refuse them.
pub mod permissions {
    pub fn accessibility_trusted() -> bool {
        true
    }
    pub fn request_accessibility() {}
}
