//! Systems other than macOS, Windows and Linux (e.g. the BSDs) have no implementation yet.

use super::ArabicLayout;
use crate::fix::{Clipboard, FixError, InputLayout, InputSources, Keyboard, Snapshot};

pub struct SystemClipboard;
pub struct SystemKeyboard;
pub struct SystemInputSources;

impl Clipboard for SystemClipboard {
    fn change_count(&self) -> i64 {
        0
    }
    fn read_text(&self) -> Option<String> {
        None
    }
    fn snapshot(&self) -> Snapshot {
        Snapshot::default()
    }
    fn restore(&self, _snapshot: &Snapshot) -> Result<(), FixError> {
        Err(FixError::Unsupported)
    }
    fn write_transient_text(&self, _text: &str) -> Result<(), FixError> {
        Err(FixError::Unsupported)
    }
}

impl Keyboard for SystemKeyboard {
    fn copy(&self) -> Result<(), FixError> {
        Err(FixError::Unsupported)
    }
    fn paste(&self) -> Result<(), FixError> {
        Err(FixError::Unsupported)
    }
}

pub fn preferred_ids(_layout: ArabicLayout) -> &'static [&'static str] {
    &[]
}

impl InputSources for SystemInputSources {
    fn enabled(&self) -> Result<Vec<InputLayout>, FixError> {
        Err(FixError::Unsupported)
    }
    fn current(&self) -> Option<InputLayout> {
        None
    }
    fn select(&self, _id: &str) -> Result<(), FixError> {
        Err(FixError::Unsupported)
    }
}

pub mod permissions {
    pub fn accessibility_trusted() -> bool {
        true
    }
    pub fn request_accessibility() {}
}
