//! KDE Plasma switches layouts through KWin's D-Bus API, on Wayland as on X11. KWin reports each
//! layout's short name (`ara`) without its variant, so variants come from the user's `kxkbrc`.

use std::path::PathBuf;

use zbus::blocking::Connection;

use super::input_sources::{language_of, layout_id, Source};
use super::session;
use crate::fix::InputLayout;

const SERVICE: &str = "org.kde.keyboard";
const PATH: &str = "/Layouts";
const INTERFACE: &str = "org.kde.KeyboardLayouts";

/// Short name, display name, long name.
type LayoutNames = (String, String, String);

/// `LayoutList` and `VariantList` from the `[Layout]` group of `kxkbrc`.
fn configured(kxkbrc: &str) -> (Vec<String>, Vec<String>) {
    let mut in_layout = false;
    let (mut layouts, mut variants) = (Vec::new(), Vec::new());
    for line in kxkbrc.lines().map(str::trim) {
        if line.starts_with('[') {
            in_layout = line == "[Layout]";
            continue;
        }
        let Some((key, value)) = line.split_once('=').filter(|_| in_layout) else {
            continue;
        };
        let list = || {
            value
                .split(',')
                .map(|item| item.trim().to_owned())
                .collect()
        };
        match key.trim() {
            "LayoutList" => layouts = list(),
            "VariantList" => variants = list(),
            _ => {}
        }
    }
    (layouts, variants)
}

/// Variants line up with KWin's layouts only while `kxkbrc` lists the same layouts in the same order;
/// otherwise (a layout from the system default, a stale file) the ids go without variants.
fn sources(names: &[String], current: u32, kxkbrc: &str) -> Vec<Source> {
    let (layouts, variants) = configured(kxkbrc);
    let variants_match = layouts == names;
    names
        .iter()
        .zip(0u32..)
        .map(|(name, index)| {
            let variant = variants
                .get(index as usize)
                .filter(|_| variants_match)
                .map_or("", String::as_str);
            Source {
                layout: InputLayout {
                    id: layout_id(name, variant),
                    languages: language_of(name)
                        .map(|code| vec![code.to_owned()])
                        .unwrap_or_default(),
                },
                index,
                current: index == current,
            }
        })
        .collect()
}

fn kxkbrc_path() -> Option<PathBuf> {
    Some(session::xdg_dir("XDG_CONFIG_HOME", ".config")?.join("kxkbrc"))
}

/// The layouts in KWin's order. Fails where KWin (or Plasma 5's keyboard daemon) doesn't answer.
pub(super) fn layouts() -> zbus::Result<Vec<Source>> {
    let connection = Connection::session()?;
    let call =
        |method: &str| connection.call_method(Some(SERVICE), PATH, Some(INTERFACE), method, &());
    let (list,): (Vec<LayoutNames>,) = call("getLayoutsList")?.body().deserialize()?;
    let (current,): (u32,) = call("getLayout")?.body().deserialize()?;
    let names: Vec<String> = list.into_iter().map(|(short, _, _)| short).collect();
    let kxkbrc = kxkbrc_path()
        .and_then(|path| std::fs::read_to_string(path).ok())
        .unwrap_or_default();
    Ok(sources(&names, current, &kxkbrc))
}

/// `false` from KWin means the index no longer exists (the list changed in between).
pub(super) fn activate(index: u32) -> zbus::Result<bool> {
    let reply = Connection::session()?.call_method(
        Some(SERVICE),
        PATH,
        Some(INTERFACE),
        "setLayout",
        &(index,),
    )?;
    let (switched,): (bool,) = reply.body().deserialize()?;
    Ok(switched)
}

#[cfg(test)]
mod tests {
    use super::*;

    const KXKBRC: &str = "[$Version]\nupdate_info=kxkb.upd:remove-empty-lists\n\n[Layout]\nDisplayNames=,\nLayoutList=us,ara\nUse=true\nVariantList=,mac\n";

    fn names(list: &[&str]) -> Vec<String> {
        list.iter().map(|name| (*name).to_owned()).collect()
    }

    fn ids(sources: &[Source]) -> Vec<(&str, Option<&str>, bool)> {
        sources
            .iter()
            .map(|source| {
                (
                    source.layout.id.as_str(),
                    source.layout.languages.first().map(String::as_str),
                    source.current,
                )
            })
            .collect()
    }

    #[test]
    fn adds_the_variants_from_kxkbrc() {
        let sources = sources(&names(&["us", "ara"]), 1, KXKBRC);
        assert_eq!(
            ids(&sources),
            vec![("us", Some("en"), false), ("ara(mac)", Some("ar"), true)]
        );
        assert_eq!(sources[1].index, 1);
    }

    #[test]
    fn ignores_variants_when_kxkbrc_lists_other_layouts() {
        let sources = sources(&names(&["us", "eg"]), 0, KXKBRC);
        assert_eq!(
            ids(&sources),
            vec![("us", Some("en"), true), ("eg", Some("ar"), false)]
        );
    }

    #[test]
    fn works_without_kxkbrc() {
        let sources = sources(&names(&["us", "ara"]), 0, "");
        assert_eq!(sources[1].layout.id, "ara");
    }

    #[test]
    fn reads_only_the_layout_group() {
        let text = "[Other]\nLayoutList=de\n[Layout]\nLayoutList=us, ara\nVariantList=,mac\n";
        assert_eq!(
            configured(text),
            (names(&["us", "ara"]), names(&["", "mac"]))
        );
    }
}
