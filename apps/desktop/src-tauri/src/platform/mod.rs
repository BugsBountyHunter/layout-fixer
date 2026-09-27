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

/// GNOME only: whether Layout Fixer's GNOME Shell extension can switch the keyboard layout.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum GnomeSwitching {
    /// Not a GNOME session: nothing to install.
    Unavailable,
    Off,
    On,
    /// Installed and enabled; GNOME Shell loads it at the next login.
    LogOut,
    /// The user turned off all extensions in the Extensions app.
    ExtensionsOff,
    /// GNOME Shell can't run it (a GNOME version the extension doesn't list).
    Incompatible,
}

pub fn gnome_switching() -> GnomeSwitching {
    #[cfg(target_os = "linux")]
    return linux::gnome_extension::status();
    #[cfg(not(target_os = "linux"))]
    GnomeSwitching::Unavailable
}

pub fn enable_gnome_switching() -> Result<GnomeSwitching, String> {
    #[cfg(target_os = "linux")]
    return linux::gnome_extension::enable();
    #[cfg(not(target_os = "linux"))]
    Ok(GnomeSwitching::Unavailable)
}

/// Rewrites an installed GNOME Shell extension that an app update changed.
pub fn refresh_gnome_extension() {
    #[cfg(target_os = "linux")]
    linux::gnome_extension::refresh();
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
