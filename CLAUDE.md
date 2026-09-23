# Layout Fixer — Project Context

A cross-browser extension (Manifest V3) that converts text typed with the **wrong
keyboard layout** between Arabic and English.

```
hgsghl ugd;l   →  السلام عليكم
اثممخ          →  hello
```

---

## 1. Problem

People who type in both Arabic and English often forget to switch the keyboard layout.
They type a full sentence, see gibberish, delete it, switch the layout, and type it
again — many times a day in Gmail, WhatsApp Web, Slack, search boxes, and so on.
Existing layout fixers are mostly desktop apps or target Russian/Hebrew; there is no
simple, reliable in-browser option for Arabic.

## 2. Target users

- Arabic speakers who type in both languages (students, office workers, developers)
- Later: Persian, Urdu, Hebrew, and Russian users (same mechanism, different maps)

## 3. Scope (v1.0 — Arabic ⇄ English only)

| # | Feature | Status |
|---|---------|--------|
| F1 | Select text → `Alt+Shift+F` (`⌥⇧F` on macOS) → replaced in place | ✅ |
| F2 | Right-click → "Fix keyboard layout" | ✅ |
| F3 | Auto-detect direction (en→ar / ar→en) | ✅ |
| F4 | Nothing selected in an input/textarea → convert the whole field | ✅ |
| F5 | Undo with `Ctrl/Cmd+Z` in inputs, textareas and rich editors (all via `execCommand('insertText')`) | ✅ |
| F6 | Read-only text / uneditable editors → copy fixed text + show it in a toast | ✅ |
| F7 | Popup: paste-and-fix box, direction override, copy, live shortcut display | ✅ |
| F8 | UI in English and Arabic (RTL), light/dark, touch-friendly | ✅ |
| F9 | Settings page: Arabic layout (Automatic / PC / Mac), shortcut, on-page messages, privacy | ✅ |
| F10 | Popup and on-page fixing use the saved layout; settings sync live between pages | ✅ |
| F11 | Selection button (like a translator icon): select text → button → pick a language with preview. **Opt-in** setting, off by default; asks for optional site access when turned on | ✅ |
| F12 | Language pair setting (two different languages). v1 offers Arabic + English only | ✅ |

**Not in v1:** auto-detection while typing, Google Docs (canvas — toast fallback only),
extra languages/layouts, Safari.

---

## 4. Supported platforms — consider ALL of these in every change

| Browser | OS | Build | Notes |
|---------|----|-------|-------|
| Chrome, Edge, Brave, Opera, Vivaldi | Windows, macOS, Linux, ChromeOS | `dist/chrome` | Service-worker background |
| Firefox (desktop) ≥ 140 | Windows, macOS, Linux | `dist/firefox` | Event-page background (`background.scripts`), gecko id |
| Firefox for Android ≥ 142 | Android | `dist/firefox` | **No `commands` or `contextMenus`** — popup is the only UI, opens full-page |
| Safari | macOS, iOS | — | Not yet (needs Xcode wrapper) |

### Cross-platform checklist (apply to every feature and fix)

- **APIs:** treat `chrome.commands` and `chrome.contextMenus` as optional (Firefox Android).
  Use only APIs available in both Chromium and Firefox MV3, or guard them.
- **Manifest:** add fields in `src/manifest.ts` for *both* targets; the manifest tests must pass
  for each. No install-time host permissions or `<all_urls>`: core features use `activeTab` +
  on-demand injection; site access is only ever `optional_host_permissions`, requested when the
  user opts in (see the active plan).
- **Shortcuts:** never hardcode "Alt+Shift+F" in UI. Read the live binding with
  `chrome.commands.getAll()` and render with `formatShortcut()` (macOS symbols vs key names).
  Browser settings pages differ: `chrome://`, `edge://`, `opera://`, Firefox `openShortcutSettings()`.
- **Keyboard layouts:** PC and Mac variants differ per language (e.g. `ar-pc` vs `ar-mac`) — ship
  each as its own layout generated from OS data; never edit one to fit another.
- **Text:** iterate by code point (`Array.from`), never by UTF-16 unit. Use `dir="auto"` for any
  user text. Use CSS logical properties (`inset-inline`, `margin-inline`, `padding-inline`).
- **i18n:** every user-visible string goes through `t()` and exists in both
  `public/_locales/en` and `public/_locales/ar` (a test enforces identical keys).
  UI direction comes from the locale's own `textDirection` message, not `@@bidi_dir`.
- **Fonts:** system fonts only, never bundled: SF Pro / SF Arabic on Apple devices, Segoe UI on
  Windows, Noto Sans Arabic on Linux, ChromeOS and Android (`--lf-font`). Set typography on `body` —
  Chromium's default extension stylesheet overrides values inherited from `:root`. The logo PNGs
  are drawn with IBM Plex Sans Arabic (`@fontsource`, OFL) because SF's license excludes artwork.
