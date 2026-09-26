mod clipboard;
mod error;
mod flow;

pub use clipboard::{Clipboard, Keyboard, Snapshot};
// Only the macOS clipboard builds snapshots item by item so far.
#[cfg(any(target_os = "macos", test))]
pub use clipboard::Representation;
pub use error::FixError;
pub use flow::{capture, replace, Timing};
