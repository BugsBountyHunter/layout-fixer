use super::FixError;

/// Every item and every representation on the clipboard, so a fix can put back exactly what was there
/// (rich text, images, files), not just plain text.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Snapshot {
    pub items: Vec<Vec<Representation>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Representation {
    pub kind: String,
    pub data: Vec<u8>,
}

pub trait Clipboard: Send + Sync {
    /// Changes whenever any app writes to the clipboard.
    fn change_count(&self) -> i64;
    /// Called before ⌘C / Ctrl+C. Clipboards without a change counter (X11) write a marker here so a
    /// copy of identical text still registers; returns whether the clipboard was modified.
    fn mark_before_copy(&self) -> Result<bool, FixError> {
        Ok(false)
    }
    fn read_text(&self) -> Option<String>;
    fn snapshot(&self) -> Snapshot;
    fn restore(&self, snapshot: &Snapshot) -> Result<(), FixError>;
    /// Writes text marked as transient, so clipboard managers don't record it.
    fn write_transient_text(&self, text: &str) -> Result<(), FixError>;
}

pub trait Keyboard: Send + Sync {
    /// Sends ⌘C / Ctrl+C to the focused app.
    fn copy(&self) -> Result<(), FixError>;
    /// Sends ⌘V / Ctrl+V to the focused app.
    fn paste(&self) -> Result<(), FixError>;
}
