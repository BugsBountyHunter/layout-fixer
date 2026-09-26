use std::{thread, time::Duration};

use windows::core::{HSTRING, PCWSTR};
use windows::Win32::Foundation::{GlobalFree, HANDLE, HGLOBAL};
use windows::Win32::System::DataExchange::{
    CloseClipboard, EmptyClipboard, EnumClipboardFormats, GetClipboardData,
    GetClipboardFormatNameW, GetClipboardSequenceNumber, OpenClipboard, RegisterClipboardFormatW,
    SetClipboardData,
};
use windows::Win32::System::Memory::{
    GlobalAlloc, GlobalLock, GlobalSize, GlobalUnlock, GMEM_MOVEABLE,
};

use crate::fix::{Clipboard, FixError, Representation, Snapshot};

const CF_UNICODETEXT: u32 = 13;
/// Formats whose clipboard handle is a GDI object or owner-drawn, not memory we can copy. Windows
/// re-creates the common ones (CF_BITMAP from CF_DIB) when the snapshot is restored.
const HANDLE_FORMATS: &[u32] = &[2, 3, 9, 14, 0x80, 0x82, 0x83, 0x8E];
const PRIVATE_FORMATS: std::ops::RangeInclusive<u32> = 0x0200..=0x03FF;
/// Registered formats that keep an entry out of Win+V history, cloud clipboard and clipboard monitors.
const EXCLUDE_FROM_MONITORS: &str = "ExcludeClipboardContentFromMonitorProcessing";
const HISTORY_FLAGS: &[&str] = &["CanIncludeInClipboardHistory", "CanUploadToCloudClipboard"];
/// Standard formats are stored as "#<id>", registered ones by name (their ids differ between sessions).
const STANDARD_PREFIX: char = '#';

pub struct WindowsClipboard;

/// Another app may hold the clipboard for a moment; retry briefly instead of failing the fix.
struct Open;

impl Open {
    fn new() -> Result<Self, FixError> {
        for _ in 0..20 {
            // SAFETY: no owner window; paired with CloseClipboard in Drop.
            if unsafe { OpenClipboard(None) }.is_ok() {
                return Ok(Self);
            }
            thread::sleep(Duration::from_millis(10));
        }
        Err(FixError::System("the clipboard is busy".into()))
    }
}

impl Drop for Open {
    fn drop(&mut self) {
        // SAFETY: only reached after a successful OpenClipboard.
        let _ = unsafe { CloseClipboard() };
    }
}

fn format_kind(format: u32) -> String {
    let mut name = [0u16; 256];
    // SAFETY: the buffer outlives the call; standard formats return 0.
    let length = unsafe { GetClipboardFormatNameW(format, &mut name) };
    if length > 0 {
        String::from_utf16_lossy(&name[..length as usize])
    } else {
        format!("{STANDARD_PREFIX}{format}")
    }
}

fn format_id(kind: &str) -> u32 {
    match kind
        .strip_prefix(STANDARD_PREFIX)
        .and_then(|id| id.parse().ok())
    {
        Some(id) => id,
        // SAFETY: the HSTRING lives until the call returns.
        None => unsafe { RegisterClipboardFormatW(PCWSTR(HSTRING::from(kind).as_ptr())) },
    }
}

fn copyable(format: u32) -> bool {
    !HANDLE_FORMATS.contains(&format) && !PRIVATE_FORMATS.contains(&format)
}

/// Copies the bytes behind a clipboard memory handle. The clipboard must be open.
fn read_bytes(format: u32) -> Option<Vec<u8>> {
    // SAFETY: the clipboard is open; the handle stays owned by the clipboard and is only locked here.
    unsafe {
        let handle = GetClipboardData(format).ok()?;
        let memory = HGLOBAL(handle.0);
        let size = GlobalSize(memory);
        let pointer = GlobalLock(memory) as *const u8;
        if pointer.is_null() {
            return None;
        }
        let bytes = std::slice::from_raw_parts(pointer, size).to_vec();
        let _ = GlobalUnlock(memory);
        Some(bytes)
    }
}

/// Hands a copy of `bytes` to the clipboard, which then owns the memory. The clipboard must be open.
fn write_bytes(format: u32, bytes: &[u8]) -> Result<(), FixError> {
    let system = |error: windows::core::Error| FixError::System(error.to_string());
    // SAFETY: the allocation is at least `bytes.len()` long (min 1); ownership passes to the
    // clipboard only when SetClipboardData succeeds, otherwise it is freed here.
    unsafe {
        let memory = GlobalAlloc(GMEM_MOVEABLE, bytes.len().max(1)).map_err(system)?;
        let pointer = GlobalLock(memory) as *mut u8;
        if pointer.is_null() {
            let _ = GlobalFree(Some(memory));
            return Err(FixError::System("GlobalLock failed".into()));
        }
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), pointer, bytes.len());
        let _ = GlobalUnlock(memory);
        if let Err(error) = SetClipboardData(format, Some(HANDLE(memory.0))) {
            let _ = GlobalFree(Some(memory));
            return Err(system(error));
        }
    }
    Ok(())
}

