use std::{thread, time::Duration};

use x11rb::connection::Connection;
use x11rb::protocol::xproto::{ConnectionExt as _, KEY_PRESS_EVENT, KEY_RELEASE_EVENT};
use x11rb::protocol::xtest::ConnectionExt as _;
use x11rb::wrapper::ConnectionExt as _;

use super::session;
use crate::fix::{FixError, Keyboard};

// Evdev keycodes, used by every current X server (Xorg and XWayland). They name physical keys, so
// Ctrl+C works whichever layout is active, Arabic included.
const CONTROL_L: u8 = 37;
const KEY_C: u8 = 54;
const KEY_V: u8 = 55;
/// Shift L/R, Alt L/R, Super L/R.
const HELD_MODIFIERS: [u8; 6] = [50, 62, 64, 108, 133, 134];
const MODIFIER_WAIT: Duration = Duration::from_millis(600);

pub struct LinuxKeyboard;

fn system(error: impl std::fmt::Display) -> FixError {
    FixError::System(error.to_string())
}

fn is_down(keymap: &[u8; 32], keycode: u8) -> bool {
    keymap[usize::from(keycode / 8)] & (1 << (keycode % 8)) != 0
}

/// The user may still hold Alt+Shift from the shortcut; give them a moment to let go.
fn held_modifiers_after_wait(conn: &impl Connection) -> Result<Vec<u8>, FixError> {
    let mut waited = Duration::ZERO;
    loop {
        let keymap = conn
            .query_keymap()
            .map_err(system)?
            .reply()
            .map_err(system)?
            .keys;
        let held: Vec<u8> = HELD_MODIFIERS
            .into_iter()
            .filter(|&key| is_down(&keymap, key))
            .collect();
        if held.is_empty() || waited >= MODIFIER_WAIT {
            return Ok(held);
        }
        thread::sleep(Duration::from_millis(10));
        waited += Duration::from_millis(10);
    }
}

/// (event type, keycode) pairs: Ctrl goes down before still-held modifiers are released.
fn ctrl_chord(letter: u8, held: &[u8]) -> Vec<(u8, u8)> {
    let mut events = vec![(KEY_PRESS_EVENT, CONTROL_L)];
    events.extend(held.iter().map(|&key| (KEY_RELEASE_EVENT, key)));
    events.extend([
        (KEY_PRESS_EVENT, letter),
        (KEY_RELEASE_EVENT, letter),
        (KEY_RELEASE_EVENT, CONTROL_L),
    ]);
    events
}

fn send_ctrl(letter: u8) -> Result<(), FixError> {
    if session::is_wayland() {
        return Err(FixError::Wayland);
    }
    let (conn, _screen) = x11rb::connect(None).map_err(system)?;
    for (event, keycode) in ctrl_chord(letter, &held_modifiers_after_wait(&conn)?) {
        conn.xtest_fake_input(event, keycode, x11rb::CURRENT_TIME, x11rb::NONE, 0, 0, 0)
            .map_err(system)?;
    }
    conn.sync().map_err(system)
}

impl Keyboard for LinuxKeyboard {
    fn copy(&self) -> Result<(), FixError> {
        send_ctrl(KEY_C)
    }

    fn paste(&self) -> Result<(), FixError> {
        send_ctrl(KEY_V)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_the_keymap_bitmap() {
        let mut keymap = [0u8; 32];
        keymap[8] = 0b0000_0001; // keycode 64 (Alt_L)
        assert!(is_down(&keymap, 64));
        assert!(!is_down(&keymap, 50));
    }

    #[test]
    fn releases_held_modifiers_after_ctrl_is_down() {
        assert_eq!(
            ctrl_chord(KEY_V, &[64]),
            vec![
                (KEY_PRESS_EVENT, CONTROL_L),
                (KEY_RELEASE_EVENT, 64),
                (KEY_PRESS_EVENT, KEY_V),
                (KEY_RELEASE_EVENT, KEY_V),
                (KEY_RELEASE_EVENT, CONTROL_L),
            ]
        );
    }
}
