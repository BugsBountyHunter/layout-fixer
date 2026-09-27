//! Layout Fixer's GNOME Shell extension (`gnome-extension/`), which the user turns on in Settings (see
//! `gnome_extension`). GNOME Shell keeps the current input source itself and Mutter locks back its own
//! XKB group, so layouts switch through it; on Wayland it also presses Ctrl+C / Ctrl+V, serves the
//! clipboard and grabs the shortcut, which GNOME lets no other app do.

use std::collections::HashMap;
use std::sync::OnceLock;

use zbus::blocking::{Connection, MessageIterator};
use zbus::MatchRule;

use super::input_sources::{language_of, layout_id, Source};
use crate::fix::InputLayout;

const SERVICE: &str = "org.gnome.Shell";
const PATH: &str = "/org/gnome/Shell/Extensions/LayoutFixer";
const INTERFACE: &str = "org.gnome.Shell.Extensions.LayoutFixer";
const XKB: &str = "xkb";
/// The API that fixes text on Wayland; version 1 (desktop 1.4.0) only switched layouts.
const FIX_API_VERSION: u32 = 2;

/// Type, id (`ara+mac`), index, and whether it is the current source.
type RawSource = (String, String, u32, bool);

/// XKB sources get the same ids as XKB groups (`ara(mac)`); IBus input methods keep their engine
/// name and no language, so they are never chosen.
fn source((kind, id, index, current): RawSource) -> Source {
    let layout = if kind == XKB {
        let (layout, variant) = id.split_once('+').unwrap_or((&id, ""));
        InputLayout {
            id: layout_id(layout, variant),
            languages: language_of(layout)
                .map(|code| vec![code.to_owned()])
                .unwrap_or_default(),
        }
    } else {
        InputLayout {
            id,
            languages: Vec::new(),
        }
    };
    Source {
        layout,
        index,
        current,
    }
}

/// One connection for the life of the process: the extension ties the shortcut grab to the caller's
/// bus name, which a connection per call would give up as soon as the call returned.
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

/// The input sources in GNOME's order. Fails while the extension isn't running.
pub(super) fn sources() -> zbus::Result<Vec<Source>> {
    let (raw,): (Vec<RawSource>,) = call("List", &())?.body().deserialize()?;
    Ok(raw.into_iter().map(source).collect())
}

pub(super) fn activate(index: u32) -> zbus::Result<()> {
    call("Activate", &(index,)).map(drop)
}

/// The running extension's API version: `None` when it isn't running, 1 for the first release,
/// which had no `ApiVersion` method.
pub(super) fn api_version() -> Option<u32> {
    match call("ApiVersion", &()).and_then(|reply| reply.body().deserialize::<(u32,)>()) {
        Ok((version,)) => Some(version),
        Err(_) => sources().ok().map(|_| 1),
    }
}

/// Whether the running extension can fix text (Wayland) and not only switch layouts.
pub(super) fn can_fix() -> bool {
    api_version().is_some_and(|version| version >= FIX_API_VERSION)
}

pub(super) fn copy() -> zbus::Result<()> {
    call("Copy", &()).map(drop)
}

pub(super) fn paste() -> zbus::Result<()> {
    call("Paste", &()).map(drop)
}

/// Counts clipboard owner changes, including a copy of identical text.
pub(super) fn clipboard_serial() -> zbus::Result<u32> {
    let (serial,): (u32,) = call("ClipboardSerial", &())?.body().deserialize()?;
    Ok(serial)
}

/// The clipboard as MIME type → bytes, for the types the extension handles.
pub(super) fn read_clipboard() -> zbus::Result<HashMap<String, Vec<u8>>> {
    let (content,): (HashMap<String, Vec<u8>>,) =
        call("ReadClipboard", &())?.body().deserialize()?;
    Ok(content)
}

