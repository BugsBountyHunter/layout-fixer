mod clipboard;
mod error;
mod flow;

pub use clipboard::{Clipboard, Keyboard, Snapshot};
// Built by the platform clipboards.
#[cfg(any(target_os = "macos", windows, target_os = "linux", test))]
pub use clipboard::Representation;
pub use error::FixError;
pub use flow::{capture, replace, Timing};
