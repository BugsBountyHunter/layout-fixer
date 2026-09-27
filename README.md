<div align="center">

<img src="apps/extension/public/icons/icon-128.png" alt="Layout Fixer icon" width="96" height="96">

# Layout Fixer

**Fix text typed with the wrong keyboard layout — Arabic ⇄ English — in one keystroke.**

**[layoutfixer.dev](https://layoutfixer.dev)** · [العربية](https://layoutfixer.dev/ar)

[![CI](https://github.com/BugsBountyHunter/layout-fixer/actions/workflows/ci.yml/badge.svg)](https://github.com/BugsBountyHunter/layout-fixer/actions/workflows/ci.yml)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/cikmlhdhgneblnmkkmiolciffcgbgljj?label=chrome%20web%20store)](https://chromewebstore.google.com/detail/cikmlhdhgneblnmkkmiolciffcgbgljj)
[![Website](https://img.shields.io/badge/website-layoutfixer.dev-0a84ff.svg)](https://layoutfixer.dev)
[![Extension release](https://img.shields.io/github/v/release/BugsBountyHunter/layout-fixer?filter=v*&label=extension)](https://github.com/BugsBountyHunter/layout-fixer/releases/latest)
[![Desktop release](https://img.shields.io/github/v/release/BugsBountyHunter/layout-fixer?filter=desktop-v*&label=desktop)](https://github.com/BugsBountyHunter/layout-fixer/releases/tag/desktop-latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-blue.svg)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Privacy: no data collected](https://img.shields.io/badge/privacy-no%20data%20collected-brightgreen.svg)](PRIVACY.md)

[Install](#install) · [Desktop app](#desktop-app) · [Features](#features) · [Screenshots](#screenshots) · [Privacy](#privacy) · [Development](#development) · [Support](#support-the-project)

<img src="docs/images/hero.png" alt="A message typed as 'hgsghl ugd;l ;dt phg;?' becomes 'السلام عليكم كيف حالك؟' after pressing Alt+Shift+F" width="800">

</div>

## Why

If you type in both Arabic and English, you have done this: typed a whole sentence, looked up,
and found `hgsghl ugd;l` instead of `السلام عليكم`. Normally you delete it, switch the layout and
type it again. Layout Fixer converts it in place instead.

```text
hgsghl ugd;l   →  السلام عليكم
اثممخ          →  hello
```

Select the text and press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd>
(<kbd>⌥</kbd><kbd>⇧</kbd><kbd>F</kbd> on macOS), or right-click → **Fix keyboard layout**.

## Install

| Browser | How |
| --- | --- |
| Chrome, Edge, Brave, Opera, Vivaldi | [**Add to Chrome** from the Chrome Web Store](https://chromewebstore.google.com/detail/cikmlhdhgneblnmkkmiolciffcgbgljj). To install a specific version by hand: download `layout-fixer-chrome-<version>.zip` from [Releases](https://github.com/BugsBountyHunter/layout-fixer/releases), unzip it, open `chrome://extensions`, turn on **Developer mode** and choose **Load unpacked**. |
| Firefox (desktop and Android) | Planned. You can [build it from source](#development) today. |

### Desktop app

**Layout Fixer for desktop** fixes text in every app, not just the browser (Word, Slack, WhatsApp, Notes,
Terminal): select it and press the same shortcut. It can also switch your keyboard to the right language after
a fix, for itself and for the browser extension.

| System | Download |
| --- | --- |
| macOS 12+ (Apple silicon and Intel) | [Layout-Fixer-macOS.dmg](https://github.com/BugsBountyHunter/layout-fixer/releases/download/desktop-latest/Layout-Fixer-macOS.dmg) |
| Windows 10 / 11 | [Layout-Fixer-Windows-setup.exe](https://github.com/BugsBountyHunter/layout-fixer/releases/download/desktop-latest/Layout-Fixer-Windows-setup.exe) (or the [.msi](https://github.com/BugsBountyHunter/layout-fixer/releases/download/desktop-latest/Layout-Fixer-Windows.msi)) |
| Linux (X11) | [Layout-Fixer-Linux.AppImage](https://github.com/BugsBountyHunter/layout-fixer/releases/download/desktop-latest/Layout-Fixer-Linux.AppImage) (or the [.deb](https://github.com/BugsBountyHunter/layout-fixer/releases/download/desktop-latest/Layout-Fixer-Linux.deb)) |

The app isn't signed with a paid Apple or Microsoft certificate yet, so the system asks you to confirm the first
launch once — see the [first-launch steps](docs/desktop-first-launch.md). Updates install themselves after that.
All versions: [desktop releases](https://github.com/BugsBountyHunter/layout-fixer/releases?q=desktop&expanded=true) ·
[changelog](apps/desktop/CHANGELOG.md).

## Features

- **One shortcut** — fixes the selection, or the whole field when nothing is selected
- **Automatic direction** — Arabic typed on the English layout, or English typed on the Arabic layout
- **Undo** with <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>⌘</kbd><kbd>Z</kbd> in inputs, text areas and rich editors (Gmail, WhatsApp Web, Slack)
- **Read-only text** (a message you received) is copied and shown instead
- **Popup** with a paste-and-fix box and a direction switch
- **Selection button** (optional, off by default): select text, click the icon, pick the language
- **Your keyboard** — PC or Mac Arabic layout, detected automatically
- **Switch the keyboard layout** (optional, off by default): after a fix, your computer's keyboard switches to
  the language of the fixed text, through Layout Fixer for desktop
- **English and Arabic interface**, light and dark mode, keyboard and touch friendly

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/store/screenshots/en/01-selection-button.png" alt="Selection button menu offering the Arabic conversion of the selected text"></td>
    <td width="50%"><img src="docs/store/screenshots/en/03-popup.png" alt="Toolbar popup converting pasted text as you type"></td>
  </tr>
  <tr>
    <td align="center"><b>Selection button</b> — select, click, done</td>
    <td align="center"><b>Popup</b> — paste and fix</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/store/screenshots/en/04-settings.png" alt="Settings page with language pair and Arabic keyboard layout options"></td>
    <td width="50%"><img src="docs/store/screenshots/en/05-private.png" alt="Popup in dark mode"></td>
  </tr>
  <tr>
    <td align="center"><b>Settings</b> — PC or Mac Arabic layout</td>
    <td align="center"><b>Dark mode</b> — and nothing leaves your device</td>
  </tr>
</table>

<details>
<summary>Arabic interface (واجهة عربية)</summary>
<br>
<table>
  <tr>
    <td width="50%"><img src="docs/store/screenshots/ar/01-selection-button.png" alt="Selection button in the Arabic interface"></td>
    <td width="50%"><img src="docs/store/screenshots/ar/03-popup.png" alt="Popup in the Arabic interface"></td>
  </tr>
</table>
</details>

## Supported platforms

| Browser | Windows | macOS | Linux | ChromeOS | Android |
| --- | :---: | :---: | :---: | :---: | :---: |
| Chrome, Edge, Brave, Opera, Vivaldi | ✓ | ✓ | ✓ | ✓ | — |
| Firefox 140+ (142+ on Android) | ✓ | ✓ | ✓ | — | ✓ |
| Safari | planned | planned | — | — | — |

Firefox for Android has no keyboard shortcuts or context menus, so the popup is the way in there.

## Privacy

Everything runs on your device. The extension makes no network requests, collects no data and has
no analytics. It needs no site access at install; the optional selection button asks for it only
when you turn it on. No extension files are exposed to websites, so pages can't detect it. The desktop
app's only network request is its update check on GitHub, which you can turn off.
Details: [PRIVACY.md](PRIVACY.md).

## How it works

Every layout maps physical keys (`KeyQ`, `Semicolon`, …) to the characters they produce. To fix
text, Layout Fixer finds the key each character came from on one layout and types that key on the
other. Layouts are generated from real OS keyboard data (Windows 101, macOS "Arabic" and
"Arabic – PC", Linux XKB) and verified by tests, never edited by hand. Architecture notes are in
[CLAUDE.md](CLAUDE.md).

## Development

Requires Node.js 20+ (see [`.nvmrc`](.nvmrc)).

```bash
npm install
npm run dev            # Chromium dev build → load apps/extension/dist/chrome as an unpacked extension
npm run dev:firefox    # Firefox → about:debugging → Load Temporary Add-on → apps/extension/dist/firefox/manifest.json
npm run lint           # Biome lint + format check (lint:fix applies fixes)
npm run check          # lint, typecheck, builds, unit tests + coverage, Firefox lint, end-to-end tests
```

- Manual testing: `npm run playground` opens a test page; follow [docs/testing/manual-checklist.md](docs/testing/manual-checklist.md).
- The first end-to-end run needs the Playwright browser: `npx playwright install chromium`.
- Store images: `npm run store:screenshots` (needs Docker). The README uses them too; `docs/images/hero.png` is a crop of `02-shortcut.png`.

### Project structure

An npm workspaces monorepo:

```text
packages/core/        # @layout-fixer/core: converter and keyboard layouts (pure TypeScript, no DOM)
packages/ui/          # @layout-fixer/ui: design tokens, theme, icons shared by the apps
apps/desktop/         # desktop app for macOS, Windows and Linux (Tauri 2)
apps/landing/         # the website, layoutfixer.dev (Next.js static export)
apps/extension/       # the browser extension
├── src/
│   ├── platform/     # shortcuts, OS detection, i18n, validated settings
│   ├── background/   # context menu and shortcut handlers
│   ├── content/      # in-page replacement, toast, selection button
│   ├── popup/        # toolbar popup (React)
│   ├── options/      # settings page (React)
│   └── ui/           # design tokens, theme, icons, shared components
└── e2e/              # Playwright tests against the built extension
```

Run scripts from the repository root; they forward to the right workspace. The desktop app also needs
[Rust](https://rustup.rs) (and on Linux the [Tauri system libraries](https://tauri.app/start/prerequisites/)):
`npm run desktop:dev`.

## Release

Bump the version and add a [CHANGELOG.md](CHANGELOG.md) entry in a pull request, then tag `main`:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

The release workflow runs every check and publishes a GitHub Release with the Chrome package.
The desktop app is released separately with `desktop-vX.Y.Z` tags — see [docs/desktop-release.md](docs/desktop-release.md).
Store texts and permission justifications are in [docs/store/listing.md](docs/store/listing.md).

## Roadmap

- Smart detection: offer to fix a word that isn't a real word in either language
- More layouts: Persian, Urdu, Hebrew, Russian
- Firefox Add-ons and Edge Add-ons listings
- Safari (macOS and iOS)

## Support the project

Layout Fixer is free, open source and has no ads. If it saves you some retyping:

- ⭐ [Star the repository](https://github.com/BugsBountyHunter/layout-fixer)
- [Rate it on the Chrome Web Store](https://chromewebstore.google.com/detail/cikmlhdhgneblnmkkmiolciffcgbgljj/reviews)
- Share [layoutfixer.dev](https://layoutfixer.dev) with someone who types in two languages
- [Donate with PayPal](https://paypal.me/A7medSR96)

## Contributing

[Report a bug](https://github.com/BugsBountyHunter/layout-fixer/issues/new?template=bug_report.yml),
[request a language](https://github.com/BugsBountyHunter/layout-fixer/issues/new?template=feature_request.yml) or send a pull request — see [CONTRIBUTING.md](CONTRIBUTING.md)
and the [Code of Conduct](CODE_OF_CONDUCT.md). Please report security issues privately as
described in [SECURITY.md](SECURITY.md).

## Credits

Interface font: the system font on each platform (SF Pro / SF Arabic on Apple devices). The icon
glyph is drawn with [IBM Plex Sans Arabic](https://github.com/IBM/plex) (SIL Open Font License 1.1).
Design system: [docs/design-system.md](docs/design-system.md).

## License

[MIT](LICENSE) © 2026 BugsBountyHunter · Made with ❤ by [Ahmed Saber](https://github.com/BugsBountyHunter)
