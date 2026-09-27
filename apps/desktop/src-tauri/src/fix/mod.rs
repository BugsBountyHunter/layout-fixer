mod clipboard;
mod error;
mod flow;
mod input_sources;

pub use clipboard::{Clipboard, Keyboard, Snapshot};
// Built by the platform clipboards.
#[cfg(any(target_os = "macos", windows, target_os = "linux", test))]
pub use clipboard::Representation;
pub use error::FixError;
pub use flow::{capture, replace, Timing};
pub use input_sources::{is_language_code, switch_to, InputLayout, InputSources, LayoutSwitch};
