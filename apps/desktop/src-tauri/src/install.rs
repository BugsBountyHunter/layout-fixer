use std::path::Path;

use serde::Serialize;

/// Where the running app lives. On macOS an app opened from the disk image, or one that wasn't
/// moved into place by a person in Finder (App Translocation), runs from a read-only location:
/// it can't update itself and "Open at login" would point at a path that disappears.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum InstallLocation {
    Installed,
    DiskImage,
    Translocated,
}

pub fn classify(executable: &Path) -> InstallLocation {
    let path = executable.to_string_lossy();
    if !cfg!(target_os = "macos") {
        return InstallLocation::Installed;
    }
    if path.contains("/AppTranslocation/") {
        InstallLocation::Translocated
    } else if path.starts_with("/Volumes/") {
        InstallLocation::DiskImage
    } else {
        InstallLocation::Installed
    }
}

pub fn current() -> InstallLocation {
    std::env::current_exe().map_or(InstallLocation::Installed, |path| classify(&path))
}

/// Opens the Applications folder in Finder, where the user drags the app.
pub fn reveal_applications_folder() {
    #[cfg(target_os = "macos")]
    if let Err(error) = std::process::Command::new("open")
        .arg("/Applications")
        .status()
    {
        eprintln!("[layout-fixer] could not open the Applications folder: {error}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[cfg(target_os = "macos")]
    fn tells_the_three_macos_locations_apart() {
        let app = "Layout Fixer.app/Contents/MacOS/layout-fixer-desktop";
        assert_eq!(
            classify(Path::new(&format!("/Applications/{app}"))),
            InstallLocation::Installed
        );
        assert_eq!(
            classify(Path::new(&format!("/Users/me/Applications/{app}"))),
            InstallLocation::Installed
        );
        assert_eq!(
            classify(Path::new(&format!("/Volumes/Layout Fixer/{app}"))),
            InstallLocation::DiskImage
        );
        assert_eq!(
            classify(Path::new(&format!(
                "/private/var/folders/z7/x/T/AppTranslocation/ACDC58E1/d/{app}"
            ))),
            InstallLocation::Translocated
        );
    }

    #[test]
    #[cfg(not(target_os = "macos"))]
    fn other_systems_are_always_installed() {
        assert_eq!(
            classify(Path::new("/Volumes/whatever/app")),
            InstallLocation::Installed
        );
    }
}
