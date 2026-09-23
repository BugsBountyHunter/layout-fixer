# Manual test checklist — v1.0

Run before every release. Automated tests cover the logic; this checks the real thing on each
browser and OS. Tick each box per browser.

## Setup

```bash
npm run build          # dist/chrome and dist/firefox
npm run playground     # test page at http://localhost:4321
```

| Browser | Load the extension |
|---------|--------------------|
| Chrome / Brave / Vivaldi | `chrome://extensions` → Developer mode → **Load unpacked** → `dist/chrome` |
| Edge | `edge://extensions` → Developer mode → **Load unpacked** → `dist/chrome` |
| Opera | `opera://extensions` → Developer mode → **Load unpacked** → `dist/chrome` |
| Firefox | `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → `dist/firefox/manifest.json` |

After rebuilding: click reload ↻ on the extension card (Firefox: **Reload** in about:debugging),
then refresh the test page.

## A. Test page (http://localhost:4321)

Follow the instructions on each numbered card.

| # | Check | Chrome | Firefox | Edge |
|---|-------|:-:|:-:|:-:|
| 1 | Input, whole field → `السلام عليكم`; undo restores | ☐ | ☐ | ☐ |
| 2 | Input, only the selection is converted | ☐ | ☐ | ☐ |
| 3 | Textarea, English typed on Arabic → `hello` / `world` | ☐ | ☐ | ☐ |
| 4 | Rich editor converted; undo restores | ☐ | ☐ | ☐ |
| 5 | Framework input: the bold line updates too | ☐ | ☐ | ☐ |
| 6 | Read-only text: message shows the fixed text, clipboard has it, page unchanged | ☐ | ☐ | ☐ |
| 7 | Iframe: field converted, no message on the main page | ☐ | ☐ | ☐ |
| 8 | Nothing selected: "Select the text you want to fix first" | ☐ | ☐ | ☐ |
| 9 | Mac word follows the layout setting (see section C) | ☐ | ☐ | ☐ |
| 10 | Password field unchanged | ☐ | ☐ | ☐ |
| — | Right-click → **Fix keyboard layout** works the same as the shortcut | ☐ | ☐ | ☐ |

## B. Popup

| Check | Chrome | Firefox | Edge |
|-------|:-:|:-:|:-:|
| Pin the extension; click the icon → popup opens, cursor in the text box | ☐ | ☐ | ☐ |
| Paste `hgsghl ugd;l` → `السلام عليكم` appears live | ☐ | ☐ | ☐ |
| **EN → AR** / **AR → EN** force the direction | ☐ | ☐ | ☐ |
| **Copy** and **Cmd/Ctrl+Enter** copy the result; **Clear** empties the box | ☐ | ☐ | ☐ |
| Footer shows the real shortcut (⌥⇧F on Mac, Alt+Shift+F elsewhere); clicking it opens shortcut settings | ☐ | ☐ | ☐ |
| "Arabic keyboard: …" shows the active layout; gear / **Settings** opens the settings page | ☐ | ☐ | ☐ |

## C. Settings page

| Check | Chrome | Firefox | Edge |
|-------|:-:|:-:|:-:|
| Opens in a tab; **Automatic** selected; "Now using" shows Mac on macOS, PC elsewhere | ☐ | ☐ | ☐ |
| Choose **PC** → "✓ Saved"; test page card 9 → `مدحبا` | ☐ | ☐ | ☐ |
| Choose **Mac** → test page card 9 → `مرحبا` | ☐ | ☐ | ☐ |
| With the popup open, changing the layout in settings updates the popup result | ☐ | ☐ | ☐ |
| Turn **On-page messages** off → card 6 copies silently, card 8 shows nothing | ☐ | ☐ | ☐ |
| Reload the settings page → choices are kept | ☐ | ☐ | ☐ |
| **Change shortcut** opens the browser's shortcut page | ☐ | ☐ | ☐ |

## C2. Selection button

| Check | Chrome | Firefox | Edge |
|-------|:-:|:-:|:-:|
| Off by default: selecting text shows no button | ☐ | ☐ | ☐ |
| Settings → turn on **Show a button when I select text** → the browser asks for access → allow → switch stays on | ☐ | ☐ | ☐ |
| Deny the prompt instead → switch goes back off with a short notice | ☐ | ☐ | ☐ |
| Test page card 11: select text → icon appears next to it → click → menu shows **العربية** with a preview → click → fixed | ☐ | ☐ | ☐ |
| English typed on the Arabic layout (card 3) → menu offers **English** | ☐ | ☐ | ☐ |
| Input (card 1): select, click the icon, pick → value replaced, cursor stays in the field, undo works | ☐ | ☐ | ☐ |
| Escape, clicking elsewhere, or scrolling hides the icon | ☐ | ☐ | ☐ |
| Works in a tab that was already open before turning it on | ☐ | ☐ | ☐ |
| No icon on the password field (card 10) | ☐ | ☐ | ☐ |
| Turn it off → the icon stops appearing on open pages | ☐ | ☐ | ☐ |
| Remove site access from the browser's extension page → the setting shows off | ☐ | ☐ | ☐ |
| Settings → **Languages** shows Arabic and English; picking the same language twice swaps them | ☐ | ☐ | ☐ |

## D. Real websites

| Site | What to do | ☐ |
|------|------------|:-:|
| Gmail | New message → type Arabic with the English layout → select → shortcut; undo | ☐ |
| WhatsApp Web | Same in the message box | ☐ |
| Google search | Same in the search box | ☐ |
| Any chat / social site | Select a received message typed wrong → message shows fixed text | ☐ |
| `chrome://extensions` / `about:addons` | Shortcut does nothing and nothing breaks (browsers block extensions there) | ☐ |

## E. Appearance and language

| Check | ☐ |
|-------|:-:|
| Dark mode (OS setting) → popup, settings page and on-page message are dark | ☐ |
| Arabic interface: set the browser's display language to Arabic, restart → popup and settings are in Arabic and right-to-left. Chrome on macOS: *System Settings → General → Language & Region → Applications → Google Chrome → Arabic*. Windows/Linux: `chrome://settings/languages` → "Display Google Chrome in this language". Firefox: *Settings → Language* | ☐ |
| Toolbar icon is sharp in light and dark toolbars | ☐ |

## F. Other platforms (if available)

| Platform | Check | ☐ |
|----------|-------|:-:|
| Windows | Sections A–C in Chrome or Edge; shortcut shows `Alt+Shift+F`; Automatic = PC | ☐ |
| Linux / ChromeOS | Sections A–B | ☐ |
| Firefox for Android | Install via `npx web-ext run -t firefox-android` (needs USB debugging); popup opens as a page and converts; settings work | ☐ |

## Reporting a problem

Note the browser + version, OS, the card or site, what you did, what you expected and what
happened. Open the console for details:
- Page: DevTools (⌥⌘I / F12) → Console, look for `[layout-fixer]`
- Background: `chrome://extensions` → Layout Fixer → **service worker**; Firefox: about:debugging → **Inspect**
