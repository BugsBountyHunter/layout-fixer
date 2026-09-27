//! XKB groups on X11. The layouts come from `_XKB_RULES_NAMES` (what `setxkbmap -query` reads), one
//! group per layout, and switching locks the group. This works where the desktop keeps every layout
//! in the keymap (KDE, Xfce, Cinnamon, MATE, window managers with setxkbmap). GNOME loads one layout
//! at a time, so there only the active layout is listed and nothing switches.

use x11rb::connection::Connection;
use x11rb::protocol::xkb::{self, ConnectionExt as _};
use x11rb::protocol::xproto::{AtomEnum, ConnectionExt as _};
use x11rb::rust_connection::RustConnection;

use super::session;
use crate::fix::{FixError, InputLayout, InputSources};
use crate::platform::ArabicLayout;

const RULES_NAMES: &[u8] = b"_XKB_RULES_NAMES";
/// XKB allows at most four groups.
const MAX_GROUPS: usize = 4;

pub struct LinuxInputSources;

/// XKB layout names are mostly country codes; these are the languages Layout Fixer converts.
fn language_of(layout: &str) -> Option<&'static str> {
    Some(match layout {
        "us" | "gb" | "au" | "ie" | "nz" | "za" => "en",
        "ara" | "eg" | "iq" | "sy" => "ar",
        _ => return None,
    })
}

/// `ara(mac)` is the Mac Arabic layout; plain `ara` is the PC one (Windows "Arabic (101)").
pub fn preferred_ids(layout: ArabicLayout) -> &'static [&'static str] {
    match layout {
        ArabicLayout::ArPc => &["ara"],
        ArabicLayout::ArMac => &["ara(mac)"],
    }
}

/// Layouts in group order from `_XKB_RULES_NAMES`: rules, model, layouts, variants, options,
/// each NUL-terminated, lists comma-separated (`evdev\0pc105\0us,ara\0,mac\0grp:alt_shift_toggle\0`).
fn parse_rules_names(value: &[u8]) -> Vec<InputLayout> {
    let text = String::from_utf8_lossy(value);
    let mut fields = text.split('\0').skip(2);
    let layouts = fields.next().unwrap_or_default();
    if layouts.is_empty() {
        return Vec::new();
    }
    let variants: Vec<&str> = fields.next().unwrap_or_default().split(',').collect();
    layouts
        .split(',')
        .take(MAX_GROUPS)
        .enumerate()
        // Positions are group numbers, so empty entries stay in the list.
        .map(|(group, layout)| {
            let variant = variants.get(group).copied().unwrap_or_default();
            InputLayout {
                id: if variant.is_empty() {
                    layout.to_owned()
                } else {
                    format!("{layout}({variant})")
                },
                languages: language_of(layout)
                    .map(|code| vec![code.to_owned()])
                    .unwrap_or_default(),
            }
        })
        .collect()
}

fn system(error: impl std::fmt::Display) -> FixError {
    FixError::System(error.to_string())
}

fn connect() -> Result<(RustConnection, usize), FixError> {
    if session::is_wayland() {
        return Err(FixError::Wayland);
    }
    let (conn, screen) = x11rb::connect(None).map_err(system)?;
    conn.xkb_use_extension(1, 0)
        .map_err(system)?
        .reply()
        .map_err(system)?;
    Ok((conn, screen))
}

fn groups(conn: &RustConnection, screen: usize) -> Result<Vec<InputLayout>, FixError> {
    let atom = conn
        .intern_atom(true, RULES_NAMES)
        .map_err(system)?
        .reply()
        .map_err(system)?
        .atom;
    if atom == x11rb::NONE {
        return Ok(Vec::new());
    }
    let root = conn.setup().roots[screen].root;
    let property = conn
        .get_property(false, root, atom, AtomEnum::STRING, 0, 1024)
        .map_err(system)?
        .reply()
        .map_err(system)?;
    Ok(parse_rules_names(&property.value))
}

fn current_group(conn: &RustConnection) -> Result<usize, FixError> {
    let state = conn
        .xkb_get_state(xkb::ID::USE_CORE_KBD.into())
        .map_err(system)?
        .reply()
        .map_err(system)?;
    Ok(usize::from(u8::from(state.group)))
}

impl InputSources for LinuxInputSources {
    fn enabled(&self) -> Result<Vec<InputLayout>, FixError> {
        let (conn, screen) = connect()?;
        groups(&conn, screen)
    }

    fn current(&self) -> Option<InputLayout> {
        let (conn, screen) = connect().ok()?;
        let group = current_group(&conn).ok()?;
        groups(&conn, screen).ok()?.into_iter().nth(group)
    }

    fn select(&self, id: &str) -> Result<(), FixError> {
        let (conn, screen) = connect()?;
        let group = groups(&conn, screen)?
            .iter()
            .position(|layout| layout.id == id)
            .ok_or_else(|| FixError::System(format!("no XKB group for {id}")))?;
        let group = u8::try_from(group).map_err(system)?;
        let lock = conn
            .xkb_latch_lock_state(
                xkb::ID::USE_CORE_KBD.into(),
                Default::default(),
                Default::default(),
                true,
                xkb::Group::from(group),
                Default::default(),
                false,
                0,
            )
            .map_err(system)?;
        // Wait for the server: a request still in flight when the connection closes can be lost.
        lock.check().map_err(system)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ids(layouts: &[InputLayout]) -> Vec<(&str, Option<&str>)> {
        layouts
            .iter()
            .map(|layout| {
                (
                    layout.id.as_str(),
                    layout.languages.first().map(String::as_str),
                )
            })
            .collect()
    }

    #[test]
    fn reads_layouts_in_group_order() {
        let layouts = parse_rules_names(b"evdev\0pc105\0us,ara\0,\0grp:alt_shift_toggle\0");
        assert_eq!(ids(&layouts), vec![("us", Some("en")), ("ara", Some("ar"))]);
    }

    #[test]
    fn keeps_variants_as_part_of_the_id() {
        let layouts = parse_rules_names(b"evdev\0pc105\0gb,ara\0,mac\0\0");
        assert_eq!(
            ids(&layouts),
            vec![("gb", Some("en")), ("ara(mac)", Some("ar"))]
        );
    }

    #[test]
    fn unknown_layouts_have_no_language() {
        let layouts = parse_rules_names(b"evdev\0pc105\0de,us\0\0\0");
        assert_eq!(ids(&layouts), vec![("de", None), ("us", Some("en"))]);
    }

    #[test]
    fn a_missing_or_short_property_lists_nothing() {
        assert!(parse_rules_names(b"").is_empty());
        assert!(parse_rules_names(b"evdev\0pc105").is_empty());
    }

    #[test]
    fn stops_at_four_groups() {
        let layouts = parse_rules_names(b"evdev\0pc105\0us,ara,de,fr,gb\0\0\0");
        assert_eq!(layouts.len(), MAX_GROUPS);
    }
}
