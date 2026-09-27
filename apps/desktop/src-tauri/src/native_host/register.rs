//! Tells the browsers where the native host is. Chromium browsers and Firefox read a small JSON
//! manifest per host: from their profile folder on macOS and Linux, and from a path in the registry
//! on Windows. Manifests are written at every launch (the app may have moved), only for browsers
//! that are installed, and only when the content changed.

// Windows keeps manifests next to the app and points the registry at them (windows_registry.rs).
#![cfg_attr(windows, allow(dead_code))]

use std::path::{Path, PathBuf};

use serde_json::json;

pub const HOST_NAME: &str = "io.github.bugsbountyhunter.layoutfixer";
/// The Chrome Web Store listing.
const CHROME_EXTENSION_IDS: &[&str] = &["cikmlhdhgneblnmkkmiolciffcgbgljj"];
const FIREFOX_EXTENSION_ID: &str = "layout-fixer@layoutfixer.dev";
/// Extra Chromium extension ids, comma-separated, for an unpacked development build.
const EXTRA_IDS_ENV: &str = "LAYOUT_FIXER_EXTENSION_IDS";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Family {
    Chromium,
    Firefox,
}

/// Chromium extension ids are 32 letters from a to p.
fn is_chrome_extension_id(id: &str) -> bool {
    id.len() == 32 && id.bytes().all(|byte| (b'a'..=b'p').contains(&byte))
}

fn extra_ids(raw: Option<&str>) -> Vec<String> {
    raw.unwrap_or_default()
        .split(',')
        .map(str::trim)
        .filter(|id| is_chrome_extension_id(id))
        .map(str::to_owned)
        .collect()
}

pub fn manifest(family: Family, executable: &Path, extra: &[String]) -> serde_json::Value {
    let mut value = json!({
        "name": HOST_NAME,
        "description": "Layout Fixer: switches the keyboard layout after the extension fixes text",
        "path": executable,
        "type": "stdio",
    });
    match family {
        Family::Chromium => {
            let origins: Vec<String> = CHROME_EXTENSION_IDS
                .iter()
                .copied()
                .chain(extra.iter().map(String::as_str))
                .map(|id| format!("chrome-extension://{id}/"))
                .collect();
            value["allowed_origins"] = json!(origins);
        }
        Family::Firefox => value["allowed_extensions"] = json!([FIREFOX_EXTENSION_ID]),
    }
    value
}

/// A browser's manifest folder; written only when `root` (the browser's own folder) exists.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Location {
    pub root: PathBuf,
    pub dir: PathBuf,
    pub family: Family,
}

fn chromium(parent: &Path, browsers: &[&str]) -> Vec<Location> {
    browsers
        .iter()
        .map(|browser| {
            let root = parent.join(browser);
            Location {
                dir: root.join("NativeMessagingHosts"),
                root,
                family: Family::Chromium,
            }
        })
        .collect()
}

#[cfg_attr(not(target_os = "macos"), allow(dead_code))]
/// macOS: `~/Library/Application Support/<browser>/NativeMessagingHosts`.
pub fn macos_locations(home: &Path) -> Vec<Location> {
    let support = home.join("Library/Application Support");
    let mut locations = chromium(
        &support,
        &[
            "Google/Chrome",
            "Google/Chrome Beta",
            "Chromium",
            "Microsoft Edge",
            "BraveSoftware/Brave-Browser",
            "Vivaldi",
        ],
    );
    locations.push(Location {
        root: support.join("Mozilla"),
        dir: support.join("Mozilla/NativeMessagingHosts"),
        family: Family::Firefox,
    });
    locations
}

#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
/// Linux: `~/.config/<browser>/NativeMessagingHosts`, and Firefox's `~/.mozilla/native-messaging-hosts`.
pub fn linux_locations(home: &Path, config: &Path) -> Vec<Location> {
    let mut locations = chromium(
        config,
        &[
            "google-chrome",
            "google-chrome-beta",
            "chromium",
            "microsoft-edge",
            "BraveSoftware/Brave-Browser",
            "vivaldi",
        ],
    );
    locations.push(Location {
        root: home.join(".mozilla"),
        dir: home.join(".mozilla/native-messaging-hosts"),
        family: Family::Firefox,
    });
    locations
}

fn write_if_changed(path: &Path, value: &serde_json::Value) -> std::io::Result<bool> {
    let content = serde_json::to_string_pretty(value).map_err(std::io::Error::other)?;
    if std::fs::read_to_string(path).is_ok_and(|current| current == content) {
        return Ok(false);
    }
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    std::fs::write(path, content)?;
    Ok(true)
}

/// Writes the manifest into every location whose browser is installed.
pub fn install_manifests(locations: &[Location], executable: &Path, extra: &[String]) {
    for location in locations.iter().filter(|location| location.root.is_dir()) {
        let path = location.dir.join(format!("{HOST_NAME}.json"));
        if let Err(error) = write_if_changed(&path, &manifest(location.family, executable, extra)) {
            eprintln!("[layout-fixer] could not write {}: {error}", path.display());
        }
    }
}

