# Switch the keyboard layout after a fix

**Status:** phases 1 (macOS) and 2 (Windows, Linux X11) implemented on `feat/switch-keyboard-layout`, 2026-09-27.

**Decided 2026-09-27:** on by default in the desktop app. The extension gets it later, through native
messaging to the desktop app (phase 4), after the desktop release.

## Goal

When Layout Fixer converts the selection, the user's next keystrokes are usually still wrong: they
typed Arabic on the English layout, we fixed the text, and the English layout is still active. After a
successful fix, switch the system keyboard layout to the language the text was converted **to**.

`hgsghl` → `السلام` switches to Arabic. `ميهس` → `this` switches to English.

## Rules

- Switch only after the fix pasted text (`kind: 'fixed'`). Never on "nothing selected", "nothing to
  fix" or an error.
- Switch only to a layout the user already has enabled. We never add, remove or reorder the OS input
  sources. If the target language has no enabled layout, do nothing (Settings shows a hint).
- If the target layout is already active, do nothing.
- Switch **after** the paste and the clipboard restore, so the paste shortcut is never pressed while
  the layout is changing.
- A setting, **"Switch keyboard layout after fixing"**, on by default in the desktop app. Failure to
  switch is silent (logged), because the fix itself succeeded.
- No new permissions on macOS or Windows. No keyboard hook.

## Choosing the target layout

The web side knows the direction (`detectDirection`) and passes the target language, `ar` or `en`.
The Rust side lists the enabled keyboard layouts and picks one:

1. **Arabic:** the layout that matches the user's Arabic-layout setting (`ar-pc` →
   `com.apple.keylayout.ArabicPC` / Windows KLID `00000401`; `ar-mac` → `com.apple.keylayout.Arabic`),
   else the first enabled layout whose language is `ar`.
2. **English:** the first enabled layout whose language is `en` (ABC, U.S., British…), in the user's
   own order.

Keyed by language code, not by Arabic/English, so it follows the multi-language plan (Russian and
Ukrainian fixtures already exist in `packages/core`).

**Bonus:** the same list lets Settings suggest the right Arabic layout. On the maintainer's Mac the
enabled source is `com.apple.keylayout.Arabic` (the Mac layout), a mismatch the app can now point out.

## Platform APIs

| Platform | List | Switch | Notes |
|---|---|---|---|
| macOS | `TISCreateInputSourceList` (keyboard, select-capable), `kTISPropertyInputSourceLanguages` | `TISSelectInputSource` | Carbon/HIToolbox. No permission. Verified listing on 2026-09-27 (ABC + Arabic). Check with "Automatically switch to a document's input source" on. |
| Windows | `GetKeyboardLayoutList`, `PRIMARYLANGID(LOWORD(hkl))` | `PostMessageW(GetForegroundWindow(), WM_INPUTLANGCHANGEREQUEST, 0, hkl)` | Layouts are per thread, so we ask the focused window to change. Elevated windows ignore it (UIPI), same limit as the paste. Console and some UWP windows need a manual check. |
| Linux X11 | `_XKB_RULES_NAMES` on the root window (what `setxkbmap -query` reads: `us,ara` + variants) | `xkb::latch_lock_state` (lock group) | Works where every layout is an XKB group (KDE, Xfce, Cinnamon, MATE, setxkbmap). GNOME loads one layout at a time, so only the active one is listed and nothing switches; a GNOME route (its input-source D-Bus/gsettings) is later work. Wayland is already unsupported. |

## Changes

### Rust (`apps/desktop/src-tauri`)

- `fix/input_sources.rs`: the `InputSources` trait (`enabled`, `current`, `select`), `InputLayout { id, languages }`,
  and the pure `choose` / `switch_to` with every selection rule, unit tested with fakes like `flow.rs`.
- Platform impls: `platform/{macos,windows,linux}/input_sources.rs`; other systems return `Unsupported` from
  `platform/unsupported.rs`. Windows ids are HKLs as `HHHHLLLL` (`04010401` = Arabic (101)) with the language from
  `LCIDToLocaleName`; Linux ids are XKB layouts with the variant (`ara`, `ara(mac)`).
- `switch_layout { language, layout }` in `commands.rs` (done), run on the main thread; `list_layouts` comes
  with the phase 3 hints.
- `Cargo.toml`: Windows feature `Win32_Globalization`; Linux `x11rb` feature `xkb`. macOS links Carbon (no new
  crate; the few TIS functions are declared with `extern "C"`).

### Web (`apps/desktop/src`)

- `FixBridge.switchLayout(language)`, called in `fixSelection` after a `'fixed'` outcome when the
  setting is on. Its error is caught and never changes the outcome.
- Setting `switchLayout: boolean` (default `true`) in `useSettings.ts`, a toggle in
  `GeneralSection.tsx`, EN + AR strings.
- Settings hint when the target language has no enabled layout, and when the Arabic-layout setting
  doesn't match the enabled Arabic layout.

### Browser extension (phase 4, needs the desktop app)

A browser extension **cannot** change the OS keyboard layout; Chrome has no such API outside
ChromeOS (`chrome.input.ime`). The only route is **native messaging** to the desktop app:

- The desktop app installs a native-messaging host manifest for Chrome (and Edge/Firefox later) on
  first run, pointing at its own binary with a `--native-host` flag. That mode reads one message,
  switches the layout with the same Rust code and exits.
- The extension asks for `nativeMessaging` as an **optional** permission when the user turns the
  option on, so existing users see no new install warning. Hidden when the host isn't installed.
- After a fix, the content script reports the direction to the service worker, which calls
  `chrome.runtime.sendNativeMessage('io.github.bugsbountyhunter.layoutfixer', { switchTo: 'ar' })`.
- Needs the extension ID in the host manifest's `allowed_origins`
  (`chrome-extension://cikmlhdhgneblnmkkmiolciffcgbgljj/`).

Ship desktop first; the extension follows once the desktop release with the host is out.

## Phases

1. ✅ **Core + macOS** — trait, `switch_to` with tests, macOS impl, command, setting, toggle.
   Verify live on macOS with `key code` driven tests (the Arabic layout is often active).
   Desktop 1.1.0.
2. ✅ **Windows + Linux X11** — impls; CI builds; manual runs (Notepad, a browser, an elevated app,
   GNOME and KDE on X11).
3. **Settings hints** — missing layout, Arabic-layout mismatch.
4. **Extension via native messaging** — host mode + manifest install in the desktop app, optional
   permission and toggle in the extension. Extension 1.1.0. Update PRIVACY.md (the host receives only
   a language code) and the store listing permissions note.

## Tests

- Rust: `choose` / `switch_to` tests (preferred id, fallback by language, already active, none
  enabled, `en` variants). Fake switcher to check "switch runs after paste + restore".
- Web: `fix-flow.test.ts` — switches only on `'fixed'`, not when the setting is off, a switch error
  keeps `'fixed'`, target language follows the direction.
- Extension (phase 4): handler test with a fake `sendNativeMessage`; no call without the permission.
- Manual: each OS, both directions, the target already active, the target not installed.

## Risks

- **macOS per-document input source.** With "Automatically switch to a document's input source" on,
  the change is remembered per window, which is what we want; check that it sticks.
- **Windows focus.** `GetForegroundWindow` must still be the target app when we post; the HUD must
  not take focus (it doesn't today).
- **Linux desktop environments** may override an XKB group lock. Document as best effort.
- **Surprise.** Some users may not want it; hence the toggle, mentioned in the release notes.
