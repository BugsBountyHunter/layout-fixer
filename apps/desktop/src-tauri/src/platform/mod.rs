#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::{
    announce, permissions, preferred_ids, SystemClipboard, SystemInputSources, SystemKeyboard,
};

#[cfg(windows)]
mod windows;
#[cfg(windows)]
pub use windows::{
    permissions, preferred_ids, SystemClipboard, SystemInputSources, SystemKeyboard,
};

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "linux")]
pub use linux::{
    permissions, preferred_ids, session, SystemClipboard, SystemInputSources, SystemKeyboard,
};

#[cfg(not(any(target_os = "macos", windows, target_os = "linux")))]
mod unsupported;
#[cfg(not(any(target_os = "macos", windows, target_os = "linux")))]
pub use unsupported::{
    permissions, preferred_ids, SystemClipboard, SystemInputSources, SystemKeyboard,
};

/// The Arabic layout chosen in Settings (`ar-pc` / `ar-mac`), used to pick among enabled layouts.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ArabicLayout {
    ArPc,
    ArMac,
}

impl ArabicLayout {
    pub const ALL: [Self; 2] = [Self::ArPc, Self::ArMac];

    /// Which of our Arabic layouts an OS layout id is, if it is one we know.
    pub fn of_id(id: &str) -> Option<Self> {
        Self::ALL
            .into_iter()
            .find(|layout| preferred_ids(*layout).contains(&id))
    }
}

/// Whether this session blocks the fix (Linux on Wayland).
pub fn is_wayland() -> bool {
    #[cfg(target_os = "linux")]
    return session::is_wayland();
    #[cfg(not(target_os = "linux"))]
    false
}

/// Screen-reader announcement of an on-screen message. Only macOS needs it: on Windows and Linux the
/// message pill is an ARIA live region that Narrator and Orca read from the page itself.
#[cfg(not(target_os = "macos"))]
pub fn announce(_message: &str) {}