/// The path browsers should launch. An AppImage runs from a temporary mount, so its own file is
/// used instead.
fn host_executable() -> Option<PathBuf> {
    if cfg!(target_os = "linux") {
        if let Some(appimage) = std::env::var_os("APPIMAGE") {
            return Some(PathBuf::from(appimage));
        }
    }
    std::env::current_exe().ok()
}

/// Called once at launch, off the main thread.
pub fn register() {
    // A copy on the disk image or a translocated one disappears; don't point browsers at it.
    if crate::install::current() != crate::install::InstallLocation::Installed {
        return;
    }
    let Some(executable) = host_executable() else {
        return;
    };
    let extra = extra_ids(std::env::var(EXTRA_IDS_ENV).ok().as_deref());
    register_for_platform(&executable, &extra);
}

#[cfg(target_os = "macos")]
fn register_for_platform(executable: &Path, extra: &[String]) {
    if let Some(home) = std::env::var_os("HOME") {
        install_manifests(&macos_locations(Path::new(&home)), executable, extra);
    }
}

#[cfg(target_os = "linux")]
fn register_for_platform(executable: &Path, extra: &[String]) {
    let Some(home) = std::env::var_os("HOME").map(PathBuf::from) else {
        return;
    };
    let config = std::env::var_os("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| home.join(".config"));
    install_manifests(&linux_locations(&home, &config), executable, extra);
}

#[cfg(windows)]
fn register_for_platform(executable: &Path, extra: &[String]) {
    super::windows_registry::register(executable, extra);
}

#[cfg(not(any(target_os = "macos", target_os = "linux", windows)))]
fn register_for_platform(_executable: &Path, _extra: &[String]) {}

#[cfg(test)]
mod tests {
    use super::*;

    const EXE: &str = "/Applications/Layout Fixer.app/Contents/MacOS/layout-fixer-desktop";

    #[test]
    fn chromium_manifest_allows_only_the_store_extension() {
        let value = manifest(Family::Chromium, Path::new(EXE), &[]);
        assert_eq!(value["name"], HOST_NAME);
        assert_eq!(value["path"], EXE);
        assert_eq!(value["type"], "stdio");
        assert_eq!(
            value["allowed_origins"],
            json!(["chrome-extension://cikmlhdhgneblnmkkmiolciffcgbgljj/"])
        );
        assert!(value.get("allowed_extensions").is_none());
    }

    #[test]
    fn firefox_manifest_names_the_gecko_id() {
        let value = manifest(Family::Firefox, Path::new(EXE), &[]);
        assert_eq!(value["allowed_extensions"], json!([FIREFOX_EXTENSION_ID]));
        assert!(value.get("allowed_origins").is_none());
    }

    #[test]
    fn extra_ids_must_look_like_extension_ids() {
        let ids = extra_ids(Some(" abcdefghijklmnopabcdefghijklmnop, nope, ../../etc,"));
        assert_eq!(ids, vec!["abcdefghijklmnopabcdefghijklmnop"]);
        assert!(extra_ids(None).is_empty());
        let value = manifest(Family::Chromium, Path::new(EXE), &ids);
        assert_eq!(value["allowed_origins"].as_array().unwrap().len(), 2);
    }

    #[test]
    fn lists_browser_folders() {
        let mac = macos_locations(Path::new("/Users/me"));
        assert!(mac.contains(&Location {
            root: "/Users/me/Library/Application Support/Google/Chrome".into(),
            dir: "/Users/me/Library/Application Support/Google/Chrome/NativeMessagingHosts".into(),
            family: Family::Chromium,
        }));
        let linux = linux_locations(Path::new("/home/me"), Path::new("/home/me/.config"));
        assert!(linux.contains(&Location {
            root: "/home/me/.mozilla".into(),
            dir: "/home/me/.mozilla/native-messaging-hosts".into(),
            family: Family::Firefox,
        }));
    }

    #[test]
    fn writes_only_for_installed_browsers_and_only_when_changed() {
        let home = std::env::temp_dir().join(format!("lf-native-host-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&home);
        let locations = linux_locations(&home, &home.join(".config"));
        std::fs::create_dir_all(home.join(".config/google-chrome")).unwrap();

        install_manifests(&locations, Path::new(EXE), &[]);
        let chrome = home.join(format!(
            ".config/google-chrome/NativeMessagingHosts/{HOST_NAME}.json"
        ));
        let written: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(&chrome).unwrap()).unwrap();
        assert_eq!(written["path"], EXE);
        assert!(!home.join(".config/chromium").exists());
        assert!(!home.join(".mozilla").exists());

        let value = manifest(Family::Chromium, Path::new(EXE), &[]);
        assert!(!write_if_changed(&chrome, &value).unwrap());
        std::fs::remove_dir_all(&home).unwrap();
    }
}
