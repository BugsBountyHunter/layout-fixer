import type { FixOutcome } from './fix-flow'

// English only until phase 5 moves the desktop app onto the extension's en/ar message files.
const ERROR_MESSAGES = Object.freeze({
  'accessibility-denied': 'Allow Layout Fixer in Accessibility settings',
  'secure-input': 'Can’t fix text in password fields',
  unsupported: 'Fixing text isn’t available on this system yet',
  system: 'Couldn’t fix the text',
})

/** What the on-screen message says. A successful fix speaks for itself. */
export function messageFor(outcome: FixOutcome): string | null {
  switch (outcome.kind) {
    case 'fixed':
      return null
    case 'nothing-selected':
      return 'Select the text first'
    case 'nothing-to-fix':
      return 'Nothing to fix'
    case 'error':
      return ERROR_MESSAGES[outcome.code]
  }
}
