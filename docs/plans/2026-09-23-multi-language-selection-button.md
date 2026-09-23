# Plan — Multi-language support + selection button

**Status:** ⏸ paused (2026-09-23). Shipped in v1.0: phase 0, the language-pair setting (phase 1, Arabic + English only) and the selection button (phase 3, Arabic ⇄ English). Resume with phase 2 (Russian, Ukrainian) after release. · **Date:** 2026-09-23

## Decisions

- **Permission:** option A — opt-in. No host permissions at install; the user enables the
  selection button once and the browser asks then (`optional_host_permissions`).
- **Languages are user-controlled:** the user picks which languages are enabled and their order
  (options page + popup). Nothing is hard-wired to Arabic.
- **First wave:** Arabic (PC + Mac) + **Russian** + **Ukrainian**. Hebrew, Persian and the rest
  follow as later waves; each is data + fixtures only once phase 0 lands.

## Goal

1. When the user selects text, a small **Layout Fixer button** appears next to the selection.
   Clicking it shows the user's languages (e.g. `ع` `Рус` `עב` `EN`) with a live preview, and one
   click converts the text to that language.
2. Support the **most common "wrong layout" languages**, not only Arabic.
3. Keep everything that works today: shortcut, context menu, popup, all browsers/OSes, no data collection.

---

## 1. Which languages (and why)

A language benefits only if people type it on a **keyboard layout that shares physical keys with
Latin**, and switch between the two often. Languages typed through an IME
(Chinese, Japanese) do not produce "wrong layout" gibberish the same way and are **out of scope**.

| Wave | Languages | Why | Complexity |
|------|-----------|-----|------------|
| 1 | Arabic (PC + Mac) ✅, **Russian**, **Ukrainian** (then Hebrew, Persian) | Largest bilingual-typing populations; simple 1-key → 1-char maps | Low — same model as Arabic |
| 2 | **Greek**, **Bulgarian**, **Urdu**, **Turkish** (Q ↔ US), **Kazakh** | Common, still 1:1 maps | Low–medium (Greek has dead-key accents) |
| 3 | **Thai**, **Hindi** (InScript/Devanagari), **Georgian**, **Armenian** | Popular but with combining marks / reordering | Medium |
| 4 | **Korean** (2-set Hangul) | Very common pain, but keystrokes must be **composed** into syllables (ㅎ+ㅏ+ㄴ → 한) | High — needs a composition engine |
| 4 | Latin ↔ Latin: **French AZERTY**, **German QWERTZ** | Users whose base keyboard isn't US QWERTY | Medium — requires the generic model below |

Every layout ships with **both OS variants** where they differ (e.g. `Russian` vs `RussianWin`,
`Hebrew` vs `Hebrew-PC`), verified against real OS data (see §4).

---

## 2. Core redesign: physical-key model

Today a map is "US character → Arabic character". That can't express AZERTY/QWERTZ users, and it
means every new language is special-cased. Switch to **physical keys**, named like the standard
`KeyboardEvent.code` values (`KeyQ`, `Semicolon`, `Backquote`, …):

```ts
interface KeyboardLayout {
  id: 'ru-pc' | 'ru-mac' | 'ar-pc' | 'ar-mac' | 'en-us' | 'fr-azerty' | …
  language: 'ru'                 // BCP-47
  label: 'Русский'               // native name for chips
  chip: 'Рус'                    // 1–3 char badge
  script: RegExp                 // /[Ѐ-ӿ]/ — for detection
  platform: 'pc' | 'mac' | 'any'
  keys: Record<KeyCode, { base: string; shift: string }>
}

convert(text, { from: 'en-us', to: 'ru-pc' })  // any layout → any layout
```

- Converting = look each character up in the `from` layout to get *(key, shift)*, then emit the
  `to` layout's character for that key. Longest-match stays (lam-alef, and Thai/Hindi clusters).
- **Detection** becomes `detectScript(text)` → the non-Latin script present decides the source
  layout; for Latin gibberish the target is one of the user's enabled languages (ranked, §5).
- The current Arabic maps and tests migrate unchanged in behavior (tests are the safety net).

---

## 3. Selection button (the new UI)

### Behavior
- Appears ~8px after the end of a **non-empty selection** (mouse, keyboard, or touch), after a
  short debounce (~150 ms). Hidden while dragging, on scroll, `Esc`, click-outside, or when the
  selection is cleared.
- **Collapsed:** a 28px round button with the logo. **Expanded (hover/click/Enter):** a menu with
  - the **best guess first**, with a preview: `Рус → привет`
  - the user's other enabled languages as chips
  - "⚙ Languages…" → options page
- Click applies: replaces in place when editable (with undo, same code path as today), otherwise
  copies + shows the toast.
