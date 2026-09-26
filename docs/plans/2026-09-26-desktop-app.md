# Plan — Layout Fixer for desktop (macOS, Windows, Linux)

**Status:** ✅ approved — phase 1 in progress · **Date:** 2026-09-26

## Decisions

- **Framework: Tauri 2.** A Rust shell with the system webview. Installers are about 5–10 MB instead
  of Electron's 100+ MB, which matters for an app that sits in the tray all day. The UI and the
  converter stay TypeScript.
- **Repository: this monorepo.** The app lives in `apps/desktop`, next to `apps/extension`, and uses
  `@layout-fixer/core`. This was done in #7.
- **v1 scope: fix the selected text only.** There is **no keyboard hook**. The app never records what
  the user types. It only reads the selection when the user presses the hotkey. Fixing the line
  before the cursor when nothing is selected is v1.1, opt-in (see Later).
- **Platforms in v1:** macOS 12+ and Windows 10/11 are fully supported. Linux on X11 is supported.
  Linux on Wayland shows an explanation instead, and support follows later.

## Goal

The same one-keystroke fix as the extension, in **every app**: Word, Slack desktop, WhatsApp desktop,
Notes, Terminal, VS Code, Outlook, and browsers without the extension.

```
select "hgsghl ugd;l" anywhere  →  ⌥⇧F / Alt+Shift+F  →  "السلام عليكم"
```

---

## 1. How the fix works

The app never reads other apps' text fields directly, because accessibility APIs differ per OS and
many apps (Electron, Java, terminals) don't expose them. It goes through the clipboard, the same way
long-standing layout switchers do:

1. **Hotkey released.** The app acts on key *release*. If it simulated ⌘C while the user still held
   ⌥⇧, the app would receive ⌘⌥⇧C. It also explicitly releases any modifiers that are still down.
2. **Save the clipboard.** It snapshots every text and image format currently on the clipboard.
3. **Copy the selection.** It writes a unique marker to the clipboard, sends ⌘C / Ctrl+C, then checks
   the clipboard every 20 ms for up to 400 ms.
   - The marker is replaced by text: that text is the selection.
   - The marker is still there: **nothing is selected**. The app restores the clipboard and shows
     "Select the text first".
4. **Convert.** `convert()` from `@layout-fixer/core` runs with auto-detected direction and the
   saved Arabic layout (automatic by default: `ar-mac` on macOS, `ar-pc` elsewhere). If the result
   is identical to the input, the app pastes nothing and shows "Nothing to fix".
5. **Paste.** It writes the result to the clipboard and sends ⌘V / Ctrl+V. The target app records the
   paste as one undo step, so ⌘Z / Ctrl+Z brings the original back.
6. **Restore the clipboard** about 250 ms later, so the target app has time to read the paste.

**Clipboard hygiene:**
- **Clipboard history apps:** on macOS the temporary entries carry
  `org.nspasteboard.TransientType` / `ConcealedType`, so clipboard managers skip them. On Windows
  they're excluded from clipboard history with `ExcludeClipboardContentFromMonitorProcessing`.
- **Formats that can't be restored:** file lists and app-private formats can't always be put back.
  When the snapshot has one of those, the app skips the restore rather than leave half a clipboard.

**Where the code lives:**

| Layer | Language | Responsibility |
|---|---|---|
| `fix-flow.ts` | TypeScript | The steps above, timeouts, messages. Unit-tested with a fake bridge |
| `@layout-fixer/core` | TypeScript | Conversion, unchanged |
| Native bridge (`src-tauri`) | Rust | `snapshot_clipboard`, `restore_clipboard`, `copy_selection`, `paste_text`, `release_modifiers`, `accessibility_status` |

The Rust side stays small and has no conversion logic. Key presses use the `enigo` crate
(`CGEventPost` on macOS, `SendInput` on Windows, XTest on X11).

---

## 2. Per-OS behaviour

### macOS
- **Accessibility permission** is required to send ⌘C/⌘V. The app checks it at launch with
  `AXIsProcessTrusted`. If it isn't granted, onboarding explains why and opens
  *System Settings → Privacy & Security → Accessibility*. The app then checks again when it comes
  back to the foreground, so no restart is needed.
