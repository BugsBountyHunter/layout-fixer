use serde::Serialize;

/// Sent to the web side as a stable code; the UI owns the wording.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "code", content = "detail", rename_all = "kebab-case")]
pub enum FixError {
    /// macOS: the app is not allowed to send ⌘C / ⌘V yet.
    #[cfg_attr(not(target_os = "macos"), allow(dead_code))]
    AccessibilityDenied,
    /// macOS: a password field has Secure Input on, which blocks synthetic keys.
    #[cfg_attr(not(target_os = "macos"), allow(dead_code))]
    SecureInput,
    /// This OS is not supported yet (Windows and Linux arrive in later phases).
    #[cfg_attr(target_os = "macos", allow(dead_code))]
    Unsupported,
    /// A system call failed; the detail is for logs, not for users.
    System(String),
}

impl std::fmt::Display for FixError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::System(detail) => write!(f, "system error: {detail}"),
            other => write!(f, "{other:?}"),
        }
    }
}

impl std::error::Error for FixError {}
