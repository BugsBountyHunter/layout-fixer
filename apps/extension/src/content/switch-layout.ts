import type { ArabicLayoutId } from '@layout-fixer/core/layouts'
import type { Settings } from '../platform/settings'
import { SWITCH_LAYOUT_MESSAGE } from '../shared/constants'
import type { FixResult } from './replace'

/**
 * Page scripts can't reach the desktop app themselves, so they ask the background. Only after an
 * in-place fix: when the text was copied instead, the user isn't typing here.
 */
export function requestLayoutSwitch(result: FixResult, settings: Settings, layout: ArabicLayoutId): void {
  if (result.status !== 'replaced' || !settings.switchKeyboardLayout) return
  chrome.runtime
    .sendMessage({ type: SWITCH_LAYOUT_MESSAGE, language: result.language, layout })
    .catch((error: unknown) => console.warn('[layout-fixer] Could not ask for a keyboard layout switch:', error))
}
