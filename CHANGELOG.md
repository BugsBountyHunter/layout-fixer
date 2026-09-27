# Changelog

All notable changes to Layout Fixer. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- An **About** section in the settings page: rate the extension, report a bug, request a language, contribute on
  GitHub, share the website, or donate — plus a “Made with ❤ by Ahmed Saber” credit. The rating link only shows in
  the Chrome build.

## [1.1.0] - 2026-09-27

### Added
- Optional **Switch keyboard layout after fixing** (Settings → Keyboard layout). After text is fixed in place, the
  extension asks Layout Fixer for desktop (1.3 or later) to switch your computer's keyboard to the language of the
  fixed text. Off by default; turning it on asks for the optional `nativeMessaging` permission. Only the language
  and your Arabic layout setting are sent to the desktop app, never the text. Settings shows whether the desktop
  app is connected and links to its download when it isn't.

## [1.0.1] - 2026-09-27

### Added
- The extension links to its website, [layoutfixer.dev](https://layoutfixer.dev), from its details page in the browser.

### Changed
- Firefox add-on ID is now `layout-fixer@layoutfixer.dev`, on the project's own domain, before the first Firefox release.

## [1.0.0] - 2026-09-23

First public release, for Chrome and other Chromium browsers.

### Added
- Fix text typed with the wrong keyboard layout, Arabic ⇄ English, with **Alt+Shift+F**
  (**⌥⇧F** on macOS) or right-click → **Fix keyboard layout**.
- Automatic direction: Arabic typed on the English layout, or English typed on the Arabic layout.
- Fixes the selection, or the whole field when nothing is selected; undo with Ctrl+Z / ⌘Z in
  inputs, text areas and rich editors.
- Read-only text (a message you received) is copied and shown instead.
- Optional selection button (off by default): select text, click the icon, pick the language.
- Toolbar popup with a paste-and-fix box and a direction switch.
- Settings: language pair (Arabic + English), PC or Mac Arabic keyboard layout (automatic by
  default), selection button, on-page messages. Settings sync across your devices.
- English and Arabic interface, light and dark mode.

### Privacy
- Runs entirely on your device: no data collection, analytics or network requests.
- No site access at install; the selection button asks for it only when you turn it on.
- No extension files are exposed to websites, so pages can't detect the extension.

[1.0.1]: https://github.com/BugsBountyHunter/layout-fixer/releases/tag/v1.0.1
[1.0.0]: https://github.com/BugsBountyHunter/layout-fixer/releases/tag/v1.0.0
