//! Ctrl+C / Ctrl+V on KDE Plasma under Wayland, through KWin's `org_kde_kwin_fake_input` protocol.
//! KWin up to Plasma 6.7 offers it only to apps whose desktop file lists it in
//! `X-KDE-Wayland-Interfaces`, matched by the executable's path. Our packaged desktop file can't
//! match (a relative `Exec`, and the AppImage runs from a new mount path each launch), so at startup
//! the app writes a hidden entry for its own path (`register`). Plasma 6.8 dropped the check for
//! apps outside a sandbox.

use std::path::{Path, PathBuf};
use std::time::Duration;

use wayland_client::globals::{registry_queue_init, GlobalListContents};
use wayland_client::protocol::wl_registry::WlRegistry;
use wayland_client::{Connection, Dispatch, QueueHandle};
use wayland_protocols_plasma::fake_input::client::org_kde_kwin_fake_input::OrgKdeKwinFakeInput;

use super::session;
use crate::fix::FixError;

// Evdev keycodes name physical keys, so Ctrl+C works whichever layout is active, Arabic included.
const KEY_LEFTCTRL: u32 = 29;
pub(super) const KEY_C: u32 = 46;
pub(super) const KEY_V: u32 = 47;
const PRESSED: u32 = 1;
const RELEASED: u32 = 0;
/// `keyboard_key` arrived in version 4 of the protocol.
const FAKE_INPUT_VERSIONS: std::ops::RangeInclusive<u32> = 4..=5;
/// The shortcut fires on release; the user's other fingers leave Alt / Shift a moment later.
const MODIFIER_SETTLE: Duration = Duration::from_millis(120);
const ENTRY_NAME: &str = "io.github.bugsbountyhunter.layoutfixer-kwin.desktop";

struct State;

impl Dispatch<WlRegistry, GlobalListContents> for State {
    fn event(
        _: &mut Self,
        _: &WlRegistry,
        _: <WlRegistry as wayland_client::Proxy>::Event,
        _: &GlobalListContents,
        _: &Connection,
        _: &QueueHandle<Self>,
    ) {
    }
}

impl Dispatch<OrgKdeKwinFakeInput, ()> for State {
    fn event(
        _: &mut Self,
        _: &OrgKdeKwinFakeInput,
        _: <OrgKdeKwinFakeInput as wayland_client::Proxy>::Event,
        _: &(),
        _: &Connection,
        _: &QueueHandle<Self>,
    ) {
    }
}

fn system(error: impl std::fmt::Display) -> FixError {
    FixError::System(error.to_string())
}

/// Presses Ctrl + `letter` (an evdev keycode). KWin not offering fake input (another compositor,
/// or an older Plasma that didn't match our desktop entry) is reported as `Wayland`.
pub(super) fn ctrl_chord(letter: u32) -> Result<(), FixError> {
    let connection = Connection::connect_to_env().map_err(system)?;
    let (globals, mut queue) = registry_queue_init::<State>(&connection).map_err(system)?;
    let fake: OrgKdeKwinFakeInput = globals
        .bind(&queue.handle(), FAKE_INPUT_VERSIONS, ())
        .map_err(|_| FixError::Wayland)?;
    std::thread::sleep(MODIFIER_SETTLE);
    fake.authenticate(
        "Layout Fixer".into(),
        "Presses Copy and Paste to fix the selected text".into(),
    );
    for (key, state) in [
        (KEY_LEFTCTRL, PRESSED),
        (letter, PRESSED),
        (letter, RELEASED),
        (KEY_LEFTCTRL, RELEASED),
    ] {
        fake.keyboard_key(key, state);
    }
    queue.roundtrip(&mut State).map_err(system)?;
    fake.destroy();
    connection.flush().map_err(system)
}

/// `Exec` takes the path in quotes, which KWin's `QProcess::splitCommand` reads back whole.
fn entry(executable: &Path) -> String {
    let path = executable.display().to_string().replace('"', "\\\"");
    format!(
        "[Desktop Entry]\nType=Application\nName=Layout Fixer\nExec=\"{path}\"\nNoDisplay=true\n\
         X-KDE-Wayland-Interfaces=org_kde_kwin_fake_input\n"
    )
}

fn entry_path() -> Option<PathBuf> {
    Some(
        session::xdg_dir("XDG_DATA_HOME", ".local/share")?
            .join("applications")
            .join(ENTRY_NAME),
    )
}

/// KDE Wayland only: writes (or updates) the hidden entry that lets KWin up to Plasma 6.7 hand us
/// fake input, then refreshes KDE's application cache so KWin sees it.
pub fn register() {
    if !(session::is_kde() && session::is_wayland()) {
        return;
    }
    let (Some(path), Ok(executable)) = (entry_path(), std::env::current_exe()) else {
        return;
    };
    let executable = executable.canonicalize().unwrap_or(executable);
    let content = entry(&executable);
    if std::fs::read_to_string(&path).ok().as_deref() == Some(content.as_str()) {
        return;
    }
    let written = path
        .parent()
        .map_or(Ok(()), std::fs::create_dir_all)
        .and_then(|()| std::fs::write(&path, content));
    if let Err(error) = written {
        eprintln!("[layout-fixer] Could not write the KWin desktop entry: {error}");
        return;
    }
    let _ = std::process::Command::new("kbuildsycoca6").output();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_entry_names_the_running_executable() {
        let entry = entry(Path::new(
            "/tmp/.mount_Layout Fixer/usr/bin/layout-fixer-desktop",
        ));
        assert!(entry.contains("Exec=\"/tmp/.mount_Layout Fixer/usr/bin/layout-fixer-desktop\"\n"));
        assert!(entry.contains("NoDisplay=true\n"));
        assert!(entry.contains("X-KDE-Wayland-Interfaces=org_kde_kwin_fake_input\n"));
    }
}
