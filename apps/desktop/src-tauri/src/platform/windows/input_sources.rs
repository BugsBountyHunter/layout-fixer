//! Keyboard layouts (HKLs). Windows keeps the active layout per thread, so switching asks the
//! focused window to change with WM_INPUTLANGCHANGEREQUEST, as the language bar does.

use windows::Win32::Foundation::{LPARAM, WPARAM};
use windows::Win32::Globalization::LCIDToLocaleName;
use windows::Win32::UI::Input::KeyboardAndMouse::{GetKeyboardLayout, GetKeyboardLayoutList, HKL};
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, GetWindowThreadProcessId, PostMessageW, WM_INPUTLANGCHANGEREQUEST,
};

use crate::fix::{FixError, InputLayout, InputSources};
use crate::platform::ArabicLayout;

const LOCALE_NAME_MAX_LENGTH: usize = 85;
const LOCALE_ALLOW_NEUTRAL_NAMES: u32 = 0x0800_0000;

pub struct WindowsInputSources;

/// HKL ids as `HHHHLLLL`: the low word is the language, the high word the layout.
/// `04010401` is Arabic (101), the PC layout; Windows has no Mac Arabic layout.
pub fn preferred_ids(layout: ArabicLayout) -> &'static [&'static str] {
    match layout {
        ArabicLayout::ArPc => &["04010401"],
        ArabicLayout::ArMac => &[],
    }
}

/// Only the low 32 bits carry information; 64-bit Windows sign-extends the rest.
fn raw(hkl: HKL) -> u32 {
    hkl.0 as usize as u32
}

fn format_id(raw: u32) -> String {
    format!("{raw:08X}")
}

/// `ar-SA`, `en-US`… from the layout's language id.
fn locale_name(raw: u32) -> Option<String> {
    let mut name = [0u16; LOCALE_NAME_MAX_LENGTH];
    // SAFETY: the buffer outlives the call and its length is passed with it.
    let written =
        unsafe { LCIDToLocaleName(raw & 0xFFFF, Some(&mut name), LOCALE_ALLOW_NEUTRAL_NAMES) };
    let length = usize::try_from(written).ok()?.checked_sub(1)?;
    Some(String::from_utf16_lossy(&name[..length]))
}

fn layout_of(hkl: HKL) -> InputLayout {
    InputLayout {
        id: format_id(raw(hkl)),
        languages: locale_name(raw(hkl)).into_iter().collect(),
    }
}

fn installed() -> Vec<HKL> {
    // SAFETY: a `None` buffer only asks for the count.
    let count = unsafe { GetKeyboardLayoutList(None) };
    let mut list = vec![HKL(std::ptr::null_mut()); usize::try_from(count).unwrap_or_default()];
    // SAFETY: the buffer outlives the call and its length is passed with it.
    let written = unsafe { GetKeyboardLayoutList(Some(&mut list)) };
    list.truncate(usize::try_from(written).unwrap_or_default());
    list
}

impl InputSources for WindowsInputSources {
    fn enabled(&self) -> Result<Vec<InputLayout>, FixError> {
        Ok(installed().into_iter().map(layout_of).collect())
    }

    fn current(&self) -> Option<InputLayout> {
        // SAFETY: plain queries about the focused window's thread.
        let thread = unsafe { GetWindowThreadProcessId(GetForegroundWindow(), None) };
        if thread == 0 {
            return None;
        }
        Some(layout_of(unsafe { GetKeyboardLayout(thread) }))
    }

    fn select(&self, id: &str) -> Result<(), FixError> {
        let hkl = installed()
            .into_iter()
            .find(|&hkl| format_id(raw(hkl)) == id)
            .ok_or_else(|| FixError::System(format!("no keyboard layout {id}")))?;
        // SAFETY: posting a message with plain integer arguments.
        unsafe {
            let window = GetForegroundWindow();
            if window.is_invalid() {
                return Err(FixError::System("no focused window".into()));
            }
            PostMessageW(
                Some(window),
                WM_INPUTLANGCHANGEREQUEST,
                WPARAM(0),
                LPARAM(hkl.0 as isize),
            )
        }
        .map_err(|error| FixError::System(error.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ids_are_eight_hex_digits() {
        assert_eq!(format_id(0x0401_0401), "04010401");
        assert_eq!(format_id(0x0409), "00000409");
    }

    #[test]
    fn ignores_sign_extension_on_64_bit() {
        let hkl = HKL(0xFFFF_FFFF_F001_0401_u64 as usize as *mut _);
        assert_eq!(format_id(raw(hkl)), "F0010401");
    }

    #[test]
    fn names_the_language() {
        assert_eq!(locale_name(0x0401_0401).as_deref(), Some("ar-SA"));
        assert_eq!(locale_name(0x0409_0409).as_deref(), Some("en-US"));
    }
}
