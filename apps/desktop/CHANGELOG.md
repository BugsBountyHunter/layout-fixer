# Changelog — Layout Fixer for desktop

All notable changes to the desktop app. The browser extension has its own [CHANGELOG](../../CHANGELOG.md).

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
