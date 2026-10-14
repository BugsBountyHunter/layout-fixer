# Changelog

All notable changes to Layout Fixer. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **Fix what you just typed, without selecting it.** With nothing selected, the shortcut now fixes the mistyped
  words right before the cursor — in text boxes and in rich editors like Gmail, WhatsApp Web and Slack, which used
  to need a selection. A cursor inside a word fixes the whole word. Undo still works.

### Changed
- In a text box with nothing selected, only the mistyped words before the cursor are fixed. The whole field is
  fixed only when there are none.
- The message when there is nothing to fix now says so: "Nothing to fix before the cursor. Select the text you want
  to fix."
- **Mixed text keeps its correct words.** Fixing `meeting at 5 hgsghl ugd;l` now gives
  `meeting at 5 السلام عليكم` instead of converting the English words too. Each word is checked on your device
  against letter statistics for Arabic and English, and only the words typed on the wrong layout are retyped, each
  in its own direction. Links, e-mail addresses and words with digits are left alone. When no word looks mistyped,
  the whole text is converted as before.
- After a fix, the keyboard switches to the language of the fixed words rather than the language most of the text
  is in.

## [1.2.1] - 2026-09-30

### Fixed
- The selection button now appears inside `srcdoc`, `about:blank` and `blob:` iframes, such as rich-text editors that
  write into a blank frame. Users who had already turned the button on get the fix without toggling it.
- When the desktop app can't switch the keyboard layout (for example on a Linux Wayland desktop other than KDE Plasma or GNOME), the extension now
  logs the reason instead of treating the answer as a success.

## [1.2.0] - 2026-09-27

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
