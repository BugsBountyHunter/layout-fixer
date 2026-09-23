# Layout Fixer Design System

Tokens: [`src/ui/tokens.css`](../src/ui/tokens.css) — the only place a color, size, radius,
shadow or duration is defined. Everything else references `var(--lf-*)`.

Direction: **Apple Human Interface Guidelines**, adapted for a bilingual browser extension and
held to WCAG AA where stock Apple values fall short.

## Principles

1. **Deference.** Layout Fixer is a guest on Gmail, Slack and every other page. It stays quiet:
   no decorative borders, gradients or shadows on in-page content. Hierarchy comes from spacing,
   weight and fills.
2. **Clarity.** The converted text is the hero of every surface — the largest, darkest text.
   Everything else steps back with secondary labels.
3. **Depth with purpose.** Only UI that floats over a page gets depth: translucent, blurred
   material and one soft shadow, like macOS menus. Everything else is flat.
4. **Native everywhere.** SF Pro and SF Arabic on Apple devices, Segoe UI Variable on Windows,
   Noto on Linux, ChromeOS and Android. The system font *is* the Apple principle; imitating SF
   elsewhere would break it (and SF's license only covers Apple platforms).
5. **Bilingual by construction.** Logical properties, `dir="auto"` on user text, mirrored arrows,
   no letter-spacing on Arabic.
6. **Accessible by default.** Text ≥ 4.5:1, control boundaries ≥ 3:1 (checked over black *and*
   white pages for translucent UI), 44px touch targets, reduced motion and reduced transparency.

---

## Review: AI-generated patterns removed (2026-09-23)

The first draft kept the shipped look. Measured against common AI-generated design defaults and
Apple's HIG, these were replaced:

| Pattern | Was | Now |
|---|---|---|
| Tailwind default indigo `#4f46e5` | Accent everywhere | Apple blue `#0071E3` fill, `#0066CC` link text |
| Purple-blue gradient | Logo, language chips | Solid accent squircle; chips are solid accent |
| Outlined card on everything | Sections, choices, menu, toast | Grouped inset lists (System Settings), separators inset from the leading edge |
| Accent stripe on rounded cards | Danger/warning notices | Symbol + colored title inside a plain fill |
| Outlined secondary buttons | Clear, Change shortcut | Gray fill (`--lf-fill`), Apple's bordered style |
| Flat boxes with heavy shadow | On-page menu, toast | Translucent blurred material + hairline + one soft shadow |
| `⚙` text glyph | Menu settings row | Drawn gear icon, stroke 1.5 |
| 6 shadows, 7 radii | Everywhere | 2 depths, 3 radii + capsule |

## Audit of the shipped UI (still applies)

| # | Severity | Issue | Where | Fixed by |
|---|---|---|---|---|
| 1 | High | Palette copied 3× and drifting (toast dark-by-default, `--hover` only on-page) | `theme.css`, `selection-ui.styles.ts`, `toast.ts` | One `tokens.css` via `:root, :host` |
| 2 | High | Input/select/switch-off boundary 1.43:1 light, 1.60:1 dark (needs 3:1) | textarea, select, `.switch` | `--lf-control-border` 3.62 / 4.09 |
| 3 | High | White text on teal chip 2.49:1 | menu `.chip` | Solid `--lf-accent` 4.70 |
| 4 | Medium | `button.secondary` used but unstyled | `App.tsx` | Gray-fill button |
| 5 | Medium | No danger/warning colors | `.notice[role=alert]` | Status tokens + Notice |
| 6 | Medium | Primary has no hover/pressed state | `theme.css` | `--lf-accent-pressed` |
| 7 | Medium | `.field-label` defined twice | `popup.css`, `options.css` | Shared component CSS |
| 8 | Low | 7 radii, 6 shadows, 3 durations, em/px mix | all | Scales below |
| 9 | Low | `.section-hint` needs `!important` | `options.css` | `gap`-based stacks |

---

## Tokens

### Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--lf-bg` | `#ffffff` | `#1c1c1e` | Popup, text fields |
| `--lf-bg-grouped` | `#f2f2f7` | `#000000` | Settings page background |
| `--lf-group` | `#ffffff` | `#1c1c1e` | Grouped list rows |
| `--lf-fill` | gray 12% | gray 24% | Secondary buttons, segmented track, hover |
| `--lf-fill-strong` | gray 20% | gray 36% | Pressed |
| `--lf-material` | white 92% + blur | `#28282a` 92% + blur | Selection menu, toast |
| `--lf-label` | `#1d1d1f` | `#f5f5f7` | Primary text |
| `--lf-label-secondary` | `#6e6e73` | `#98989d` | Hints, footnotes |
| `--lf-label-on-material` | `#636366` | `#aeaeb2` | Secondary text on materials |
| `--lf-separator` | `rgb(60 60 67/.18)` | `rgb(84 84 88/.6)` | Row dividers |
| `--lf-control-border` | `#86868b` | `#7c7c80` | Text fields, switch off |
| `--lf-accent` | `#0071e3` | `#0071e3` | Filled buttons, switch on, logo, chips |
| `--lf-accent-pressed` | `#0066cc` | `#0066cc` | Primary hover/pressed |
| `--lf-accent-soft` | `#eef5fd` | `#11243a` | Selected row, promo |
| `--lf-link` | `#0066cc` | `#2997ff` | Links, checkmarks, selected text |
| `--lf-success` / `danger` / `warning` | `#1e7b34` `#d70015` `#c93400` | `#30d158` `#ff453a` `#ff9f0a` | Status |

**Why two blues:** Apple's `#0071E3` is 4.70:1 under white text, good for buttons, but only
4.21:1 as text on the grouped gray. Link text uses apple.com's `#0066CC` (4.99:1 there).

**Measured (light / dark):** label 16.8 / 15.6 · secondary 5.07 / 5.93 (4.54 on grouped) ·
control border 3.62 / 4.09 · link 5.57 / 5.64 · status 5.33, 5.38, 5.28 / 8.42, 4.99, 8.28 ·
secondary on accent-soft 4.62 · on-material secondary ≥ 5.02 over black, white and gray pages.

### Typography

Apple's macOS text styles, each one step larger because Arabic glyphs need the size.

| Token | Size | Weight | Use |
|---|---|---|---|
| `--lf-text-large-title` | 26 | bold | Settings page title |
| `--lf-text-title` | 20 | bold | Group titles on settings page |
| `--lf-text-title3` | 17 | semibold | Popup title, converted-text output |
| `--lf-text-headline` | 15 | semibold | Row titles |
| `--lf-text-body` | 14 (16 touch) | regular | Body, buttons |
| `--lf-text-callout` | 13 | regular | Hints, segmented labels |
| `--lf-text-footnote` | 12 | regular | Group footers, menu header, kbd |

- Weights: 400 / **590** (SF semibold) / 700.
- `--lf-tracking-display` (−0.022em) on Latin titles ≥ 20px only: `:lang(en) h1`. Never on Arabic.
- Section labels are sentence case, not uppercase. Apple dropped all-caps group headers.

### Space, radius, depth, motion

| Scale | Values |
|---|---|
| Space | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 |
| Radius | `sm` 6 (kbd, menu items) · `md` 10 (buttons, fields, chips) · `lg` 14 (groups, menu, toast) · `full` (switch, segmented) |
| Depth | `raised`: selected segment, switch thumb · `float`: menu, toast, selection trigger |
| Motion | `fast` 150ms, `base` 250ms, `ease` (Apple ease-out); `ease-spring` only for the switch thumb. 0ms under reduced motion |

Progressive enhancement for Apple's continuous corners, where supported:
`@supports (corner-shape: squircle) { .group { corner-shape: squircle; border-radius: 20px } }`
(a squircle needs a larger radius to look the same size).

---

## Components

### Button

| Variant | Look | Use when |
|---|---|---|
| Filled | `--lf-accent`, white label | The one main action (Copy) |
| Gray | `--lf-fill`, label color | Supporting actions (Clear, Change shortcut) |
| Plain | Text only, `--lf-link` | Inline links (Open settings, Turn on) |
| Icon | Plain icon, `--lf-label-secondary`, fill on hover | Toolbar (gear), needs `aria-label` |

Height `--lf-control-height`, padding-inline 14px, radius `md`, weight semibold.
Hover/pressed: filled → `--lf-accent-pressed`; gray → `--lf-fill-strong`. Disabled 40% opacity.
Feedback: "Copy" becomes "✓ Copied" for 1.5s with a `min-width` so the button doesn't jump.

### Text field

`--lf-bg`, 1px `--lf-control-border`, radius `md`, padding 8/12. Focus: border turns
`--lf-focus` + 3px halo (`--lf-accent-soft`). The converted output is `title3` with no border:
a plain `--lf-fill` well. It's the result, not an input.

### Segmented control

Apple's control exactly: `--lf-fill` track, capsule, 2px inset. The selected segment is `--lf-bg`
with `shadow-raised`. Labels callout, semibold when selected. Arrows mirror in RTL.

### Grouped list (settings page)

Replaces bordered sections. Page on `--lf-bg-grouped`; groups are `--lf-group`, radius `lg`,
no border, no shadow. Group title (title3, bold) above; footer hint (footnote, secondary) below.
Rows are 44px min, padding 12/16, separated by a hairline inset from the leading edge, so it
flips in RTL. A `:target` group gets a 3px `--lf-accent-soft` halo for deep links (`#selection`).

### Choice rows (layout picker)

Rows inside a group, not separate cards. The selected row shows a `--lf-link` checkmark at the
trailing edge (Apple's list selection) and its title turns `--lf-link`. The native radio stays
for keyboard and screen readers but is visually hidden.

### Switch

42×26 capsule. Off: `--lf-fill-strong` track + 1px inset `--lf-control-border` ring (3:1).
On: `--lf-accent`. White thumb with `shadow-raised`, moves with `inset-inline-start` on
`ease-spring`. `<input type="checkbox" role="switch">`.

### Notice

No stripes. A `--lf-fill` or `--lf-accent-soft` rounded block with a leading symbol:

| Variant | Symbol | Title color | Role |
|---|---|---|---|
| Promo | — | label + plain link | none |
| Success | ✓ | `--lf-success` | `status` |
| Warning | ! in triangle | `--lf-warning` | `status` |
| Danger | ! in circle | `--lf-danger` | `alert` |

### Keyboard keys

`<kbd>`: `--lf-fill` background, radius `sm`, footnote size, no borders (macOS menu style).
`dir="ltr"` group; keys from `formatShortcut()`.

### Logo and trigger

Solid `--lf-accent` squircle with the white **A ⁄ ع** mark. No gradient. The on-page trigger is
the logo at 28px with `shadow-float`, scaling in from 0.9 over `fast`.

### Selection menu (on-page)

Material: `--lf-material` + `backdrop-filter: var(--lf-material-filter)`, hairline, `shadow-float`,
radius `lg`, 5px padding. Header footnote in `--lf-label-on-material`. Items: radius `sm`, hover
fills with `--lf-accent` and turns every label white (the macOS menu highlight). Chip is a solid
`--lf-accent` 28px rounded square. Settings row below a separator, with a drawn gear icon.

### Toast (on-page)

Same material as the menu. Bottom-center, max 420px, radius `lg`. Caption footnote
`--lf-label-on-material`, converted text title3. Follows the OS theme (it was dark-by-default).

---

## Status

Applied 2026-09-23 on top of the grouped-list structure that was already in the code:
`theme.css` imports `tokens.css`; popup, settings, selection menu and toast use only `--lf-*`;
bundled Plex fonts removed; icons regenerated in Apple blue; the layout picker shows a trailing
checkmark. `src/ui/design-tokens.test.ts` guards against hex colors and bundled fonts creeping back.

Not yet done: the toolbar logo is the single-letter `ع` mark (the showcase explored `A ⁄ ع`);
`@fontsource/ibm-plex-sans-arabic` is only used by `scripts/generate-icons.py` and could move to
`devDependencies`.
