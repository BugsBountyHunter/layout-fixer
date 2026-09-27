//! The global shortcut on KDE Plasma under Wayland, through kglobalaccel (KWin), the way every KDE
//! app registers one. It then also shows up in System Settings → Shortcuts.

use std::sync::OnceLock;

use zbus::blocking::{Connection, MessageIterator};
use zbus::MatchRule;

const SERVICE: &str = "org.kde.kglobalaccel";
const PATH: &str = "/kglobalaccel";
const INTERFACE: &str = "org.kde.KGlobalAccel";
const COMPONENT_INTERFACE: &str = "org.kde.kglobalaccel.Component";
const COMPONENT: &str = "layout-fixer";
const ACTION: &str = "fix";
/// `KGlobalAccel::SetPresent | NoAutoloading`: the app's own setting wins over a saved one.
const SET_FLAGS: u32 = 2 | 4;

const SHIFT: i32 = 0x0200_0000;
const CONTROL: i32 = 0x0400_0000;
const ALT: i32 = 0x0800_0000;
const META: i32 = 0x1000_0000;
const KEY_F1: i32 = 0x0100_0030;

/// Component, action, and their names in System Settings. A slice, because serde sends a fixed-size
/// array as a D-Bus struct (`(ssss)`) where kglobalaccel expects a string array (`as`).
const ACTION_ID: &[&str] = &[COMPONENT, ACTION, "Layout Fixer", "Fix the selected text"];

/// Our accelerators (`Alt+Shift+F`, from the Settings recorder) as a Qt key combination.
fn qt_key(accelerator: &str) -> Option<i32> {
    let mut parts: Vec<&str> = accelerator
        .split('+')
        .filter(|part| !part.is_empty())
        .collect();
    let key = parts.pop()?;
    let modifiers = parts.into_iter().try_fold(0, |mask, modifier| {
        let bit = match modifier.to_ascii_lowercase().as_str() {
            "ctrl" | "control" | "cmdorctrl" | "commandorcontrol" => CONTROL,
            "alt" | "option" => ALT,
            "shift" => SHIFT,
            "super" | "cmd" | "command" | "meta" => META,
            _ => return None,
        };
        Some(mask | bit)
    })?;
    let key = match key.as_bytes() {
        [letter] if letter.is_ascii_alphanumeric() => i32::from(letter.to_ascii_uppercase()),
        [b'F', number @ ..] => match std::str::from_utf8(number).ok()?.parse::<i32>() {
            Ok(n @ 1..=24) => KEY_F1 + n - 1,
            _ => return None,
        },
        _ => return None,
    };
    Some(modifiers | key)
}

/// One connection for the life of the process, like the rest of the app's D-Bus calls.
fn connection() -> zbus::Result<Connection> {
    static CONNECTION: OnceLock<Connection> = OnceLock::new();
    if let Some(connection) = CONNECTION.get() {
        return Ok(connection.clone());
    }
    let connection = Connection::session()?;
    Ok(CONNECTION.get_or_init(|| connection).clone())
}

fn call<B>(method: &str, body: &B) -> zbus::Result<zbus::Message>
where
    B: serde::Serialize + zbus::zvariant::DynamicType,
{
    connection()?.call_method(Some(SERVICE), PATH, Some(INTERFACE), method, body)
}

/// Registers the shortcut; `false` when kglobalaccel isn't running or another action owns it.
pub(super) fn grab(accelerator: &str) -> bool {
    let Some(key) = qt_key(accelerator) else {
        return false;
    };
    let register = || -> zbus::Result<bool> {
        call("doRegister", &(ACTION_ID,))?;
        let keys: Vec<(Vec<i32>,)> = vec![(vec![key],)];
        let (set,): (Vec<(Vec<i32>,)>,) = call("setShortcutKeys", &(ACTION_ID, keys, SET_FLAGS))?
            .body()
            .deserialize()?;
        Ok(set.iter().any(|(sequence,)| sequence.first() == Some(&key)))
    };
    register().unwrap_or(false)
}

/// Clears the key, so the combination reaches other apps; the action stays listed.
pub(super) fn release() {
    let keys: Vec<(Vec<i32>,)> = Vec::new();
    let _ = call("setShortcutKeys", &(ACTION_ID, keys, SET_FLAGS));
}

/// Blocks, calling `on_released` each time the shortcut is let go. Returns when the bus goes away.
pub(super) fn watch_released(on_released: impl Fn()) -> zbus::Result<()> {
    let connection = connection()?;
    let (component,): (zbus::zvariant::OwnedObjectPath,) =
        call("getComponent", &(COMPONENT,))?.body().deserialize()?;
    let rule = MatchRule::builder()
        .msg_type(zbus::message::Type::Signal)
        .path(component)?
        .interface(COMPONENT_INTERFACE)?
        .member("globalShortcutReleased")?
        .build();
    for message in MessageIterator::for_match_rule(rule, &connection, None)?.flatten() {
        let ours = message
            .body()
            .deserialize::<(String, String, i64)>()
            .is_ok_and(|(_, action, _)| action == ACTION);
        if ours {
            on_released();
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sends_the_action_id_as_a_string_array() {
        use zbus::zvariant::Type;
        assert_eq!(<(&[&str],)>::SIGNATURE.to_string(), "(as)");
        assert_eq!(ACTION_ID.len(), 4);
    }

    #[test]
    fn converts_accelerators_to_qt_keys() {
        assert_eq!(qt_key("Alt+Shift+F"), Some(ALT | SHIFT | 0x46));
        assert_eq!(qt_key("Super+Ctrl+2"), Some(META | CONTROL | 0x32));
        assert_eq!(qt_key("CmdOrCtrl+F12"), Some(CONTROL | (KEY_F1 + 11)));
        assert_eq!(qt_key("Ctrl+F25"), None);
        assert_eq!(qt_key("Hyper+K"), None);
        assert_eq!(qt_key(""), None);
    }
}
