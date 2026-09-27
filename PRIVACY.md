# Layout Fixer — Privacy Policy

_Last updated: 27 September 2026_

Layout Fixer converts text typed with the wrong keyboard layout (Arabic ⇄ English). It comes as a browser
extension and as a desktop app for macOS, Windows and Linux; this policy covers both.

## What the extension accesses

- **The text you choose to fix.** Only when you press the keyboard shortcut, use the right-click
  menu, paste text into the popup, or — if you turned it on — use the selection button. The text
  is converted on your device and never leaves it.
- **Selected text, if you turn on the selection button.** This optional feature is off by default.
  When you turn it on, your browser asks you to allow access to websites so the button can appear
  next to text you select. The extension only looks at text you have selected, to show the button
  and its preview, and never sends it anywhere. Turning the feature off gives the access back.
- **Switching the keyboard layout, if you turn it on.** This optional feature is off by default and
  needs Layout Fixer for desktop. When you turn it on, your browser asks you to let the extension
  talk to the desktop app. After a fix, the extension sends the desktop app only the language to
  switch to (`ar` or `en`) and your Arabic layout setting — never the text. Both stay on your
  device. Turning the feature off gives the permission back.
- **Your settings.** Your languages, Arabic keyboard layout, and whether on-page messages, the
  selection button and keyboard layout switching are on.
  They are saved with your browser's extension storage and, if you use browser sync, synced by your
  browser between your own devices.

## What the extension does not do

- It does not collect, store, log, or transmit any text you type or fix.
- It does not use analytics, tracking, cookies, or advertising.
- It makes no network requests.
- It does not read page content in the background; without the optional selection button it runs
  only when you ask it to.
- It does not sell or share any data, because it has none.

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | Read and replace the selected text on the tab where you pressed the shortcut or used the menu. |
| `scripting` | Run the fixing code on that tab at that moment. |
| `contextMenus` | Add "Fix keyboard layout" to the right-click menu. |
| `storage` | Remember your settings. |
| Access to websites (optional) | Only if you turn on the selection button: show the button next to text you select. |
| `nativeMessaging` (optional) | Only if you turn on keyboard layout switching: ask Layout Fixer for desktop, on your device, to switch the keyboard layout. |

## The desktop app

- **The text you choose to fix.** Only when you press the shortcut or choose Fix Selection in the menu bar /
  tray. The app copies your selection, converts it on your device, pastes the result back and then restores
  your clipboard. The text is held in memory for about a second and is never stored, logged or sent.
- **Your clipboard.** Its contents are kept in memory during a fix so they can be put back afterwards. The
  temporary text is marked so clipboard managers and clipboard history (Win+V, cloud clipboard) skip it.
- **No keyboard monitoring.** The app registers one global shortcut with the system; it never records what you
  type.
- **Keyboard layout switching.** After a fix the app switches the system keyboard layout to the language of the
  fixed text (you can turn this off). It only chooses among layouts you already have, and reads that list to
  show hints in Settings. The browser extension can ask for the same switch: the app registers a small helper
  with your installed browsers so the extension can start it; the helper receives only a language code and
  your Arabic layout setting.
- **GNOME Shell extension (Linux, only if you install it).** GNOME lets apps switch the keyboard layout, and on
  Wayland fix the selected text, only through a GNOME Shell extension, so on GNOME Settings offers to install
  Layout Fixer's own small extension into your user's GNOME extensions folder. It lists your keyboard layouts
  and switches between them, and on Wayland it does for the app what X11 lets any app do: when you press the
  shortcut it presses Copy and Paste, hands the copied text to the app and puts your clipboard back, and it
  holds the shortcut. It never watches what you type, keeps nothing and makes no network requests. You can
  remove it in GNOME's Extensions app.
- **KDE Plasma on Wayland.** The app presses Copy and Paste through KWin, reads and restores the clipboard only
  while it fixes the text you selected, and registers its shortcut with KDE (it appears in System Settings →
  Shortcuts). KWin up to Plasma 6.7 allows that only for apps listed in a desktop file, so the app writes a hidden
  one for itself in your user's applications folder; it contains only the app's path.
- **Permissions.** macOS asks you to allow Layout Fixer under Accessibility, because the app presses ⌘C and ⌘V
  for you. Windows and Linux need no extra permission (on GNOME, see the Shell extension above).
- **Your settings** (language, shortcut, Arabic layout, messages, open at login) are saved in a file in your
  user's app-data folder and never leave your device.
- **Update checks — the only network requests.** When automatic updates are on (the default; you can turn them
  off in Settings), the app downloads a small file from GitHub
  (`github.com/BugsBountyHunter/layout-fixer/releases`) to see whether a newer version exists, and downloads
  the update from there when there is one. Every update is verified against the project's signing key before
  it installs. Like any website, GitHub sees your IP address for these requests; the app sends nothing else.

## Contact

Questions about this policy: open an issue at https://github.com/BugsBountyHunter/layout-fixer/issues.
The full source code is public at https://github.com/BugsBountyHunter/layout-fixer, so anyone can verify
these promises.
