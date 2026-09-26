# Changelog — Layout Fixer for desktop

All notable changes to the desktop app. The browser extension has its own [CHANGELOG](../../CHANGELOG.md).

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
