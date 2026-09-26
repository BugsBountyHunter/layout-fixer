#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::{permissions, SystemClipboard, SystemKeyboard};

#[cfg(not(target_os = "macos"))]
mod unsupported;
#[cfg(not(target_os = "macos"))]
pub use unsupported::{permissions, SystemClipboard, SystemKeyboard};
