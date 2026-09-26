use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation, CGKeyCode};
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

use super::permissions;
use crate::fix::{FixError, Keyboard};

// Physical key codes (kVK_ANSI_C / kVK_ANSI_V): they work whatever keyboard layout is active,
// including Arabic, where there is no "c" character to look up.
const KEY_C: CGKeyCode = 0x08;
const KEY_V: CGKeyCode = 0x09;

pub struct MacKeyboard;

fn command_key(key: CGKeyCode) -> Result<(), FixError> {
    if !permissions::accessibility_trusted() {
        return Err(FixError::AccessibilityDenied);
    }
    if permissions::secure_input_enabled() {
        return Err(FixError::SecureInput);
    }
    // A private source ignores modifiers the user may still hold (⌥⇧ from the shortcut), and the
    // explicit flags make the target app see exactly ⌘+key.
    let source = CGEventSource::new(CGEventSourceStateID::Private)
        .map_err(|()| FixError::System("CGEventSource unavailable".into()))?;
    for key_down in [true, false] {
        let event = CGEvent::new_keyboard_event(source.clone(), key, key_down)
            .map_err(|()| FixError::System("CGEvent unavailable".into()))?;
        event.set_flags(CGEventFlags::CGEventFlagCommand);
        event.post(CGEventTapLocation::HID);
    }
    Ok(())
}

impl Keyboard for MacKeyboard {
    fn copy(&self) -> Result<(), FixError> {
        command_key(KEY_C)
    }

    fn paste(&self) -> Result<(), FixError> {
        command_key(KEY_V)
    }
}
