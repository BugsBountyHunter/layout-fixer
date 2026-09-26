mod clipboard;
mod error;
mod flow;

pub use clipboard::{Clipboard, Keyboard, Snapshot};
// Built by the platform clipboards; Linux has none yet.
#[cfg(any(target_os = "macos", windows, test))]
pub use clipboard::Representation;
pub use error::FixError;
pub use flow::{capture, replace, Timing};