- **No Input Monitoring permission is needed,** because the hotkey uses `RegisterEventHotKey` via
  the global-shortcut plugin, not a key tap.
- **Menu-bar app:** no Dock icon (`ActivationPolicy::Accessory`) and a template tray icon.
- **Secure Input:** when a password field has focus, macOS blocks synthetic keys. The app then
  shows "Can't fix text in password fields".
- **Signing — no Apple Developer account for now** (decided 2026-09-26). Downloads come from the
  landing page and GitHub Releases, not the App Store. What that means:
  - **First launch is blocked by Gatekeeper** ("Apple could not verify…"). Since macOS 15 the
    right-click → Open shortcut is gone. The user goes to *System Settings → Privacy & Security* and
    clicks **Open Anyway**, once. The landing page and the release notes show this with screenshots.
  - **Sign with our own self-signed certificate, not ad-hoc.** macOS remembers the Accessibility
    permission by code signature. An ad-hoc signature changes every build, so users would have to
    grant the permission again after every update. A self-signed "Layout Fixer" code-signing
    certificate stays the same, so the permission survives updates. The certificate and its
    password are GitHub Actions secrets and are never committed.
  - **Updates** are verified with Tauri's own updater key (minisign), independent of Apple.
  - **Later:** buy the Developer ID ($99/year) when downloads justify it. Moving to it changes the
    signature, so users grant Accessibility once more at that update.

### Windows
- **No permission is needed.**
- **Elevated apps:** Windows doesn't allow a normal app to send keys to one running as
  administrator (UIPI). The app detects this when the copy step times out and shows "Can't fix
  text in apps running as administrator".
- **Unsigned for now** (decided 2026-09-26). SmartScreen shows "Windows protected your PC" on
  first run. The user clicks **More info → Run anyway**, and the landing page shows this with
  screenshots. An unsigned file's reputation is tied to that exact file, so the warning comes back
  with every new version. Tauri's updater installs updates in the background without SmartScreen,
  so users mostly see it only on the first install. **Later:** Azure Trusted Signing (about
  $10 a month) when downloads justify it.

### Linux
- **X11:** works like Windows.
- **Wayland** (default on Ubuntu, Fedora): global hotkeys and synthetic keys are blocked for normal
  apps. v1 detects Wayland from `XDG_SESSION_TYPE` and shows a screen that explains it and links
  to the docs. Planned for v1.1:
  - A `layout-fixer --fix` CLI mode, bound to a shortcut in the desktop's own keyboard settings
  - `wl-clipboard` for the clipboard
  - The `RemoteDesktop` portal, or `ydotool` if installed, for ⌘C/⌘V

---

## 3. User interface

The same Apple HIG language as the extension (`docs/design-system.md`): system fonts, Apple blue,
grouped lists, and no AI-looking patterns. The desktop app uses the extension's tokens and icons.
Phase 1 moves `tokens.css`, `icons.tsx` and `ShortcutKeys.tsx` into `packages/ui`, so both apps
import the same files.

- **Tray / menu-bar menu:**
  - Fix Selection (shows the shortcut)
  - Pause / Resume
  - Settings…
  - Quit
- **Settings window** (one window, grouped list):
  - Shortcut: a recorder that rejects combinations the OS already reserves
  - Arabic layout: Automatic / PC / Mac
  - Launch at login
  - On-screen messages
  - Check for updates
  - Language: English / العربية, auto from the OS
  - Privacy note
- **Onboarding** (first launch): what it does, a try-it field with sample text, and on macOS the
  Accessibility step. It ends with the live shortcut.
- **HUD messages:** a small translucent pill near the bottom-center of the active screen, for about
  1.5 seconds. It never takes focus, so the user's app keeps its selection and cursor.
- **Strings:** English and Arabic (RTL), using the extension's `messages.json` format and a test
  that both locales have identical keys.

---

## 4. Settings, privacy, updates

- **Settings storage:** `tauri-plugin-store`, a JSON file in the OS app-data folder. Every value is
  validated on read with the same rules as the extension (`isLayoutId`, `parseLanguagePair`).
- **Privacy:**
  - Text never leaves the machine and nothing is logged.
  - Clipboard contents are held only in memory for the ~1 second a fix takes.
  - The **only network request** is the update check against GitHub Releases. It can be turned off
    in Settings, and PRIVACY.md gets a desktop section that says so.
