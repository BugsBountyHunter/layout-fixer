# Layout Fixer

[![CI](https://github.com/BugsBountyHunter/layout-fixer/actions/workflows/ci.yml/badge.svg)](https://github.com/BugsBountyHunter/layout-fixer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Fix text typed with the wrong keyboard layout — **Arabic ⇄ English** — in one keystroke.

```
hgsghl ugd;l   →  السلام عليكم
اثممخ          →  hello
```

Select the text and press **Alt+Shift+F** (**⌥⇧F** on macOS), or right-click → **Fix keyboard layout**.
Works in Chrome, Edge, Brave, Opera, Vivaldi and Firefox (desktop and Android) on Windows, macOS,
Linux and ChromeOS. Everything runs on your device — see [PRIVACY.md](PRIVACY.md).

## Features

- Fixes the selection, or the whole field when nothing is selected
- Detects the direction automatically (Arabic typed as English, or the reverse)
- Undo with Ctrl+Z / ⌘Z in inputs, text areas and rich editors (Gmail, WhatsApp Web, Slack)
- Read-only text is copied and shown instead
- Popup with a paste-and-fix box
- Optional selection button (off by default): select text, click the icon, pick the language
- Settings: language pair (Arabic + English in v1), PC or Mac Arabic layout (automatic by default),
  selection button, on-page messages
- English and Arabic interface, light and dark mode, keyboard and touch friendly

## Development

Requires Node.js 20+.

```bash
npm install
npm run dev            # Chromium dev build → load dist/chrome as an unpacked extension
npm run dev:firefox    # Firefox dev build → about:debugging → Load Temporary Add-on → dist/firefox/manifest.json
npm run lint           # Biome lint + format check (lint:fix applies fixes)
npm run check          # lint, typecheck, builds, unit tests + coverage, Firefox lint, end-to-end tests
```

Manual testing: `npm run playground` opens a test page; follow
[docs/testing/manual-checklist.md](docs/testing/manual-checklist.md).

First run of the end-to-end tests needs the Playwright browser: `npx playwright install chromium`.

## Release

Bump the version and add a `CHANGELOG.md` entry in a pull request, then tag `main`:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

The release workflow runs every check and publishes a GitHub Release with the Chrome package
(`layout-fixer-chrome-<version>.zip`) for the Chrome Web Store. Store images:
`npm run store:screenshots` (needs Docker).

Store texts, permission justifications and the asset checklist are in
[docs/store/listing.md](docs/store/listing.md). Architecture and engineering rules are in
[CLAUDE.md](CLAUDE.md).

## Credits

Interface font: the system font on each platform (SF Pro / SF Arabic on Apple devices). The icon
glyph is drawn with [IBM Plex Sans Arabic](https://github.com/IBM/plex) (SIL Open Font License 1.1).
Design system: [docs/design-system.md](docs/design-system.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues: [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 BugsBountyHunter
