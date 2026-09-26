import type { ArabicLayoutId } from '@layout-fixer/core/layouts'
import type { FixBridge } from './bridge'
import { type FixOutcome, fixSelection } from './fix-flow'
import { messageFor } from './messages'

export interface EngineDeps {
  readonly bridge: FixBridge
  /** Read on every fix so a changed setting applies immediately. */
  readonly resolveLayout: () => Promise<ArabicLayoutId>
  readonly showMessage: (message: string) => void
  readonly onAccessibilityDenied: () => void
}

/** Returns the hotkey handler. Presses during a running fix are ignored, not queued. */
export function createFixHandler(deps: EngineDeps): () => Promise<FixOutcome | null> {
  let running = false
  return async () => {
    if (running) return null
    running = true
    try {
      const outcome = await fixSelection(deps.bridge, await deps.resolveLayout())
      const message = messageFor(outcome)
      if (message) deps.showMessage(message)
      if (outcome.kind === 'error' && outcome.code === 'accessibility-denied') deps.onAccessibilityDenied()
      return outcome
    } finally {
      running = false
    }
  }
}
