# Changelog — Layout Fixer for desktop

All notable changes to the desktop app. The browser extension has its own [CHANGELOG](../../CHANGELOG.md).

## [Unreleased]

## [1.6.1] - 2026-09-30

### Fixed
- If putting the fixed text on the clipboard failed (for example on Windows while another app held the clipboard
  open), your previous clipboard contents were lost. The app now puts them back and skips the paste.

### Changed
- Updated Tauri to 2.12 and its plugins (autostart, opener, process, store, updater).

## [1.6.0] - 2026-09-27

### Added
- Linux (KDE Plasma 6 on Wayland): the shortcut fixes text on Wayland too, with nothing to install. The app presses
  Copy and Paste through KWin's fake-input protocol, reads and restores the clipboard through the data-control
  protocol, and registers the shortcut with KDE's global shortcuts, where it also shows up in System Settings →
  Shortcuts. Plasma 6.7 and earlier hand fake input only to apps listed in a desktop file, so the app writes a hidden
  one for itself (`~/.local/share/applications/io.github.bugsbountyhunter.layoutfixer-kwin.desktop`).

### Changed
- The "Wayland session" notice in Settings now shows only on Wayland desktops other than GNOME and KDE Plasma.

## [1.5.0] - 2026-09-27

### Added
- Linux (GNOME 45 and later on Wayland, e.g. Ubuntu 24.04+ and Fedora): the shortcut fixes text on Wayland too. Wayland
  lets no app press keys in another app, read the clipboard in the background or grab a global shortcut, so on GNOME
  Layout Fixer's GNOME Shell extension does those: it presses Copy and Paste for the fix, puts your clipboard back
  afterwards and grabs the shortcut. Install it from Settings → GNOME extension (log out and back in once); an
  extension installed with 1.4.0 is updated automatically and works from the next login. No system prompt and no
  screen-sharing indicator. Other Wayland desktops (KDE Plasma next) still need an X11 session for the shortcut.

### Changed
- On GNOME Wayland, Settings shows the GNOME extension section instead of the "needs an X11 session" notice, and a fix
  without the extension says to install it.

## [1.4.0] - 2026-09-27

### Added
- Linux (KDE Plasma): switching the keyboard layout now works on Wayland too, through KWin's own keyboard-layout
  service, so the browser extension can switch the layout after a fix in a Plasma Wayland session. The app's own
  shortcut still needs an X11 session, because Wayland doesn't let apps press keys in other apps. On Plasma X11 the
  app uses the same service where Plasma provides it (6.6 and earlier) and switches the XKB layout otherwise.
- Linux (GNOME 45 and later, Wayland and X11): the keyboard layout can switch on GNOME too. GNOME lets apps switch
  layouts only through a GNOME Shell extension, so Settings → Keyboard switching on GNOME installs Layout Fixer's own
  small extension with one click; it works after you log out and back in. The extension only lists and switches the
  layouts, and never sees what you type. Settings also says when extensions are turned off or GNOME is too new for it.

## [1.3.2] - 2026-09-27

### Fixed
- Linux (Cinnamon 6.6 and later, e.g. Linux Mint 22.3): switching the keyboard layout after a fix still didn't
  stick. Cinnamon's window manager puts back its own layout as soon as another app changes it, so the switch was
  undone at once. The app now switches through Cinnamon itself, and the panel's layout indicator follows.
- Linux (GNOME on X11): Settings no longer asks you to add an Arabic (or English) keyboard you already have. GNOME
  shows other apps only the active layout, so Layout Fixer can't see or switch to the others there yet, and now
  says nothing rather than something wrong.

## [1.3.1] - 2026-09-27

### Fixed
- Linux (X11): switching the keyboard layout after a fix didn't take effect, from the shortcut or from the browser
  extension. The app closed its connection to the X server before the switch was applied; it now waits for the
  server to confirm it.

## [1.3.0] - 2026-09-27

### Added
- The browser extension can now switch the keyboard layout too. The app registers a native messaging helper
  (`io.github.bugsbountyhunter.layoutfixer`) with the installed browsers (Chrome, Chromium, Edge, Brave, Vivaldi
  and Firefox) every time it starts, so open Layout Fixer once after installing it. The helper only switches
  the layout; it never receives text.

## [1.2.0] - 2026-09-27

### Added

- Settings explains when the keyboard can't switch to a language because no keyboard for it is added, and where
  to add one (macOS, Windows or Linux).
- Settings notices when the Arabic layout chosen for fixing isn't the one your computer has (for example PC chosen,
  Mac installed) and offers to use the right one in one click.

## [1.1.0] - 2026-09-27

### Added

- After fixing the text, the keyboard switches to the language the text was fixed to, so you can keep typing.
  It only picks from the layouts you already have (preferring the Arabic layout chosen in Settings) and does
  nothing if one for that language is already active. On by default; turn it off in Settings → General.
  Works on macOS and Windows. On Linux X11 it switches the XKB group, which works on KDE, Xfce, Cinnamon and MATE;
  GNOME keeps one layout in the keymap at a time, so nothing switches there yet.

## [1.0.3] - 2026-09-26

### Fixed

- Linux: the app no longer crashes at startup (a `tao` panic in `event_loop.rs`). The message window is now made
  click-through after it is first shown, instead of while it is still hidden.

## [1.0.2] - 2026-09-26

### Added

- macOS: VoiceOver speaks the on-screen messages ("Select the text first", "Nothing to fix", …) as they appear,
  without moving focus away from the app you're typing in. On Windows and Linux the message is a live region
  for Narrator and Orca, as before.

## [1.0.1] - 2026-09-26

### Fixed

- macOS: when Layout Fixer runs from the disk image, or from a temporary copy because it wasn't moved into
  Applications in Finder, Settings and the welcome now explain how to move it (with a button that opens the
  Applications folder). Updates wait until it's moved instead of failing.
- Apps that were just opened get more time to answer the copy, so the first fix after opening an app doesn't
  report "Select the text first" by mistake.

## [1.0.0] - 2026-09-26

First public release for macOS, Windows and Linux.

### Added

- Fix text typed with the wrong keyboard layout in any app: select it and press **⌥⇧F** (macOS) or
  **Alt+Shift+F** (Windows, Linux), or choose **Fix Selection** in the menu bar / tray. Arabic ⇄ English,
  direction detected automatically, PC or Mac Arabic layout (automatic by default).
- Your clipboard is put back after every fix (text, rich text, images; on macOS and Windows also files),
  and the temporary text is kept out of clipboard history and clipboard managers.
- One ⌘Z / Ctrl+Z undoes a fix.
- Choose your own shortcut, pause and resume from the menu bar, open at login, on-screen messages on or off.
- English and Arabic interface, light and dark mode, first-run welcome with a practice field.
- Automatic updates, verified with the project's signing key (can be switched off).

### Known limits

- Linux needs an X11 session; Wayland shows an explanation (support planned).
- Apps running as administrator on Windows, and password fields everywhere, can't be fixed by design.
