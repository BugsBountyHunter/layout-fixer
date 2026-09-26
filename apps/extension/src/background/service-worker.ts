import contentScript from '../content/content-script.entry?iife'
import selectionScript from '../content/selection-button.entry?iife'
import { loadSettings, saveSettings, watchSettings } from '../platform/settings'
import { registerBackground } from './handlers'
import { createSelectionScriptSync } from './selection-script'

const background = registerBackground(chrome, contentScript, {
  selectionSync: createSelectionScriptSync(chrome, selectionScript, loadSettings),
  saveSettings,
  watchSettings,
})

if (import.meta.env.MODE === 'e2e') {
  // Lets Playwright trigger the same code path as the keyboard shortcut, which it can't press.
  Object.assign(globalThis, { __layoutFixer: background })
}