fn utf16_bytes(text: &str) -> Vec<u8> {
    text.encode_utf16()
        .chain(std::iter::once(0))
        .flat_map(u16::to_le_bytes)
        .collect()
}

fn text_from_utf16(bytes: &[u8]) -> String {
    let units: Vec<u16> = bytes
        .as_chunks::<2>()
        .0
        .iter()
        .map(|&pair| u16::from_le_bytes(pair))
        .collect();
    let end = units
        .iter()
        .position(|&unit| unit == 0)
        .unwrap_or(units.len());
    String::from_utf16_lossy(&units[..end])
}

impl Clipboard for WindowsClipboard {
    fn change_count(&self) -> i64 {
        // SAFETY: no arguments.
        i64::from(unsafe { GetClipboardSequenceNumber() })
    }

    fn read_text(&self) -> Option<String> {
        let _open = Open::new().ok()?;
        read_bytes(CF_UNICODETEXT).map(|bytes| text_from_utf16(&bytes))
    }

    fn snapshot(&self) -> Snapshot {
        let Ok(_open) = Open::new() else {
            return Snapshot::default();
        };
        let mut representations = Vec::new();
        let mut format = 0;
        loop {
            // SAFETY: the clipboard is open; 0 starts and ends the enumeration.
            format = unsafe { EnumClipboardFormats(format) };
            if format == 0 {
                break;
            }
            if let Some(data) = copyable(format).then(|| read_bytes(format)).flatten() {
                representations.push(Representation {
                    kind: format_kind(format),
                    data,
                });
            }
        }
        Snapshot {
            items: vec![representations],
        }
    }

    fn restore(&self, snapshot: &Snapshot) -> Result<(), FixError> {
        let _open = Open::new()?;
        // SAFETY: the clipboard is open.
        unsafe { EmptyClipboard() }.map_err(|error| FixError::System(error.to_string()))?;
        for rep in snapshot.items.iter().flatten() {
            write_bytes(format_id(&rep.kind), &rep.data)?;
        }
        Ok(())
    }

    fn write_transient_text(&self, text: &str) -> Result<(), FixError> {
        let _open = Open::new()?;
        // SAFETY: the clipboard is open.
        unsafe { EmptyClipboard() }.map_err(|error| FixError::System(error.to_string()))?;
        write_bytes(CF_UNICODETEXT, &utf16_bytes(text))?;
        write_bytes(format_id(EXCLUDE_FROM_MONITORS), &[])?;
        for flag in HISTORY_FLAGS {
            write_bytes(format_id(flag), &0u32.to_le_bytes())?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn utf16_round_trip_stops_at_the_terminator() {
        let bytes = utf16_bytes("السلام hello");
        assert_eq!(text_from_utf16(&bytes), "السلام hello");
        assert_eq!(text_from_utf16(&[0x41, 0, 0, 0, 0x42, 0]), "A");
    }

    #[test]
    fn standard_formats_round_trip_by_id() {
        assert_eq!(format_id("#13"), CF_UNICODETEXT);
        assert!(!copyable(2) && !copyable(0x0250) && copyable(CF_UNICODETEXT));
    }

    /// Uses the real clipboard: runs on the Windows CI runner, which has an interactive desktop.
    #[test]
    fn restores_every_copyable_format() {
        let clipboard = WindowsClipboard;
        let original = Snapshot {
            items: vec![vec![
                Representation {
                    kind: "#13".into(),
                    data: utf16_bytes("keep me"),
                },
                Representation {
                    kind: "Layout Fixer Test Format".into(),
                    data: vec![1, 2, 3],
                },
            ]],
        };
        clipboard.restore(&original).unwrap();
        let before = clipboard.change_count();

        clipboard.write_transient_text("مرحبا").unwrap();
        assert!(clipboard.change_count() > before);
        assert_eq!(clipboard.read_text().as_deref(), Some("مرحبا"));

        clipboard.restore(&original).unwrap();
        assert_eq!(clipboard.read_text().as_deref(), Some("keep me"));
        let custom = clipboard
            .snapshot()
            .items
            .concat()
            .into_iter()
            .find(|rep| rep.kind == "Layout Fixer Test Format")
            .map(|rep| rep.data);
        // GlobalSize may round the allocation up; the original bytes come first.
        assert_eq!(
            custom.as_deref().map(|data| &data[..3]),
            Some(&[1u8, 2, 3][..])
        );
    }
}
