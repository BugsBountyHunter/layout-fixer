# Changelog

All notable changes to Layout Fixer. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/).

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

[1.0.0]: https://github.com/BugsBountyHunter/layout-fixer/releases/tag/v1.0.0
