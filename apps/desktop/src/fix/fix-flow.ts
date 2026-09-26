import { convert } from '@layout-fixer/core/converter'
import type { ArabicLayoutId } from '@layout-fixer/core/layouts'
import { errorCode, type FixBridge, type FixErrorCode } from './bridge'

export type FixOutcome =
  | { readonly kind: 'fixed' }
  | { readonly kind: 'nothing-selected' }
  | { readonly kind: 'nothing-to-fix' }
  | { readonly kind: 'error'; readonly code: FixErrorCode }

/** Copy the selection, convert it, paste it back. Never throws: failures become an outcome. */
export async function fixSelection(bridge: FixBridge, layout: ArabicLayoutId): Promise<FixOutcome> {
  try {
    const text = await bridge.captureSelection()
    if (text === null) return { kind: 'nothing-selected' }

    const fixed = convert(text, { layout })
    if (fixed === text) {
      await bridge.restoreClipboard()
      return { kind: 'nothing-to-fix' }
    }
    await bridge.pasteText(fixed)
    return { kind: 'fixed' }
  } catch (error) {
    const code = errorCode(error)
    if (code === 'system') console.error('[layout-fixer] Fix failed:', error)
    await bridge.restoreClipboard().catch(() => {})
    return { kind: 'error', code }
  }
}
