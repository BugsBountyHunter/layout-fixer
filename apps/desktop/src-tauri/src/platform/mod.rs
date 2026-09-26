#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::{permissions, SystemClipboard, SystemKeyboard};

#[cfg(windows)]
mod windows;
#[cfg(windows)]
pub use windows::{permissions, SystemClipboard, SystemKeyboard};

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "linux")]
pub use linux::{permissions, session, SystemClipboard, SystemKeyboard};

#[cfg(not(any(target_os = "macos", windows, target_os = "linux")))]
mod unsupported;
#[cfg(not(any(target_os = "macos", windows, target_os = "linux")))]
pub use unsupported::{permissions, SystemClipboard, SystemKeyboard};

/// Whether this session blocks the fix (Linux on Wayland).
pub fn is_wayland() -> bool {
    #[cfg(target_os = "linux")]
    return session::is_wayland();
    #[cfg(not(target_os = "linux"))]
    false
}
