# Support, contribute and credits — design

Status: approved design (2026-09-27). Visual reference: [`docs/design/support-and-credits-mockup.html`](../design/support-and-credits-mockup.html)
(open it in a browser; it follows light/dark mode).

## Goal

Credit the author ("Made with ❤ by Ahmed Saber") and give people ways to help: rate, star, report a bug, request a
language, contribute code, share, donate — on the website, the extension and the desktop app.

## Links (single source: `packages/core/src/links.ts`)

| Action | URL |
|--------|-----|
| Author credit | https://github.com/BugsBountyHunter |
| Rate | Chrome Web Store listing `/reviews` |
| Star / contribute | repo, `CONTRIBUTING.md` |
| Report a bug | `issues/new?template=bug_report.yml` |
| Request a language | `issues/new?template=feature_request.yml` |
| Share | https://layoutfixer.dev |
| Donate | https://paypal.me/A7medSR96 (also `.github/FUNDING.yml`) |

## Placement

| Surface | What | Notes |
|---------|------|-------|
| Website | "Help Layout Fixer grow" section after the FAQ: grouped list of actions + a donate card; footer gets the credit line and a Donate link | Donate is the section's only filled accent button. Share uses `navigator.share`, falls back to copying the link |
| Extension options | "About" group as the last section + credit footnote with version | "Rate" hidden in the Firefox build (not on AMO yet). Share = copy link |
| Extension popup | Nothing | Keep the popup focused |
| Desktop settings | "About" group as the last section + credit footnote with version | No "Rate" (not in a store); Star + Contribute merged into one row. Links open via `tauri-plugin-opener`, scoped to these URLs only |

## Rules

- Apple HIG grouped lists, system fonts, no gradients (see `docs/design-system.md`).
- Every string in English and Arabic; RTL via logical properties; the chevron/external-link icons flip in RTL.
- External links open in a new tab (`target="_blank" rel="noopener noreferrer"`) on web and in the extension.
