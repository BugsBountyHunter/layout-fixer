import type { ArabicLayoutId } from '@layout-fixer/core/layouts'
import type { Messages } from '../i18n'
import type { FixBridge } from './bridge'
import { type FixOutcome, fixSelection } from './fix-flow'
import { messageFor } from './messages'

/** Read on every fix so changed settings apply immediately. */
export interface FixContext {
  readonly layout: ArabicLayoutId
  readonly messages: Messages
  readonly showMessages: boolean
}

export interface EngineDeps {
  readonly bridge: FixBridge
  readonly context: () => Promise<FixContext>
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
      const { layout, messages, showMessages } = await deps.context()
      const outcome = await fixSelection(deps.bridge, layout)
      const accessibilityDenied = outcome.kind === 'error' && outcome.code === 'accessibility-denied'
      const message = messageFor(outcome, messages)
      // Without the permission nothing works, so that message shows even when messages are off.
      if (message && (showMessages || accessibilityDenied)) deps.showMessage(message)
      if (accessibilityDenied) deps.onAccessibilityDenied()
      return outcome
    } finally {
      running = false
    }
  }
}
