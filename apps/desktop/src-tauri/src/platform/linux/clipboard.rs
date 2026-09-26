use std::borrow::Cow;
use std::hash::{DefaultHasher, Hash, Hasher};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, OnceLock};
use std::time::{SystemTime, UNIX_EPOCH};

use arboard::{ImageData, SetExtLinux};

use crate::fix::{Clipboard, FixError, Representation, Snapshot};

const TEXT: &str = "text/plain;charset=utf-8";
const HTML: &str = "text/html";
const IMAGE_PREFIX: &str = "image/rgba;";

pub struct LinuxClipboard;

/// On X11 the app that owns the clipboard serves its contents, so one instance stays alive for the
/// whole process instead of being dropped (and its contents lost) after each call.
fn with_clipboard<T>(
    work: impl FnOnce(&mut arboard::Clipboard) -> Result<T, arboard::Error>,
) -> Result<T, FixError> {
    static CLIPBOARD: OnceLock<Mutex<Option<arboard::Clipboard>>> = OnceLock::new();
    let mut guard = CLIPBOARD
        .get_or_init(|| Mutex::new(None))
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    if guard.is_none() {
        *guard =
            Some(arboard::Clipboard::new().map_err(|error| FixError::System(error.to_string()))?);
    }
    let clipboard = guard.as_mut().expect("initialized above");
    work(clipboard).map_err(|error| FixError::System(error.to_string()))
}

fn image_kind(image: &ImageData<'_>) -> String {
    format!("{IMAGE_PREFIX}{}x{}", image.width, image.height)
}

fn parse_image_kind(kind: &str) -> Option<(usize, usize)> {
    let (width, height) = kind.strip_prefix(IMAGE_PREFIX)?.split_once('x')?;
    Some((width.parse().ok()?, height.parse().ok()?))
}

/// A marker nobody else will have on their clipboard, so a copy of identical text still counts.
fn unique_marker() -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |time| time.as_nanos());
    format!(
        "layout-fixer-{nanos}-{}",
        COUNTER.fetch_add(1, Ordering::Relaxed)
    )
}

impl Clipboard for LinuxClipboard {
    /// X11 has no change counter; a hash of the text changes whenever the copied text differs from
    /// the marker written by `mark_before_copy`.
    fn change_count(&self) -> i64 {
        let mut hasher = DefaultHasher::new();
        self.read_text().hash(&mut hasher);
        hasher.finish() as i64
    }

    fn mark_before_copy(&self) -> Result<bool, FixError> {
        self.write_transient_text(&unique_marker())?;
        Ok(true)
    }

    fn read_text(&self) -> Option<String> {
        with_clipboard(|clipboard| clipboard.get_text()).ok()
    }

    fn snapshot(&self) -> Snapshot {
        let mut representations = Vec::new();
        if let Ok(text) = with_clipboard(|clipboard| clipboard.get_text()) {
            representations.push(Representation {
                kind: TEXT.into(),
                data: text.into_bytes(),
            });
        }
        if let Ok(html) = with_clipboard(|clipboard| clipboard.get().html()) {
            representations.push(Representation {
                kind: HTML.into(),
                data: html.into_bytes(),
            });
        }
        if let Ok(image) = with_clipboard(|clipboard| clipboard.get_image()) {
            representations.push(Representation {
                kind: image_kind(&image),
                data: image.bytes.into_owned(),
            });
        }
        Snapshot {
            items: vec![representations],
        }
    }

    /// X11 clipboards hold one kind of content per copy here: rich text (HTML with its plain text),
    /// an image, or plain text. File lists and app-private formats are not restored.
    fn restore(&self, snapshot: &Snapshot) -> Result<(), FixError> {
        let reps: Vec<&Representation> = snapshot.items.iter().flatten().collect();
        let find = |kind: &str| {
            reps.iter()
                .find(|rep| rep.kind == kind)
                .map(|rep| rep.data.clone())
        };
        let text = find(TEXT).map(|bytes| String::from_utf8_lossy(&bytes).into_owned());
        let html = find(HTML).map(|bytes| String::from_utf8_lossy(&bytes).into_owned());
        let image = reps
            .iter()
            .find_map(|rep| parse_image_kind(&rep.kind).map(|size| (size, rep.data.clone())));

        match (html, image, text) {
            (Some(html), _, text) => with_clipboard(|clipboard| clipboard.set_html(html, text)),
            (None, Some(((width, height), bytes)), _) => with_clipboard(|clipboard| {
                clipboard.set_image(ImageData {
                    width,
                    height,
                    bytes: Cow::Owned(bytes),
                })
            }),
            (None, None, Some(text)) => with_clipboard(|clipboard| clipboard.set_text(text)),
            (None, None, None) => with_clipboard(|clipboard| clipboard.clear()),
        }
    }

    fn write_transient_text(&self, text: &str) -> Result<(), FixError> {
        with_clipboard(|clipboard| clipboard.set().exclude_from_history().text(text.to_owned()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn image_kinds_round_trip() {
        let image = ImageData {
            width: 3,
            height: 2,
            bytes: Cow::Owned(vec![0; 24]),
        };
        assert_eq!(parse_image_kind(&image_kind(&image)), Some((3, 2)));
        assert_eq!(parse_image_kind("text/html"), None);
    }

    #[test]
    fn markers_are_unique() {
        assert_ne!(unique_marker(), unique_marker());
    }

    /// Uses the real X11 clipboard; CI runs it under Xvfb. Skipped when no display is available.
    #[test]
    fn restores_text_and_html_after_a_transient_write() {
        if std::env::var_os("DISPLAY").is_none() {
            return;
        }
        let clipboard = LinuxClipboard;
        let original = Snapshot {
            items: vec![vec![
                Representation {
                    kind: TEXT.into(),
                    data: b"keep me".to_vec(),
                },
                Representation {
                    kind: HTML.into(),
                    data: b"<b>keep me</b>".to_vec(),
                },
            ]],
        };
        clipboard.restore(&original).unwrap();
        let before = clipboard.change_count();

        assert!(clipboard.mark_before_copy().unwrap());
        assert_ne!(clipboard.change_count(), before);
        clipboard.write_transient_text("مرحبا").unwrap();
        assert_eq!(clipboard.read_text().as_deref(), Some("مرحبا"));

        clipboard.restore(&original).unwrap();
        assert_eq!(clipboard.read_text().as_deref(), Some("keep me"));
        assert_eq!(
            with_clipboard(|clipboard| clipboard.get().html())
                .ok()
                .as_deref(),
            Some("<b>keep me</b>")
        );
    }
}
