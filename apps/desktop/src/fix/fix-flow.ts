import { convert, detectDirection } from '@layout-fixer/core/converter'
import type { ArabicLayoutId } from '@layout-fixer/core/layouts'
import { errorCode, type FixBridge, type FixErrorCode } from './bridge'

export type FixOutcome =
  | { readonly kind: 'fixed' }
  | { readonly kind: 'nothing-selected' }
  | { readonly kind: 'nothing-to-fix' }
  | { readonly kind: 'error'; readonly code: FixErrorCode }

export interface FixOptions {
  /** Switch the OS keyboard layout to the language the text was converted to. */
  readonly switchLayout: boolean
}

/**
 * Copy the selection, convert it, paste it back, then optionally switch the keyboard layout so the
 * next keystrokes come out right. Never throws: failures become an outcome.
 */
export async function fixSelection(
  bridge: FixBridge,
  layout: ArabicLayoutId,
  { switchLayout }: FixOptions = { switchLayout: false },
): Promise<FixOutcome> {
  try {
    const text = await bridge.captureSelection()
    if (text === null) return { kind: 'nothing-selected' }

    const direction = detectDirection(text)
    const fixed = convert(text, { direction, layout })
    if (fixed === text) {
      await bridge.restoreClipboard()
      return { kind: 'nothing-to-fix' }
    }
    await bridge.pasteText(fixed)
    if (switchLayout) await switchAfterFix(bridge, direction === 'en→ar' ? 'ar' : 'en', layout)
    return { kind: 'fixed' }
  } catch (error) {
    const code = errorCode(error)
    if (code === 'system') console.error('[layout-fixer] Fix failed:', error)
    await bridge.restoreClipboard().catch(() => {})
    return { kind: 'error', code }
  }
}

/** The text is already fixed, so a failed switch is only logged. */
async function switchAfterFix(bridge: FixBridge, language: 'ar' | 'en', layout: ArabicLayoutId): Promise<void> {
  try {
    await bridge.switchLayout(language, layout)
  } catch (error) {
    console.warn('[layout-fixer] Could not switch the keyboard layout:', error)
  }
}
