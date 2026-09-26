/** Same default as the extension and the Rust side. */
export const DEFAULT_SHORTCUT = 'Alt+Shift+F'

export type ShortcutProblem = 'needs-modifier' | 'reserved'

export type RecordResult =
  | { readonly kind: 'incomplete' }
  | { readonly kind: 'invalid'; readonly problem: ShortcutProblem }
  | { readonly kind: 'valid'; readonly accelerator: string }

interface KeyPress {
  readonly code: string
  readonly ctrlKey: boolean
  readonly altKey: boolean
  readonly shiftKey: boolean
  readonly metaKey: boolean
}

const MODIFIER_CODES = /^(Control|Alt|Shift|Meta|OS)(Left|Right)?$/

/** Shortcuts every app relies on, per platform; registering them globally would break copy/paste etc. */
const RESERVED: Readonly<Record<'mac' | 'other', readonly string[]>> = {
  mac: ['Cmd+Q', 'Cmd+W', 'Cmd+H', 'Cmd+M', 'Cmd+A', 'Cmd+C', 'Cmd+V', 'Cmd+X', 'Cmd+Z', 'Cmd+Shift+Z', 'Cmd+Space'],
  other: ['Ctrl+A', 'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+Y', 'Ctrl+Z', 'Alt+F4', 'Ctrl+Alt+Delete'],
}

/** Physical key → accelerator key, so the shortcut works whichever layout (Arabic too) is active. */
function keyName(code: string): string | null {
  const letter = /^Key([A-Z])$/.exec(code)
  if (letter) return letter[1] ?? null
  const digit = /^Digit([0-9])$/.exec(code)
  if (digit) return digit[1] ?? null
  return /^F([1-9]|1[0-9]|2[0-4])$/.test(code) ? code : null
}

export function recordShortcut(press: KeyPress, isMac: boolean): RecordResult {
  if (MODIFIER_CODES.test(press.code)) return { kind: 'incomplete' }
  const key = keyName(press.code)
  const modifiers = [
    press.metaKey && (isMac ? 'Cmd' : 'Super'),
    press.ctrlKey && 'Ctrl',
    press.altKey && 'Alt',
    press.shiftKey && 'Shift',
  ].filter((name): name is string => typeof name === 'string')

  const hasCommandModifier = press.ctrlKey || press.altKey || (isMac && press.metaKey)
  if (!key || !hasCommandModifier) return { kind: 'invalid', problem: 'needs-modifier' }

  const accelerator = [...modifiers, key].join('+')
  if (RESERVED[isMac ? 'mac' : 'other'].includes(accelerator)) return { kind: 'invalid', problem: 'reserved' }
  return { kind: 'valid', accelerator }
}

/** Stored values come from a user-editable file: accept only what the recorder can produce. */
export function isValidShortcut(value: unknown): value is string {
  return (
    typeof value === 'string' && /^((Cmd|Super|Ctrl|Alt|Shift)\+){1,4}([A-Z0-9]|F([1-9]|1[0-9]|2[0-4]))$/.test(value)
  )
}