- **Plugins:**
  - `global-shortcut`
  - `clipboard-manager`, extended in the Rust bridge for multi-format snapshots
  - `store`
  - `autostart`
  - `single-instance`
  - `updater`: signed update manifests from GitHub Releases

---

## 5. Repository and CI

```
apps/desktop/
├── src/            # React UI: tray menu actions, settings, onboarding, HUD, fix-flow.ts
├── src-tauri/      # Rust bridge, tauri.conf.json, capabilities/, icons
└── package.json    # @layout-fixer/desktop
packages/ui/        # tokens.css, icons, ShortcutKeys: shared with the extension
```

- **CI:**
  - Extension jobs run when `apps/extension/**`, `packages/**` or root configs change.
  - A desktop job runs `cargo fmt --check`, `clippy -D warnings`, `cargo test`, the TS tests and a
    `tauri build` on macOS, Windows and Ubuntu, when `apps/desktop/**` or `packages/**` change.
- **Release:**
  - `desktop-v*` tags run `tauri-apps/tauri-action`, which publishes:
    - a universal `.dmg` for macOS
    - NSIS `.exe` and `.msi` for Windows
    - `.AppImage` and `.deb` for Linux
    - the updater manifest
  - Extension tags (`v*.*.*`) are unaffected.

---

## 6. Testing

- **Unit (Vitest):** `fix-flow.ts` against a fake bridge:
  - selection found / nothing selected / timeout
  - nothing to fix
  - restore after paste, and the skip rule for formats that can't be restored
  - modifiers released first
  - settings validation
- **Rust:** unit tests for the clipboard snapshot/restore and the Wayland/X11 detection.
- **Manual checklist** (`docs/testing/desktop-checklist.md`), run on each OS before a release:
  - TextEdit/Notepad
  - Word
  - Slack
  - VS Code
  - Terminal/Windows Terminal
  - Chrome with and without the extension
  - an elevated app (Windows)
  - a password field
  - RTL/LTR mixed lines
  - undo
  - clipboard restored (text and image)
  - behaviour with a clipboard manager
- **Coverage:** 90/85 thresholds on the TS side, like the other workspaces.

---

## 7. Phases

| # | Phase | Result |
|---|---|---|
| 0 | Monorepo (#7) | ✅ done |
| 1 | Scaffold `apps/desktop` (Tauri 2 + React + Vite), extract `packages/ui`, tray menu, single instance, settings store, CI build matrix | Empty app builds on 3 OSes |
| 2 | Fix flow + Rust bridge + macOS Accessibility onboarding + HUD | **macOS MVP** to dogfood |
| 3 | Windows: SendInput, UIPI message, clipboard history exclusion | Windows beta |
| 4 | Linux X11 + Wayland explanation screen | Linux beta |
| 5 | Settings polish: shortcut recorder, autostart, Arabic UI, onboarding try-it field | Feature-complete v1 |
| 6 | Self-signed macOS signing, unsigned Windows build, updater, release workflow, PRIVACY.md, landing-page download section with "Open Anyway" / SmartScreen instructions | **v1.0 public** |

---

## Later

- **v1.1:**
  - "Fix the line before the cursor" when nothing is selected. Off by default: it selects with
    ⇧Home / ⌘⇧←, and mixed-language lines are converted as one.
  - Wayland support (§2).
- **v1.2:** more languages, in step with the extension's paused multi-language plan.
- **Considered and rejected:** a keyboard hook for "fix the last typed word". It would record all
  typing, needs Input Monitoring on macOS, is flagged by Windows antivirus, is impossible on
  Wayland, and cuts wrong-layout words at `;` `,` `[` `'` (Arabic letters on the English layout).

## Decisions log

1. ~~Apple Developer Program~~ — not for now; self-signed certificate + "Open Anyway" instructions (§2).
2. ~~Windows signing~~ — unsigned for now; "Run anyway" instructions (§2).
3. ~~Bundle identifier~~ — `io.github.bugsbountyhunter.layoutfixer` (decided 2026-09-26; tied to the GitHub account, can't clash). Fixed before the first public release, because macOS stores the Accessibility permission under it.
4. ~~Price~~ — free and open source under MIT, like the extension (decided 2026-09-26).
