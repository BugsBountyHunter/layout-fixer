//! The clipboard on GNOME Wayland, through Layout Fixer's GNOME Shell extension: Wayland only lets the
//! focused app read it. GNOME Shell holds one type at a time, so a restore puts back plain text when
//! there was any, else the HTML or the PNG image.

use std::collections::HashMap;

use super::gnome;
use crate::fix::{Clipboard, FixError, Representation, Snapshot};

const TEXT_TYPES: [&str; 2] = ["text/plain;charset=utf-8", "text/plain"];

pub struct GnomeClipboard;

fn system(error: impl std::fmt::Display) -> FixError {
    FixError::System(error.to_string())
}

fn snapshot_of(content: HashMap<String, Vec<u8>>) -> Snapshot {
    let mut representations: Vec<Representation> = content
        .into_iter()
        .map(|(kind, data)| Representation { kind, data })
        .collect();
    representations.sort_by(|a, b| a.kind.cmp(&b.kind));
    Snapshot {
        items: vec![representations],
    }
}

fn content_of(snapshot: &Snapshot) -> HashMap<String, Vec<u8>> {
    snapshot
        .items
        .iter()
        .flatten()
        .map(|rep| (rep.kind.clone(), rep.data.clone()))
        .collect()
}

fn text_of(content: &HashMap<String, Vec<u8>>) -> Option<String> {
    TEXT_TYPES
        .iter()
        .find_map(|kind| content.get(*kind))
        .map(|bytes| String::from_utf8_lossy(bytes).into_owned())
}

impl Clipboard for GnomeClipboard {
    /// The extension counts owner changes, so a copy of the same text still registers.
    fn change_count(&self) -> i64 {
        gnome::clipboard_serial().map_or(0, i64::from)
    }

    fn read_text(&self) -> Option<String> {
        text_of(&gnome::read_clipboard().ok()?)
    }

    fn snapshot(&self) -> Snapshot {
        gnome::read_clipboard().map(snapshot_of).unwrap_or_default()
    }

    /// An empty clipboard stays as the fix left it: GNOME Shell has no way to clear it.
    fn restore(&self, snapshot: &Snapshot) -> Result<(), FixError> {
        let content = content_of(snapshot);
        if content.is_empty() {
            return Ok(());
        }
        gnome::write_clipboard(&content).map_err(system)
    }

    fn write_transient_text(&self, text: &str) -> Result<(), FixError> {
        let content = HashMap::from([(TEXT_TYPES[0].to_owned(), text.as_bytes().to_vec())]);
        gnome::write_clipboard(&content).map_err(system)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_snapshot_round_trips_every_type() {
        let content = HashMap::from([
            ("text/html".to_owned(), b"<b>hi</b>".to_vec()),
            ("text/plain;charset=utf-8".to_owned(), b"hi".to_vec()),
        ]);
        let snapshot = snapshot_of(content.clone());
        assert_eq!(snapshot.items[0][0].kind, "text/html");
        assert_eq!(content_of(&snapshot), content);
    }

    #[test]
    fn reads_utf8_text_first() {
        let content = HashMap::from([
            ("text/plain".to_owned(), b"legacy".to_vec()),
            (
                "text/plain;charset=utf-8".to_owned(),
                "مرحبا".as_bytes().to_vec(),
            ),
        ]);
        assert_eq!(text_of(&content).as_deref(), Some("مرحبا"));
        assert_eq!(text_of(&HashMap::new()), None);
    }
}
