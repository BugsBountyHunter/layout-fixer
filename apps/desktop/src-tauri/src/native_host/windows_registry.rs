//! Windows: browsers find the manifest through a registry key whose default value is its path.
//! Per-user keys need no administrator rights.

use std::path::Path;

use windows::core::{HSTRING, PCWSTR};
use windows::Win32::System::Registry::{
    RegCloseKey, RegCreateKeyExW, RegSetValueExW, HKEY, HKEY_CURRENT_USER, KEY_WRITE,
    REG_OPTION_NON_VOLATILE, REG_SZ,
};

use super::register::{manifest, Family, HOST_NAME};

const KEYS: &[(&str, Family)] = &[
    (
        r"Software\Google\Chrome\NativeMessagingHosts",
        Family::Chromium,
    ),
    (r"Software\Chromium\NativeMessagingHosts", Family::Chromium),
    (
        r"Software\Microsoft\Edge\NativeMessagingHosts",
        Family::Chromium,
    ),
    (
        r"Software\BraveSoftware\Brave-Browser\NativeMessagingHosts",
        Family::Chromium,
    ),
    (r"Software\Mozilla\NativeMessagingHosts", Family::Firefox),
];

fn set_default_value(subkey: &str, value: &Path) -> windows::core::Result<()> {
    let mut key = HKEY::default();
    // SAFETY: out-pointers live until the calls return; the key is closed below.
    unsafe {
        RegCreateKeyExW(
            HKEY_CURRENT_USER,
            &HSTRING::from(subkey),
            None,
            PCWSTR::null(),
            REG_OPTION_NON_VOLATILE,
            KEY_WRITE,
            None,
            &mut key,
            None,
        )
        .ok()?;
        let wide: Vec<u16> = value
            .as_os_str()
            .to_string_lossy()
            .encode_utf16()
            .chain([0])
            .collect();
        let bytes = std::slice::from_raw_parts(wide.as_ptr().cast::<u8>(), wide.len() * 2);
        let written = RegSetValueExW(key, PCWSTR::null(), None, REG_SZ, Some(bytes)).ok();
        let _ = RegCloseKey(key);
        written
    }
}

/// Writes `chromium.json` / `firefox.json` next to the app's data and points every browser's key at them.
pub fn register(executable: &Path, extra: &[String]) {
    let Some(data) = std::env::var_os("LOCALAPPDATA") else {
        return;
    };
    let dir = Path::new(&data).join(HOST_NAME).join("native-messaging");
    if let Err(error) = std::fs::create_dir_all(&dir) {
        eprintln!("[layout-fixer] could not create {}: {error}", dir.display());
        return;
    }
    for (family, file) in [
        (Family::Chromium, "chromium.json"),
        (Family::Firefox, "firefox.json"),
    ] {
        let path = dir.join(file);
        let content =
            serde_json::to_string_pretty(&manifest(family, executable, extra)).unwrap_or_default();
        if let Err(error) = std::fs::write(&path, content) {
            eprintln!("[layout-fixer] could not write {}: {error}", path.display());
            continue;
        }
        for (parent, _) in KEYS.iter().filter(|(_, key_family)| *key_family == family) {
            if let Err(error) = set_default_value(&format!(r"{parent}\{HOST_NAME}"), &path) {
                eprintln!("[layout-fixer] could not register in {parent}: {error}");
            }
        }
    }
}
