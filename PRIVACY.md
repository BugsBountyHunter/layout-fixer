# Layout Fixer — Privacy Policy

_Last updated: 23 September 2026_

Layout Fixer converts text typed with the wrong keyboard layout (Arabic ⇄ English).

## What the extension accesses

- **The text you choose to fix.** Only when you press the keyboard shortcut, use the right-click
  menu, paste text into the popup, or — if you turned it on — use the selection button. The text
  is converted on your device and never leaves it.
- **Selected text, if you turn on the selection button.** This optional feature is off by default.
  When you turn it on, your browser asks you to allow access to websites so the button can appear
  next to text you select. The extension only looks at text you have selected, to show the button
  and its preview, and never sends it anywhere. Turning the feature off gives the access back.
- **Your settings.** Your languages, Arabic keyboard layout, and whether on-page messages and the
  selection button are on.
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

## Contact

Questions about this policy: open an issue at https://github.com/BugsBountyHunter/layout-fixer/issues.
The full source code is public at https://github.com/BugsBountyHunter/layout-fixer, so anyone can verify
these promises.
