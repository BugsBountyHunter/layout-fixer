import type { Messages } from '../i18n'
import type { FixErrorCode } from './bridge'
import type { FixOutcome } from './fix-flow'

const ERROR_KEYS: Readonly<Record<FixErrorCode, keyof Messages>> = {
  'accessibility-denied': 'hudAccessibility',
  'secure-input': 'hudSecureInput',
  'elevated-app': 'hudElevated',
  wayland: 'hudWayland',
  unsupported: 'hudUnsupported',
  system: 'hudFailed',
}

/** What the on-screen message says. A successful fix speaks for itself. */
export function messageFor(outcome: FixOutcome, messages: Messages): string | null {
  switch (outcome.kind) {
    case 'fixed':
      return null
    case 'nothing-selected':
      return messages.hudNothingSelected
    case 'nothing-to-fix':
      return messages.hudNothingToFix
    case 'error':
      return messages[ERROR_KEYS[outcome.code]] as string
  }
}
