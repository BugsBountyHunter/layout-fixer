# Layout Fixer — UI brief for Claude Design

Paste everything below the line into claude.ai/design.

---

## Product

**Layout Fixer** (Arabic name: **مصحح لغة الكيبورد**) is a Chrome/Edge extension (Manifest V3).
It fixes text typed with the wrong keyboard layout, Arabic ⇄ English.

```
hgsghl ugd;l   →  السلام عليكم
اثممخ          →  hello
```

The user selects gibberish on any page and presses **Alt+Shift+F** (⇧⌥F on Mac) or right-clicks →
"Fix keyboard layout". The text is replaced in place. If the page can't be edited, the fixed text is
copied to the clipboard and a small toast appears.

- **Users:** people who type in both Arabic and English (students, office workers, developers).
- **Promise:** instant, private, local. No accounts, no network, no analytics. "No data leaves your device."
- **Personality:** calm, fast, a bit clever. A utility that stays out of the way. Not playful-cartoony,
  not corporate. Think Raycast or Linear-level polish in a tiny footprint.

## Design system to create

- **Bilingual and bidirectional from day one.** Every screen must work in English (LTR) and Arabic (RTL).
  Use logical properties (`margin-inline-start`, `inset-inline`), not left/right. Mirror directional icons (arrows).
  Text fields use `dir="auto"` because the content is often mixed.
- **Light and dark themes** via `prefers-color-scheme`. Define all colors as CSS custom properties.
- **Typography:** system fonts only (the extension makes no network requests, so no web fonts).
  Latin: `system-ui, -apple-system, "Segoe UI"`. Arabic: `"SF Arabic", "Geeza Pro", "Noto Sans Arabic", Tahoma`.
  Arabic needs about 10–15% more line height than Latin. Use a monospace stack for key caps.
- **Signature visual:** the *layout flip*, meaning the same physical key shows two glyphs (for example `h` / `ا`).
  Use it for the logo mark, empty states, and the welcome hero. Keycap components (`<kbd>`) appear everywhere.
- **Accent color:** one confident accent that works in both themes. Pass WCAG AA contrast.
- **Motion:** short (120–200ms) and functional. Respect `prefers-reduced-motion`.
- **Deliverable format:** plain HTML + CSS, with tokens as CSS variables (color, space, radius, type, shadow), so
  they can be ported to React components. Components needed: Button (primary / secondary / ghost / icon),
  Textarea, Segmented control, Toggle switch, Select, Keycap (`kbd`), Toast, Card, Link.

## Screen 1 — Popup (toolbar button)

Fixed width **340px**, height fits the content (Chrome caps it at 600px). Opens from the toolbar icon.

**Content, top to bottom:**
1. Header: logo mark + "Layout Fixer" + an icon button that opens the Options page.
2. Shortcut hint: "Select text on any page and press" [Alt] [Shift] [F]
   - Below it, in muted text: "or right-click → Fix keyboard layout"
   - **State: shortcut not set** → show the link "Set a keyboard shortcut" in place of the keycaps.
3. Input textarea. Label: "Text typed with the wrong layout", placeholder: "Paste or type here… e.g. hgsghl ugd;l"
4. Direction segmented control: **Auto · EN → AR · AR → EN**. In Auto, show a small detected-direction
   indicator (for example "Detected: EN → AR").
5. Output area. Label: "Fixed text", empty state: "The fixed text appears here."
   Actions: **Copy** (primary; changes to "Copied" ✓ for 1.5s) and **Clear** (ghost).

**States to design:** empty, typing (live conversion), copied, long text (scrolls inside the field),
shortcut not set, and Arabic UI (RTL, whole layout mirrored).

## Screen 2 — In-page toast

Injected into arbitrary websites inside a Shadow DOM. It must look right on top of *any* site (Gmail,
WhatsApp Web, Slack, Google). Fixed, bottom-center, 24px from the bottom, max-width `min(420px, 100vw − 32px)`,
top z-index, auto-dismisses after 4s, `role="status"`.

