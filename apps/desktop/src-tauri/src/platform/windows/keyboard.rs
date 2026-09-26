use std::{thread, time::Duration};

use windows::Win32::Foundation::CloseHandle;
use windows::Win32::Security::{GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY};
use windows::Win32::System::Threading::{
    GetCurrentProcess, OpenProcess, OpenProcessToken, PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    GetAsyncKeyState, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS,
    KEYEVENTF_KEYUP, VIRTUAL_KEY, VK_CONTROL, VK_LWIN, VK_MENU, VK_RWIN, VK_SHIFT,
};
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};

use crate::fix::{FixError, Keyboard};

// Virtual keys for C and V are the same on every layout, Arabic included.
const VK_C: VIRTUAL_KEY = VIRTUAL_KEY(0x43);
const VK_V: VIRTUAL_KEY = VIRTUAL_KEY(0x56);
const HELD_MODIFIERS: [VIRTUAL_KEY; 4] = [VK_MENU, VK_SHIFT, VK_LWIN, VK_RWIN];
const MODIFIER_WAIT: Duration = Duration::from_millis(600);

pub struct WindowsKeyboard;

fn key(vk: VIRTUAL_KEY, flags: KEYBD_EVENT_FLAGS) -> INPUT {
    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: vk,
                wScan: 0,
                dwFlags: flags,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}

fn is_down(vk: VIRTUAL_KEY) -> bool {
    // SAFETY: reads global key state; the high bit means "down".
    let state = unsafe { GetAsyncKeyState(i32::from(vk.0)) };
    state < 0
}

/// The user may still hold ⌥⇧ from the shortcut; give them a moment to let go.
fn held_modifiers_after_wait() -> Vec<VIRTUAL_KEY> {
    let mut waited = Duration::ZERO;
    loop {
        let held: Vec<_> = HELD_MODIFIERS
            .into_iter()
            .filter(|&vk| is_down(vk))
            .collect();
        if held.is_empty() || waited >= MODIFIER_WAIT {
            return held;
        }
        thread::sleep(Duration::from_millis(10));
        waited += Duration::from_millis(10);
    }
}

/// Ctrl goes down first so that releasing a still-held Alt or Win doesn't open a menu or Start.
fn ctrl_chord(letter: VIRTUAL_KEY, held: &[VIRTUAL_KEY]) -> Vec<INPUT> {
    let mut inputs = vec![key(VK_CONTROL, KEYBD_EVENT_FLAGS(0))];
    inputs.extend(held.iter().map(|&vk| key(vk, KEYEVENTF_KEYUP)));
    inputs.extend([
        key(letter, KEYBD_EVENT_FLAGS(0)),
        key(letter, KEYEVENTF_KEYUP),
        key(VK_CONTROL, KEYEVENTF_KEYUP),
    ]);
    inputs
}

fn is_elevated(process: windows::Win32::Foundation::HANDLE) -> Option<bool> {
    let mut token = Default::default();
    let mut elevation = TOKEN_ELEVATION::default();
    let mut size = 0;
    // SAFETY: the out-pointers live until the calls return; the token handle is closed below.
    unsafe {
        OpenProcessToken(process, TOKEN_QUERY, &mut token).ok()?;
        let read = GetTokenInformation(
            token,
            TokenElevation,
            Some(std::ptr::from_mut(&mut elevation).cast()),
            size_of::<TOKEN_ELEVATION>() as u32,
            &mut size,
        );
        let _ = CloseHandle(token);
        read.ok()?;
    }
    Some(elevation.TokenIsElevated != 0)
}

/// Windows drops synthetic keys aimed at apps running as administrator (UIPI) when we are not.
fn foreground_is_elevated_above_us() -> bool {
    // SAFETY: the pseudo handle needs no closing.
    if is_elevated(unsafe { GetCurrentProcess() }) == Some(true) {
        return false;
    }
    let mut pid = 0;
    // SAFETY: the out-pointer lives until the call returns.
    unsafe { GetWindowThreadProcessId(GetForegroundWindow(), Some(&mut pid)) };
    if pid == 0 {
        return false;
    }
    // SAFETY: the process handle is closed below.
    let Ok(process) = (unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) })
    else {
        return false;
    };
    // An elevated process refuses our token query outright; treat that as elevated too.
    let elevated = is_elevated(process).unwrap_or(true);
    // SAFETY: opened above.
    let _ = unsafe { CloseHandle(process) };
    elevated
}

fn send_ctrl(letter: VIRTUAL_KEY) -> Result<(), FixError> {
    if foreground_is_elevated_above_us() {
        return Err(FixError::ElevatedApp);
    }
    let inputs = ctrl_chord(letter, &held_modifiers_after_wait());
    // SAFETY: `inputs` outlives the call and INPUT's size is passed as required.
    let sent = unsafe { SendInput(&inputs, size_of::<INPUT>() as i32) };
    if sent as usize == inputs.len() {
        Ok(())
    } else {
        Err(FixError::System(format!(
            "SendInput sent {sent} of {} events",
            inputs.len()
        )))
    }
}

impl Keyboard for WindowsKeyboard {
    fn copy(&self) -> Result<(), FixError> {
        send_ctrl(VK_C)
    }

    fn paste(&self) -> Result<(), FixError> {
        send_ctrl(VK_V)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn describe(inputs: &[INPUT]) -> Vec<(u16, bool)> {
        inputs
            .iter()
            // SAFETY: every INPUT built here is a keyboard event.
            .map(|input| unsafe {
                (
                    input.Anonymous.ki.wVk.0,
                    input.Anonymous.ki.dwFlags == KEYEVENTF_KEYUP,
                )
            })
            .collect()
    }

    #[test]
    fn plain_chord_is_ctrl_c() {
        assert_eq!(
            describe(&ctrl_chord(VK_C, &[])),
            vec![
                (VK_CONTROL.0, false),
                (0x43, false),
                (0x43, true),
                (VK_CONTROL.0, true)
            ]
        );
    }

    #[test]
    fn releases_held_modifiers_after_ctrl_is_down() {
        assert_eq!(
            describe(&ctrl_chord(VK_V, &[VK_MENU, VK_SHIFT])),
            vec![
                (VK_CONTROL.0, false),
                (VK_MENU.0, true),
                (VK_SHIFT.0, true),
                (0x56, false),
                (0x56, true),
                (VK_CONTROL.0, true),
            ]
        );
    }
}
