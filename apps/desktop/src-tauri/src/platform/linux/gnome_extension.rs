//! Installs Layout Fixer's GNOME Shell extension for the current user and reports whether it runs.
//! GNOME Shell only loads extensions it finds at login, so after the first install the user logs out
//! and back in. `gnome-extensions enable` can't be used: it asks the running Shell, which doesn't
//! know an extension installed after login, so the UUID goes into `enabled-extensions` directly.

use std::collections::HashMap;
use std::path::PathBuf;

use gio::prelude::*;
use zbus::blocking::Connection;
use zbus::zvariant::OwnedValue;

use super::{gnome, session};
use crate::platform::GnomeSwitching;

const UUID: &str = "layout-fixer@layoutfixer.dev";
const FILES: [(&str, &str); 2] = [
    (
        "extension.js",
        include_str!("../../../gnome-extension/extension.js"),
    ),
    (
        "metadata.json",
        include_str!("../../../gnome-extension/metadata.json"),
    ),
];
const SHELL_SCHEMA: &str = "org.gnome.shell";
const ENABLED: &str = "enabled-extensions";
const DISABLED: &str = "disabled-extensions";
const USER_EXTENSIONS_OFF: &str = "disable-user-extensions";
/// `ExtensionState.ERROR` and `OUT_OF_DATE`: GNOME found the extension but can't run it.
const BROKEN_STATES: [f64; 2] = [3.0, 4.0];

fn directory() -> Option<PathBuf> {
    let data = session::xdg_dir("XDG_DATA_HOME", ".local/share")?;
    Some(data.join("gnome-shell/extensions").join(UUID))
}

fn installed() -> bool {
    directory().is_some_and(|dir| FILES.iter().all(|(name, _)| dir.join(name).is_file()))
}

/// `None` where GNOME Shell's settings schema isn't installed (not a GNOME system).
fn shell_settings() -> Option<gio::Settings> {
    let schema = gio::SettingsSchemaSource::default()?.lookup(SHELL_SCHEMA, true)?;
    Some(gio::Settings::new_full(
        &schema,
        None::<&gio::SettingsBackend>,
        None,
    ))
}

fn listed(settings: &gio::Settings, key: &str) -> bool {
    settings.strv(key).iter().any(|uuid| uuid.as_str() == UUID)
}

/// The list with our UUID added or removed; `None` when it is already so.
fn with_uuid(list: &[String], present: bool) -> Option<Vec<String>> {
    let has = list.iter().any(|uuid| uuid == UUID);
    match (present, has) {
        (true, false) => Some(list.iter().cloned().chain([UUID.to_owned()]).collect()),
        (false, true) => Some(list.iter().filter(|uuid| *uuid != UUID).cloned().collect()),
        _ => None,
    }
}

fn set_listed(settings: &gio::Settings, key: &str, present: bool) -> Result<(), String> {
    let list: Vec<String> = settings.strv(key).iter().map(|s| s.to_string()).collect();
    match with_uuid(&list, present) {
        Some(list) => settings
            .set_strv(key, list)
            .map_err(|error| error.to_string()),
        None => Ok(()),
    }
}

/// GNOME Shell's state for the extension; `None` when the Shell hasn't loaded it (installed after
/// login) or doesn't answer.
fn shell_state() -> Option<f64> {
    let reply = Connection::session()
        .ok()?
        .call_method(
            Some("org.gnome.Shell"),
            "/org/gnome/Shell",
            Some("org.gnome.Shell.Extensions"),
            "GetExtensionInfo",
            &(UUID,),
        )
        .ok()?;
    let (info,): (HashMap<String, OwnedValue>,) = reply.body().deserialize().ok()?;
    f64::try_from(info.get("state")?.clone()).ok()
}

pub fn status() -> GnomeSwitching {
    if !session::is_gnome() {
        return GnomeSwitching::Unavailable;
    }
    if gnome::sources().is_ok() {
        return GnomeSwitching::On;
    }
    let Some(settings) = shell_settings() else {
        return GnomeSwitching::Unavailable;
    };
    if !installed() || !listed(&settings, ENABLED) {
        return GnomeSwitching::Off;
    }
    if settings.boolean(USER_EXTENSIONS_OFF) {
        return GnomeSwitching::ExtensionsOff;
    }
    match shell_state() {
        Some(state) if BROKEN_STATES.contains(&state) => GnomeSwitching::Incompatible,
        _ => GnomeSwitching::LogOut,
    }
}

fn write_files() -> Result<(), String> {
    let dir = directory().ok_or("no home directory")?;
    std::fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    for (name, content) in FILES {
        std::fs::write(dir.join(name), content).map_err(|error| error.to_string())?;
    }
    Ok(())
}

/// Installs the extension and adds it to GNOME's enabled extensions; it runs from the next login.
pub fn enable() -> Result<GnomeSwitching, String> {
    if !session::is_gnome() {
        return Ok(GnomeSwitching::Unavailable);
    }
    let settings = shell_settings().ok_or("GNOME Shell's settings are missing")?;
    write_files()?;
    set_listed(&settings, ENABLED, true)?;
    set_listed(&settings, DISABLED, false)?;
    gio::Settings::sync();
    Ok(status())
}

/// Keeps an installed copy in step with the app after an update; GNOME loads it at the next login.
pub fn refresh() {
    let Some(dir) = directory() else { return };
    let outdated = FILES.iter().any(|(name, content)| {
        std::fs::read_to_string(dir.join(name)).ok().as_deref() != Some(content)
    });
    if installed() && outdated {
        if let Err(error) = write_files() {
            eprintln!("[layout-fixer] Could not update the GNOME Shell extension: {error}");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn list(items: &[&str]) -> Vec<String> {
        items.iter().map(|item| (*item).to_owned()).collect()
    }

    #[test]
    fn adds_the_uuid_once() {
        assert_eq!(
            with_uuid(&list(&["other@x"]), true),
            Some(list(&["other@x", UUID]))
        );
        assert_eq!(with_uuid(&list(&[UUID]), true), None);
    }

    #[test]
    fn removes_only_the_uuid() {
        assert_eq!(
            with_uuid(&list(&["a@x", UUID, "b@x"]), false),
            Some(list(&["a@x", "b@x"]))
        );
        assert_eq!(with_uuid(&list(&["a@x"]), false), None);
    }

    #[test]
    fn ships_the_extension_under_its_uuid() {
        let metadata: serde_json::Value = serde_json::from_str(FILES[1].1).unwrap();
        assert_eq!(metadata["uuid"], UUID);
    }
}
