import { convert, type Direction } from '@layout-fixer/core/converter'
import type { LayoutId } from '@layout-fixer/core/layouts'
import { copyText } from './clipboard'
import { isTextField, type TextField } from './text-fields'

export type FixResult =
  | { status: 'replaced' }
  | { status: 'copied'; text: string }
  | { status: 'shown'; text: string }
  | { status: 'empty' }

export interface FixOptions {
  readonly layout?: LayoutId
  /** Omit to detect from the text. */
  readonly direction?: Direction
}

interface Conversion {
  readonly layout: LayoutId
  readonly direction?: Direction
}

function fieldRange(field: TextField): [number, number] {
  const start = field.selectionStart ?? 0
  const end = field.selectionEnd ?? 0
  return start === end ? [0, field.value.length] : [start, end]
}

async function deliverWithoutEditing(text: string, conversion: Conversion): Promise<FixResult> {
  const fixed = convert(text, conversion)
  return (await copyText(fixed)) ? { status: 'copied', text: fixed } : { status: 'shown', text: fixed }
}

async function fixTextField(field: TextField, conversion: Conversion): Promise<FixResult> {
  const [from, to] = fieldRange(field)
  const original = field.value.slice(from, to)
  if (!original) return { status: 'empty' }
  if (field.readOnly || field.disabled) return deliverWithoutEditing(original, conversion)

  const fixed = convert(original, conversion)
  field.setSelectionRange(from, to)
  // setRangeText bypasses the undo stack; insertText records undo and fires the input event itself.
  if (!document.execCommand('insertText', false, fixed)) {
    field.setRangeText(fixed, from, to)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  }
  field.setSelectionRange(from, from + fixed.length)
  return { status: 'replaced' }
}

async function fixSelection(active: Element | null, conversion: Conversion): Promise<FixResult> {
  const selected = window.getSelection()?.toString() ?? ''
  if (!selected) return { status: 'empty' }

  // execCommand is deprecated but remains the only way to edit rich editors
  // while preserving their undo stack and internal state.
  if (
    active instanceof HTMLElement &&
    active.isContentEditable &&
    document.execCommand('insertText', false, convert(selected, conversion))
  ) {
    return { status: 'replaced' }
  }
  return deliverWithoutEditing(selected, conversion)
}

export function fixActiveElement({ layout = 'ar-pc', direction }: FixOptions = {}): Promise<FixResult> {
  const active = document.activeElement
  const conversion = { layout, direction }
  return isTextField(active) ? fixTextField(active, conversion) : fixSelection(active, conversion)
}