/// Puts the first type the extension handles on the clipboard (GNOME Shell holds one at a time).
pub(super) fn write_clipboard(content: &HashMap<String, Vec<u8>>) -> zbus::Result<()> {
    call("WriteClipboard", &(content,)).map(drop)
}

/// Grabs a GTK accelerator (`<Alt><Shift>f`) for this app; an empty one releases it. GNOME Shell
/// releases it too when the app quits.
pub(super) fn set_shortcut(accelerator: &str) -> zbus::Result<bool> {
    let (grabbed,): (bool,) = call("SetShortcut", &(accelerator,))?.body().deserialize()?;
    Ok(grabbed)
}

/// Blocks, calling `on_activated` for each press of the grabbed shortcut. Returns when the session
/// bus goes away.
pub(super) fn watch_activated(on_activated: impl Fn()) -> zbus::Result<()> {
    let connection = connection()?;
    let rule = MatchRule::builder()
        .msg_type(zbus::message::Type::Signal)
        .path(PATH)?
        .interface(INTERFACE)?
        .member("Activated")?
        .build();
    for _ in MessageIterator::for_match_rule(rule, &connection, None)?.flatten() {
        on_activated();
    }
    Ok(())
}

/// Our accelerators (`Alt+Shift+F`, from the Settings recorder) as GTK accelerators
/// (`<Alt><Shift>f`), which GNOME Shell grabs. `None` for a key it wouldn't know.
pub(super) fn gtk_accelerator(accelerator: &str) -> Option<String> {
    let mut parts: Vec<&str> = accelerator
        .split('+')
        .filter(|part| !part.is_empty())
        .collect();
    let key = parts.pop()?;
    let modifiers = parts
        .into_iter()
        .map(|modifier| match modifier.to_ascii_lowercase().as_str() {
            "ctrl" | "control" | "cmdorctrl" | "commandorcontrol" => Some("<Control>"),
            "alt" | "option" => Some("<Alt>"),
            "shift" => Some("<Shift>"),
            "super" | "cmd" | "command" | "meta" => Some("<Super>"),
            _ => None,
        })
        .collect::<Option<String>>()?;
    let key = match key.as_bytes() {
        [letter] if letter.is_ascii_alphanumeric() => {
            char::from(letter.to_ascii_lowercase()).to_string()
        }
        [b'F', number @ ..]
            if matches!(std::str::from_utf8(number).ok()?.parse::<u8>(), Ok(1..=24)) =>
        {
            key.to_owned()
        }
        _ => return None,
    };
    Some(format!("{modifiers}{key}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn xkb_sources_use_the_xkb_group_ids() {
        let mac = source(("xkb".into(), "ara+mac".into(), 2, true));
        assert_eq!(mac.layout.id, "ara(mac)");
        assert_eq!(mac.layout.languages, vec!["ar".to_owned()]);
        assert_eq!((mac.index, mac.current), (2, true));
        assert_eq!(
            source(("xkb".into(), "us".into(), 0, false)).layout.id,
            "us"
        );
    }

    #[test]
    fn converts_accelerators_for_gnome_shell() {
        assert_eq!(
            gtk_accelerator("Alt+Shift+F").as_deref(),
            Some("<Alt><Shift>f")
        );
        assert_eq!(
            gtk_accelerator("Super+Ctrl+2").as_deref(),
            Some("<Super><Control>2")
        );
        assert_eq!(
            gtk_accelerator("CmdOrCtrl+F12").as_deref(),
            Some("<Control>F12")
        );
        assert_eq!(gtk_accelerator("Ctrl+F25"), None);
        assert_eq!(gtk_accelerator("Hyper+K"), None);
        assert_eq!(gtk_accelerator("Alt+Space"), None);
        assert_eq!(gtk_accelerator(""), None);
    }

    #[test]
    fn input_methods_have_no_language() {
        let anthy = source(("ibus".into(), "anthy".into(), 1, false));
        assert_eq!(anthy.layout.id, "anthy");
        assert!(anthy.layout.languages.is_empty());
    }
}
