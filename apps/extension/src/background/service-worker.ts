import contentScript from '../content/content-script.entry?iife'
import selectionScript from '../content/selection-button.entry?iife'
import { sendLayoutSwitch } from '../platform/desktop-app'
import { loadSettings, saveSettings, watchSettings } from '../platform/settings'
import { registerBackground } from './handlers'
import { createSelectionScriptSync } from './selection-script'

const background = registerBackground(chrome, contentScript, {
  selectionSync: createSelectionScriptSync(chrome, selectionScript, loadSettings),
  saveSettings,
  watchSettings,
  // Read at call time: the function only appears once the optional permission is granted.
  switchLayout: (request) => sendLayoutSwitch(chrome.runtime, request),
})

if (import.meta.env.MODE === 'e2e') {
  // Lets Playwright trigger the same code path as the keyboard shortcut, which it can't press.
  Object.assign(globalThis, { __layoutFixer: background })
}
