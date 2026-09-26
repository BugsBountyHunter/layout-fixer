use std::{thread, time::Duration};

use super::{Clipboard, FixError, Keyboard, Snapshot};

#[derive(Debug, Clone, Copy)]
pub struct Timing {
    /// How long to wait for the focused app to answer ⌘C.
    pub copy_timeout: Duration,
    pub poll_interval: Duration,
    /// How long the target app gets to read the pasted text before the clipboard is restored.
    pub paste_settle: Duration,
}

impl Default for Timing {
    fn default() -> Self {
        Self {
            copy_timeout: Duration::from_millis(400),
            poll_interval: Duration::from_millis(20),
            paste_settle: Duration::from_millis(250),
        }
    }
}

/// VS Code copies the whole line when nothing is selected and tags it with this type. Fixing that
/// line would paste a converted copy at the cursor, so it counts as "nothing selected".
const EMPTY_SELECTION_MARKERS: &[&str] = &["vscode-editor-data"];
const VSCODE_EMPTY_SELECTION: &str = "\"isFromEmptySelection\":true";

pub struct Captured {
    pub text: String,
    pub previous: Snapshot,
}

/// Copies the focused app's selection. `Ok(None)` means nothing is selected; the clipboard is then
/// left exactly as it was.
pub fn capture(
    clipboard: &dyn Clipboard,
    keyboard: &dyn Keyboard,
    timing: Timing,
) -> Result<Option<Captured>, FixError> {
    let previous = clipboard.snapshot();
    let marked = clipboard.mark_before_copy()?;
    let before = clipboard.change_count();
    if let Err(error) = keyboard.copy() {
        if marked {
            clipboard.restore(&previous)?;
        }
        return Err(error);
    }

    let mut waited = Duration::ZERO;
    while clipboard.change_count() == before {
        if waited >= timing.copy_timeout {
            if marked {
                clipboard.restore(&previous)?;
            }
            return Ok(None);
        }
        thread::sleep(timing.poll_interval);
        waited += timing.poll_interval;
    }

    let text = clipboard.read_text().filter(|text| !text.is_empty());
    match text {
        Some(text) if !copied_empty_selection(clipboard) => Ok(Some(Captured { text, previous })),
        _ => {
            clipboard.restore(&previous)?;
            Ok(None)
        }
    }
}

fn copied_empty_selection(clipboard: &dyn Clipboard) -> bool {
    clipboard
        .snapshot()
        .items
        .iter()
        .flatten()
        .filter(|rep| EMPTY_SELECTION_MARKERS.contains(&rep.kind.as_str()))
        .any(|rep| String::from_utf8_lossy(&rep.data).contains(VSCODE_EMPTY_SELECTION))
}