- **Design language:** Apple Human Interface Guidelines — see `docs/design-system.md`. Apple blue
  accent (`--lf-accent` fills, `--lf-link` for text), grouped lists on gray in settings, gray-fill
  secondary buttons, translucent blurred material for on-page UI, solid logo. No gradients, no
  emoji as icons (use `src/ui/icons.tsx`). Every color, size and duration is a token in
  `src/ui/tokens.css`; pages get it via `theme.css`, shadow roots via `tokens.css?inline`.
  `src/ui/design-tokens.test.ts` fails on any hex color or bundled font outside that file.
- **Input:** support mouse, keyboard and touch. Touch targets ≥ 44px under `(pointer: coarse)`.
  Visible `:focus-visible` outlines. Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- **Pages:** content script runs in all frames — only the focused frame may act.
  Toast UI lives in a shadow root so page CSS can't break it; never use `innerHTML` with page text.
- **Settings:** read only through `loadSettings()` / `useSettings()`; `parseSettings()` re-validates
  every field (storage is shared and synced, so it's untrusted). New settings need a default, a
  validator, a test, both locales, and an e2e check that they take effect.
- **Restricted pages** (`chrome://`, Web Store, addons.mozilla.org) reject injection — fail silently
  with a `console.warn`, never throw.

---

## 5. How it works

- **Physical-key model** (`src/core/`, pure, no DOM): every layout in `src/core/layouts/` maps
  `KeyboardEvent.code` keys (`KeyQ`, `Semicolon`, …) to `[base, shift]` output. `convertBetween(text,
  from, to)` finds the keystroke each character came from in `from` and types it on `to`, so any
  layout converts to any other. Longest match first (lam-alef `لا` is one key on PC). ASCII typed on
  a non-Latin layout is kept as real punctuation; `aliases` read Arabic-Indic digits as digit keys.
  `detectScript()` picks the majority script (Latin on ties). `convert()` is the current
  English ⇄ Arabic convenience wrapper for the UI.
- **Layouts:** `en-us`, `ar-pc` (Windows 101 = macOS Arabic-PC = Linux XKB), `ar-mac` (macOS default
  "Arabic"). Each is generated from real OS data in `layouts/fixtures/` and verified by
  `layouts.test.ts`. To add one: dump the fixture (`scripts/dump-macos-layout.swift`), generate the
  keys (`scripts/generate-layout.py`), add metadata, register it in `layouts/index.ts`, map its test fixture.
  Never hand-edit key data without regenerating from a fixture.
- **Known ambiguity (PC only):** `ل`+`ا` from keys `g`+`h` is identical to the `b` key's `لا`; we read it as `b`.
- **Content script** (`src/content/`): inputs, textareas and `contenteditable` all insert via
  `execCommand('insertText')` so the browser records undo (fields fall back to `setRangeText` + a
  bubbling `input` event if it's unavailable); read-only/uneditable targets → copy + toast.
  Page scripts are imported with `?iife`, so each is one self-contained classic script with no
  loader; `*.entry.ts` files only call `onExecute()`, keeping the logic importable by unit tests.
- **Background** (`src/background/handlers.ts`): context menu + command → `scripting.executeScript`
  on the active tab. Takes the extension API and dependencies as parameters so it's unit-testable.
- **Selection button:** `src/content/selection-button.ts` (started by `selection-button.entry.ts`) + `src/content/selection/`
  (read selection, menu options, placement, shadow-DOM UI). Registered on `<all_urls>` by
  `src/background/selection-script.ts` only while the setting is on **and** optional site access is
  granted; re-synced on install, startup, settings and permission changes, and injected into
  already-open tabs. Revoking access in the browser turns the setting off. Its UI never takes focus
  (mousedown/pointerdown `preventDefault`) so the page selection survives the click.
- **Language pair:** `src/core/languages.ts` lists pairable languages (v1: `ar`, `en`);
  `settings.languages` is always two different known codes.

---

## 6. Project structure & commands

```
layout-fixer/
├── src/
│   ├── manifest.ts               # buildManifest('chrome' | 'firefox')
│   ├── core/                     # converter, scripts, layouts/ (+ OS fixtures) — pure
│   ├── platform/                 # shortcut formatting, OS detection, i18n, settings (validated storage)
│   ├── background/               # handlers.ts (logic) + service-worker.ts (entry)
│   ├── content/                  # *.entry.ts (injected IIFEs), content-script, selection-button, replace, toast
│   ├── popup/                    # React popup + components
│   ├── options/                  # React settings page (options_ui, opens in a tab)
│   ├── ui/                       # tokens.css (design tokens), theme.css, icons, hooks, components
│   └── shared/constants.ts
├── public/_locales/{en,ar}/      # translations
├── public/icons/                 # generated by scripts/generate-icons.py
├── e2e/                          # Playwright tests against the real built extension
└── vite.config.ts                # --mode chrome | firefox | e2e
```

> Entry files must have **unique basenames** — CRXJS confused two `index.ts` entries and loaded
> the content script as the service worker (caught by e2e).
>
> **Nothing is web-accessible.** Any file listed in `web_accessible_resources` can be fetched by
> every website at a fixed URL, which reveals that the extension is installed. Page scripts are
> self-contained IIFEs, and `build/strip-web-accessible-resources.ts` removes the entries CRXJS adds
> for them. The e2e privacy test fails if anything becomes web-accessible again.

```bash
npm run dev             # Chromium dev build with HMR → load dist/chrome unpacked
npm run dev:firefox     # Firefox dev build → about:debugging → Load Temporary Add-on → dist/firefox/manifest.json
npm run build           # typecheck + dist/chrome + dist/firefox
npm test                # unit + DOM tests (Vitest)
npm run test:coverage   # with thresholds (lines/functions/statements 90%, branches 85%)
npm run test:e2e        # builds dist/e2e and runs Playwright in real Chromium
npm run lint:firefox    # web-ext lint (AMO validation)
npm run lint            # Biome: lint + format check (npm run lint:fix to apply)
npm run check           # everything above — run before every commit
npm run playground      # local test page (http://localhost:4321) for docs/testing/manual-checklist.md
npm run package:chrome  # zip for Chrome Web Store / Edge Add-ons
npm run package:firefox # zip for addons.mozilla.org
npm run icons           # regenerate icons (Python + Pillow, macOS fonts)
python3 scripts/generate-layout.py <macOS id> <layout id>   # key data from a fixture
```

---

## 7. Engineering rules

### Testing (TDD — write the failing test first)
- **Unit** (`src/**/*.test.ts`): converter, direction detection, shortcut formatting, manifest per
  browser, locales, background handlers with a fake extension API (desktop + Android shapes).
- **DOM** (`// @vitest-environment happy-dom`): replace/clipboard/toast/content-script behavior.
- **E2E** (`e2e/`): real Chromium with the built extension — popup flows, input/textarea/
  contenteditable/iframe/read-only replacement, undo, framework input events, clipboard.
  The Arabic-UI e2e test only runs on Linux/Windows (Chromium on macOS ignores `--lang`).
- **Firefox:** `npm run lint:firefox` must report 0 errors. The two `UNSAFE_VAR_ASSIGNMENT`
  warnings come from React DOM internals and are expected.
- Every bug fix gets a regression test at the lowest level that reproduces it.

### Comments
- Comment only the **why**: browser/platform quirks, workarounds, non-obvious decisions, known
  ambiguities. Short JSDoc on exports when the name doesn't state the contract.
- Never restate the code, never leave commented-out code, no section-divider comments,
  no `TODO` without a concrete reason (track open work in this file instead).
- In tests the test name is the documentation; comment only surprising rules.

### Code
- Lint and format with **Biome** (`biome.json`): TypeScript 7 has no JS API, so typescript-eslint
  can't run. Fix findings rather than suppressing; a `biome-ignore` needs a reason.
- Functions stay under 50 lines — split React components into child components and hooks.
- TypeScript strict; explicit return types on exports; no `any`.
- Immutable data (`Readonly`, `Object.freeze`, no mutation of inputs).
- No network calls, analytics or data collection — Firefox manifest declares `required: ['none']`.

---

## 8. Roadmap

> **Paused plan (after v1.0):** [docs/plans/2026-09-23-multi-language-selection-button.md](docs/plans/2026-09-23-multi-language-selection-button.md) — more languages (Russian, Ukrainian next) and smart ranking. Done for v1: phase 0 (physical-key model), the language-pair setting, and the selection button for Arabic ⇄ English. **v1.0 is Arabic ⇄ English only — don't add languages until the plan resumes.**


- **v1.2:** smart detection — offer to fix a word that is not a real word in either language
- **v1.3:** macOS "Arabic" layout, Persian, Urdu, Hebrew, Russian maps
- **v2:** Safari (macOS/iOS) via Xcode Safari Web Extension converter

## 9. Publishing checklist

Release texts live in `docs/store/listing.md`; the privacy policy is `PRIVACY.md`.

- [ ] Replace the placeholder gecko id `layout-fixer@layoutfixer.app` with one you own
- [ ] Chrome Web Store (one-time $5) and Edge Add-ons (free) — upload `package:chrome` zip
- [ ] addons.mozilla.org (free) — upload `package:firefox` zip, mark Android compatible
- [ ] Screenshots 1280×800 + a before/after GIF, listing in Arabic and English
- [x] Privacy policy contact → GitHub Issues; public URL = `PRIVACY.md` in the repository
- [x] License: MIT (`LICENSE`); repository: github.com/BugsBountyHunter/layout-fixer
