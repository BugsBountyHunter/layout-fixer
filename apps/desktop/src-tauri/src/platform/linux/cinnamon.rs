//! Cinnamon 6.6 and later own the XKB group the way GNOME Shell does: Muffin locks back the group it
//! set whenever another client changes it, so a switch made through XKB is undone at once. Cinnamon's
//! own D-Bus API lists the layouts and switches them, and its panel indicator follows.

use zbus::blocking::Connection;

use super::input_sources::{language_of, layout_id};
use crate::fix::InputLayout;

const SERVICE: &str = "org.Cinnamon";
const PATH: &str = "/org/Cinnamon";
const INTERFACE: &str = "org.Cinnamon";
const XKB: &str = "xkb";

/// One entry of `GetInputSources`: type, id, index, display name, short name, flag name, XKB id,
/// XKB layout, variant, preferences, duplicate number, and whether it is the current source.
type RawSource = (
    String,
    String,
    i32,
    String,
    String,
    String,
    String,
    String,
    String,
    String,
    i32,
    bool,
);

#[derive(Debug, PartialEq, Eq)]
pub struct Source {
    pub layout: InputLayout,
    /// What `ActivateInputSourceIndex` takes.
    pub index: i32,
    pub current: bool,
}

/// XKB sources get the same ids as XKB groups (`ara(mac)`). IBus input methods keep their engine
/// name and no language, so they are never chosen.
fn source(raw: RawSource) -> Source {
    let (kind, id, index, _, _, _, _, layout, variant, _, _, current) = raw;
    let layout = if kind == XKB {
        InputLayout {
            id: layout_id(&layout, &variant),
            languages: language_of(&layout)
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

/// The user's input sources in order. Fails where Cinnamon is older than 6.6 or not running.
pub fn sources() -> zbus::Result<Vec<Source>> {
    let reply = Connection::session()?.call_method(
        Some(SERVICE),
        PATH,
        Some(INTERFACE),
        "GetInputSources",
        &(),
    )?;
    let (raw,): (Vec<RawSource>,) = reply.body().deserialize()?;
    Ok(raw.into_iter().map(source).collect())
}

pub fn activate(index: i32) -> zbus::Result<()> {
    Connection::session()?.call_method(
        Some(SERVICE),
        PATH,
        Some(INTERFACE),
        "ActivateInputSourceIndex",
        &(index,),
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn raw(
        kind: &str,
        id: &str,
        index: i32,
        layout: &str,
        variant: &str,
        current: bool,
    ) -> RawSource {
        (
            kind.into(),
            id.into(),
            index,
            String::new(),
            String::new(),
            String::new(),
            id.into(),
            layout.into(),
            variant.into(),
            String::new(),
            0,
            current,
        )
    }

    #[test]
    fn xkb_sources_use_the_xkb_group_ids() {
        let source = source(raw("xkb", "ara+mac", 2, "ara", "mac", false));
        assert_eq!(source.layout.id, "ara(mac)");
        assert_eq!(source.layout.languages, vec!["ar".to_owned()]);
        assert_eq!(source.index, 2);
    }

    #[test]
    fn keeps_the_current_flag() {
        let source = source(raw("xkb", "eg", 1, "eg", "", true));
        assert_eq!(source.layout.id, "eg");
        assert!(source.current);
    }

    #[test]
    fn input_methods_have_no_language() {
        let source = source(raw("ibus", "anthy", 3, "jp", "", false));
        assert_eq!(source.layout.id, "anthy");
        assert!(source.layout.languages.is_empty());
    }
}
