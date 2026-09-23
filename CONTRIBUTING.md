# Contributing

Thanks for helping improve Layout Fixer!

## Getting started

```bash
npm install
npx playwright install chromium   # once, for end-to-end tests
npm run dev                       # load dist/chrome as an unpacked extension
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

## Reporting bugs

Open an issue with the browser and version, OS, the site or test-page card, what you did, what
you expected and what happened.
