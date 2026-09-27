//! GNOME Shell keeps the current input source itself, and Mutter locks back its own XKB group when
//! another app changes it, so on GNOME layouts switch through Layout Fixer's GNOME Shell extension
//! (`gnome-extension/`), which the user turns on in Settings (see `gnome_extension`).

use zbus::blocking::Connection;

use super::input_sources::{language_of, layout_id, Source};
use crate::fix::InputLayout;

const SERVICE: &str = "org.gnome.Shell";
const PATH: &str = "/org/gnome/Shell/Extensions/LayoutFixer";
const INTERFACE: &str = "org.gnome.Shell.Extensions.LayoutFixer";
const XKB: &str = "xkb";

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

fn call<B>(method: &str, body: &B) -> zbus::Result<zbus::Message>
where
    B: serde::Serialize + zbus::zvariant::DynamicType,
{
    Connection::session()?.call_method(Some(SERVICE), PATH, Some(INTERFACE), method, body)
}

/// The input sources in GNOME's order. Fails while the extension isn't running.
pub(super) fn sources() -> zbus::Result<Vec<Source>> {
    let (raw,): (Vec<RawSource>,) = call("List", &())?.body().deserialize()?;
    Ok(raw.into_iter().map(source).collect())
}

pub(super) fn activate(index: u32) -> zbus::Result<()> {
    call("Activate", &(index,)).map(drop)
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
    fn input_methods_have_no_language() {
        let anthy = source(("ibus".into(), "anthy".into(), 1, false));
        assert_eq!(anthy.layout.id, "anthy");
        assert!(anthy.layout.languages.is_empty());
    }
}
