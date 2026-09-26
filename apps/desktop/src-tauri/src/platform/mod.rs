#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::{permissions, SystemClipboard, SystemKeyboard};

#[cfg(windows)]
mod windows;
#[cfg(windows)]
pub use windows::{permissions, SystemClipboard, SystemKeyboard};

#[cfg(not(any(target_os = "macos", windows)))]
mod unsupported;
#[cfg(not(any(target_os = "macos", windows)))]
pub use unsupported::{permissions, SystemClipboard, SystemKeyboard};