/// Pastes `text` over the selection, then puts the user's clipboard back.
pub fn replace(
    clipboard: &dyn Clipboard,
    keyboard: &dyn Keyboard,
    text: &str,
    previous: &Snapshot,
    timing: Timing,
) -> Result<(), FixError> {
    clipboard.write_transient_text(text)?;
    let pasted = keyboard.paste();
    thread::sleep(timing.paste_settle);
    let restored = clipboard.restore(previous);
    pasted.and(restored)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fix::Representation;
    use std::sync::Mutex;

    const FAST: Timing = Timing {
        copy_timeout: Duration::from_millis(30),
        poll_interval: Duration::from_millis(5),
        paste_settle: Duration::from_millis(1),
    };

    #[derive(Default)]
    struct FakeClipboard {
        state: Mutex<(i64, Snapshot)>,
        log: Mutex<Vec<String>>,
        /// Behave like X11: write a marker before copying.
        marks: bool,
    }

    fn text_snapshot(kind: &str, text: &str) -> Snapshot {
        Snapshot {
            items: vec![vec![Representation {
                kind: kind.into(),
                data: text.as_bytes().to_vec(),
            }]],
        }
    }

    impl FakeClipboard {
        fn holding(snapshot: Snapshot) -> Self {
            Self {
                state: Mutex::new((1, snapshot)),
                ..Self::default()
            }
        }
        /// What a target app does when it answers ⌘C.
        fn app_copies(&self, snapshot: Snapshot) {
            let mut state = self.state.lock().unwrap();
            *state = (state.0 + 1, snapshot);
        }
        fn current(&self) -> Snapshot {
            self.state.lock().unwrap().1.clone()
        }
    }

    impl Clipboard for FakeClipboard {
        fn change_count(&self) -> i64 {
            self.state.lock().unwrap().0
        }
        fn read_text(&self) -> Option<String> {
            self.current()
                .items
                .iter()
                .flatten()
                .find(|rep| rep.kind == "text")
                .map(|rep| String::from_utf8(rep.data.clone()).unwrap())
        }
        fn snapshot(&self) -> Snapshot {
            self.current()
        }
        fn restore(&self, snapshot: &Snapshot) -> Result<(), FixError> {
            self.log.lock().unwrap().push("restore".into());
            self.app_copies(snapshot.clone());
            Ok(())
        }
        fn write_transient_text(&self, text: &str) -> Result<(), FixError> {
            self.log.lock().unwrap().push(format!("write {text}"));
            self.app_copies(text_snapshot("text", text));
            Ok(())
        }
        fn mark_before_copy(&self) -> Result<bool, FixError> {
            if self.marks {
                self.write_transient_text("marker")?;
            }
            Ok(self.marks)
        }
    }

    /// Simulates the focused app: what ⌘C puts on the clipboard, if anything.
    struct FakeKeyboard<'a> {
        clipboard: &'a FakeClipboard,
        on_copy: Option<Snapshot>,
        paste_error: Option<FixError>,
    }

    impl Keyboard for FakeKeyboard<'_> {
        fn copy(&self) -> Result<(), FixError> {
            if let Some(snapshot) = &self.on_copy {
                self.clipboard.app_copies(snapshot.clone());
            }
            Ok(())
        }
        fn paste(&self) -> Result<(), FixError> {
            self.clipboard.log.lock().unwrap().push("paste".into());
            self.paste_error.clone().map_or(Ok(()), Err)
        }
    }

    fn keyboard(clipboard: &FakeClipboard, on_copy: Option<Snapshot>) -> FakeKeyboard<'_> {
        FakeKeyboard {
            clipboard,
            on_copy,
            paste_error: None,
        }
    }

    #[test]
    fn captures_the_selection_and_remembers_the_old_clipboard() {
        let original = text_snapshot("image", "PNG");
        let clipboard = FakeClipboard::holding(original.clone());
        let keys = keyboard(&clipboard, Some(text_snapshot("text", "hgsghl")));

        let captured = capture(&clipboard, &keys, FAST).unwrap().unwrap();
        assert_eq!(captured.text, "hgsghl");
        assert_eq!(captured.previous, original);
    }

    #[test]
    fn nothing_selected_leaves_the_clipboard_untouched() {
        let original = text_snapshot("text", "keep me");
        let clipboard = FakeClipboard::holding(original.clone());
        let keys = keyboard(&clipboard, None);

        assert!(capture(&clipboard, &keys, FAST).unwrap().is_none());
        assert_eq!(clipboard.current(), original);
        assert!(clipboard.log.lock().unwrap().is_empty());
    }

    #[test]
    fn a_copy_without_text_restores_the_clipboard() {
        let original = text_snapshot("text", "keep me");
        let clipboard = FakeClipboard::holding(original.clone());
        let keys = keyboard(&clipboard, Some(text_snapshot("image", "PNG")));

        assert!(capture(&clipboard, &keys, FAST).unwrap().is_none());
        assert_eq!(clipboard.current(), original);
    }

    #[test]
    fn vscode_whole_line_copy_counts_as_nothing_selected() {
        let original = text_snapshot("text", "keep me");
        let clipboard = FakeClipboard::holding(original.clone());
        let line_copy = Snapshot {
            items: vec![vec![
                Representation {
                    kind: "text".into(),
                    data: b"const x = 1\n".to_vec(),
                },
                Representation {
                    kind: "vscode-editor-data".into(),
                    data: br#"{"version":1,"isFromEmptySelection":true}"#.to_vec(),
                },
            ]],
        };
        let keys = keyboard(&clipboard, Some(line_copy));

        assert!(capture(&clipboard, &keys, FAST).unwrap().is_none());
        assert_eq!(clipboard.current(), original);
    }

    #[test]
    fn a_real_vscode_selection_is_captured() {
        let clipboard = FakeClipboard::holding(Snapshot::default());
        let selection = Snapshot {
            items: vec![vec![
                Representation {
                    kind: "text".into(),
                    data: b"hgsghl".to_vec(),
                },
                Representation {
                    kind: "vscode-editor-data".into(),
                    data: br#"{"version":1,"isFromEmptySelection":false}"#.to_vec(),
                },
            ]],
        };
        let keys = keyboard(&clipboard, Some(selection));

        assert_eq!(
            capture(&clipboard, &keys, FAST).unwrap().unwrap().text,
            "hgsghl"
        );
    }

    fn marking(snapshot: Snapshot) -> FakeClipboard {
        FakeClipboard {
            marks: true,
            ..FakeClipboard::holding(snapshot)
        }
    }

    #[test]
    fn a_marker_is_replaced_by_the_selection() {
        let original = text_snapshot("text", "hgsghl");
        let clipboard = marking(original.clone());
        // The selection is the same text that was already on the clipboard.
        let keys = keyboard(&clipboard, Some(original.clone()));

        let captured = capture(&clipboard, &keys, FAST).unwrap().unwrap();
        assert_eq!(captured.text, "hgsghl");
        assert_eq!(captured.previous, original);
    }

    #[test]
    fn a_marker_is_cleaned_up_when_nothing_is_selected() {
        let original = text_snapshot("text", "keep me");
        let clipboard = marking(original.clone());
        let keys = keyboard(&clipboard, None);

        assert!(capture(&clipboard, &keys, FAST).unwrap().is_none());
        assert_eq!(clipboard.current(), original);
    }

    #[test]
    fn a_marker_is_cleaned_up_when_copy_fails() {
        let original = text_snapshot("text", "keep me");
        let clipboard = marking(original.clone());
        struct Failing;
        impl Keyboard for Failing {
            fn copy(&self) -> Result<(), FixError> {
                Err(FixError::Unsupported)
            }
            fn paste(&self) -> Result<(), FixError> {
                Ok(())
            }
        }

        assert_eq!(
            capture(&clipboard, &Failing, FAST).err(),
            Some(FixError::Unsupported)
        );
        assert_eq!(clipboard.current(), original);
    }

    #[test]
    fn replace_writes_pastes_then_restores_in_order() {
        let original = text_snapshot("text", "keep me");
        let clipboard = FakeClipboard::holding(Snapshot::default());
        let keys = keyboard(&clipboard, None);

        replace(&clipboard, &keys, "السلام", &original, FAST).unwrap();
        assert_eq!(
            *clipboard.log.lock().unwrap(),
            vec!["write السلام", "paste", "restore"]
        );
        assert_eq!(clipboard.current(), original);
    }

    #[test]
    fn replace_restores_the_clipboard_even_when_paste_fails() {
        let original = text_snapshot("text", "keep me");
        let clipboard = FakeClipboard::holding(Snapshot::default());
        let keys = FakeKeyboard {
            clipboard: &clipboard,
            on_copy: None,
            paste_error: Some(FixError::SecureInput),
        };

        assert_eq!(
            replace(&clipboard, &keys, "x", &original, FAST),
            Err(FixError::SecureInput)
        );
        assert_eq!(clipboard.current(), original);
    }
}