- Never shown in password fields, on the extension's own pages, or on sites the user disabled.

### Engineering rules (cross-platform)
- Rendered in a **shadow root** (page CSS can't break it); `mousedown`/`pointerdown` call
  `preventDefault()` so clicking the button **doesn't clear the selection**.
- Positioned from `range.getBoundingClientRect()`, clamped to the viewport, flipped above/below;
  logical properties so it's correct in RTL pages.
- Works in iframes (injected with `allFrames`), keyboard-accessible (`role="menu"`, arrow keys),
  44px targets under `(pointer: coarse)` for Firefox Android, respects reduced motion + dark mode.
- Cheap: one passive `selectionchange` listener; the UI is created lazily on first use.

### Permission trade-off (decided: option A)
The shortcut and context menu work with `activeTab` (no warning). A button that appears
**on every page** needs a content script on all sites, which shows the install warning
*"Read and change all your data on all websites"*. Options:

| Option | Install warning | UX |
|--------|-----------------|----|
| **A. Opt-in (recommended):** `optional_host_permissions: ["<all_urls>"]`; the popup/options page has "Show button when I select text" → browser asks once → `scripting.registerContentScripts` | None at install | One extra click to enable |
| B. Always on: `content_scripts` on `<all_urls>` | Yes, at install | Works immediately; hurts trust + store review |
| C. Per-site: request only the current site's origin from the popup | None | Most private; tedious for users |

Firefox (desktop + Android) and all Chromium browsers support A.

---

## 4. Layout data & verification

- `scripts/dump-macos-layout.swift` (already added) dumps any macOS layout. Extend it to output by
  physical key code and generate fixtures for every layout in the table
  (`Russian`, `RussianWin`, `Hebrew`, `Hebrew-PC`, `Persian-ISIRI2901`, `Ukrainian-PC`, `Greek`, …).
- **Linux:** generate the same fixtures from `xkeyboard-config` (XKB) in CI, so Linux/ChromeOS
  mappings are verified too.
- **Windows:** verify the `-PC`/`Win` variants against Microsoft's published layouts (KLC data)
  once; record any differences as separate variants.
- One generic test per layout: *every mapped key types exactly what the OS types*, plus round-trip
  tests (`from → to → from`) for each pair.

---

## 5. Smart ranking (which language did they mean?)

For Latin gibberish, convert with every enabled layout and score each result with a small
**letter-bigram frequency table per language** (a few KB, no network). The top score is the
"best guess" shown first in the button menu and used by the keyboard shortcut.
Tie or low confidence → fall back to the user's preferred language order.

---

## 6. Settings (new options page + popup)

Stored in `chrome.storage.sync`, **validated on read** (never trust storage):
- My languages (ordered) — default from `navigator.languages` + English
- Layout variant per language (PC / Mac) — default from the OS
- Show selection button (on/off) + per-site disable list
- Shortcut behavior: "best guess" vs "always ask"

Popup gains a language picker (from/to) replacing today's Auto / EN→AR / AR→EN toggle.
Adds the `storage` permission (no install warning).

---

## 7. Phases & deliverables

| Phase | Deliverable | Tests (written first) |
|-------|-------------|------------------------|
| **0** ✅ | Physical-key model; migrate Arabic PC + Mac; `detectScript` | All 137 existing tests stay green; fixture tests per layout |
| **1** | Settings module + options page + popup language picker (incl. Arabic PC/Mac choice) | Settings validation, storage mocks, popup e2e |
| **2** | Wave 1 languages: Russian, Ukrainian (PC + Mac); then Hebrew, Persian | Fixture + round-trip tests per layout |
| **3** | Selection button with opt-in permission (option A) | DOM tests (positioning, focus, a11y), e2e: select → button → convert, iframe, RTL page, permission flow |
| **4** | Smart ranking | Ranking accuracy tests on sample sentences per language |
| **5** | Wave 2 languages (+ Greek dead keys) | As phase 2 |
| **6** | Wave 3 (Thai, Hindi, Georgian, Armenian), then Korean composition | Cluster/composition unit tests |

UI localization grows alongside: add `ru`, `he`, `fa` UI strings with their languages
(the locale test already enforces identical keys; RTL is already handled).

---

## 8. Risks

- **Permission trust** — mitigated by opt-in (option A) and a clear privacy line in the UI.
- **Other selection popups** (Grammarly, translators) may overlap — offset + let users disable per site.
- **Rich editors with custom selection** (Google Docs canvas, some shadow-DOM editors) — button
  shows the copy/toast fallback there.
- **Layout variants multiply** — mitigated by generated fixtures instead of hand-written maps.
- **Ambiguous Latin input** (short words valid in several languages) — ranking + user order.
- **Korean/Thai/Hindi** composition rules — isolated in their own phases with dedicated tests.
