# Contributing

Thanks for helping improve Layout Fixer!

## Getting started

```bash
npm install
npx playwright install chromium   # once, for end-to-end tests
npm run dev                       # load apps/extension/dist/chrome as an unpacked extension
```

Manual testing: `npm run playground` and follow [docs/testing/manual-checklist.md](docs/testing/manual-checklist.md).

## Before opening a pull request

- Run `npm run lint:fix`, then `npm run check` — lint and format, typecheck, unit tests with coverage thresholds, both builds, Firefox lint
  and end-to-end tests must all pass.
- Write the failing test first, then the fix or feature.
- Keep it cross-platform: Chromium browsers and Firefox (desktop and Android), Windows, macOS,
  Linux and ChromeOS. The checklist in [CLAUDE.md](CLAUDE.md#cross-platform-checklist-apply-to-every-feature-and-fix) applies to every change.
- Every user-visible string goes in both `public/_locales/en` and `public/_locales/ar`.
- Keyboard layouts are generated from real OS data — never hand-edit key maps (see CLAUDE.md §5).
- Comments explain *why*, not *what*.
- No network requests, analytics or data collection.

## Reporting bugs and requesting features

Use the [issue forms](https://github.com/BugsBountyHunter/layout-fixer/issues/new/choose) — they
ask for the browser, OS and keyboard layout we need to reproduce a problem. Security issues go
through [SECURITY.md](SECURITY.md), not a public issue.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