**Variants:**
1. **Copied fallback:** small muted line "Can't edit here — fixed text copied", then the fixed text in
   larger type (16px, selectable, up to 280 chars, then "…").
2. **Nothing selected:** "Select the text you want to fix first" (a hint, not an error).
3. **Success (optional, subtle):** "Fixed ✓", shown briefly after an in-place replace.

Include a close (×) button and a thin progress bar showing the time left before it closes. Show each variant in
light and dark, LTR and RTL, on a busy mock page background.

## Screen 3 — Options page

Full browser tab, centered column (max 640px). Settings save automatically, with a quiet "Saved" confirmation.

**Sections:**
1. **Keyboard shortcut:** show the current shortcut as keycaps plus a "Change shortcut" button. The browser
   manages shortcuts, so this opens `chrome://extensions/shortcuts`; explain that in one line.
2. **Direction:** toggle "Detect direction automatically" (on by default). When it is off, show a default-direction
   segmented control (EN → AR / AR → EN).
3. **Keyboard layout:** select "Arabic (PC / Windows 101)". Show "Arabic (Mac)", "Persian", "Urdu", "Hebrew" and
   "Russian" as disabled "Coming soon" options.
4. **Behavior:** toggle "Show a preview toast after fixing".
5. **Language:** Interface language (Auto / English / العربية).
6. **Privacy card:** "Everything runs on your device. No data is ever sent anywhere." Add a small lock or shield
   visual.
7. Footer: version number, "Rate on Chrome Web Store", "Report a problem".

## Screen 4 — Welcome page (opens once after install)

Full browser tab, a single scroll with 3–4 sections, bilingual.

1. **Hero:** headline "Typed in the wrong language? Fix it in one keystroke." Animated before → after demo:
   `hgsghl ugd;l` morphs into `السلام عليكم` (a simple CSS animation, looping).
2. **Try it now:** a real textarea pre-filled with gibberish, and the instruction "Select it and press
   Alt+Shift+F". Show a success state when it works ("You got it ✓").
3. **Three ways to fix:** keyboard shortcut, right-click menu, popup. Each gets an icon/illustration and one line.
4. **Pin it:** a small illustration of pinning the extension to the toolbar (puzzle icon → pin).
5. Privacy line + a "Open settings" link.

## Constraints

- No external images or fonts. Use inline SVG for icons and illustrations.
- Popup and toast must stay light: no heavy shadows or blur stacks on the toast (it runs on every site).
- Keyboard accessible. Visible focus rings. Every control has a label. Keep the tab order logical in RTL too.
- Show every screen in: **Light LTR · Dark LTR · Light RTL · Dark RTL**.

## Exact Arabic copy (use it instead of translating)

| Key | English | العربية |
|---|---|---|
| name | Layout Fixer | مصحح لغة الكيبورد |
| inputLabel | Text typed with the wrong layout | النص المكتوب بلغة خطأ |
| inputPlaceholder | Paste or type here… e.g. hgsghl ugd;l | الصق أو اكتب هنا… مثال: hgsghl ugd;l |
| outputLabel | Fixed text | النص بعد التصحيح |
| outputEmpty | The fixed text appears here. | سيظهر النص المصحح هنا. |
| direction | Direction · Auto · EN → AR · AR → EN | الاتجاه · تلقائي · إنجليزي إلى عربي · عربي إلى إنجليزي |
| copy / copied / clear | Copy / Copied / Clear | نسخ / تم النسخ / مسح |
| shortcutHint | Select text on any page and press | حدد النص في أي صفحة واضغط |
| shortcutNotSet | Set a keyboard shortcut | عيّن اختصار لوحة المفاتيح |
| contextMenuHint | or right-click → Fix keyboard layout | أو انقر بالزر الأيمن ← تصحيح لغة الكيبورد |
| toastCopied | Can't edit here — fixed text copied | لا يمكن التعديل هنا — تم نسخ النص المصحح |
| toastEmpty | Select the text you want to fix first | حدد النص الذي تريد تصحيحه أولًا |
