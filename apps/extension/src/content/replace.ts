import { type Direction, fix, mistypedTailStart } from '@layout-fixer/core/converter'
import type { ArabicLayoutId } from '@layout-fixer/core/layouts'
import { selectMistypedBeforeCaret } from './caret'
import { copyText } from './clipboard'
import { isTextField, type TextField } from './text-fields'

/** The language fixed text is in, which is what the keyboard should switch to. */
export type TargetLanguage = 'ar' | 'en'

export type FixResult =
  | { status: 'replaced'; language: TargetLanguage }
  | { status: 'copied'; text: string }
  | { status: 'shown'; text: string }
  | { status: 'empty' }

export interface FixOptions {
  readonly layout?: ArabicLayoutId
  /** Omit to detect from the text. */
  readonly direction?: Direction
}

interface Conversion {
  readonly layout: ArabicLayoutId
  readonly direction?: Direction
}

/** The fixed text and the language its fixed words are in, which is what the keyboard should switch to. */
function fixed(text: string, conversion: Conversion): { readonly text: string; readonly language: TargetLanguage } {
  const result = fix(text, conversion)
  return { text: result.text, language: result.direction === 'en→ar' ? 'ar' : 'en' }
}

/** The end of the word the caret is in, so a caret inside a word fixes all of it. */
function wordEnd(value: string, caret: number): number {
  if (caret === 0 || /\s/.test(value[caret - 1] ?? '')) return caret
  const rest = value.slice(caret).search(/\s/)
  return rest < 0 ? value.length : caret + rest
}

/** The selection; with none, the mistyped words before the caret, or the whole field when there are none. */
function fieldRange(field: TextField, conversion: Conversion): [number, number] {
  const start = field.selectionStart ?? 0
  const end = field.selectionEnd ?? 0
  if (start !== end) return [start, end]
  const until = wordEnd(field.value, end)
  const tail = mistypedTailStart(field.value.slice(0, until), conversion)
  return tail === null ? [0, field.value.length] : [tail, until]
}

async function deliverWithoutEditing(text: string): Promise<FixResult> {
  return (await copyText(text)) ? { status: 'copied', text } : { status: 'shown', text }
}

async function fixTextField(field: TextField, conversion: Conversion): Promise<FixResult> {
  const [from, to] = fieldRange(field, conversion)
  const original = field.value.slice(from, to)
  if (!original) return { status: 'empty' }
  const { text, language } = fixed(original, conversion)
  if (field.readOnly || field.disabled) return deliverWithoutEditing(text)

  field.setSelectionRange(from, to)
  // setRangeText bypasses the undo stack; insertText records undo and fires the input event itself.
  if (!document.execCommand('insertText', false, text)) {
    field.setRangeText(text, from, to)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  }
  field.setSelectionRange(from, from + text.length)
  return { status: 'replaced', language }
}

async function fixSelection(active: Element | null, conversion: Conversion): Promise<FixResult> {
  const selection = window.getSelection()
  if (selection?.isCollapsed && active instanceof HTMLElement && active.isContentEditable) {
    selectMistypedBeforeCaret(active, selection, conversion)
  }
  const selected = selection?.toString() ?? ''
  if (!selected) return { status: 'empty' }

  // execCommand is deprecated but remains the only way to edit rich editors
  // while preserving their undo stack and internal state.
  const { text, language } = fixed(selected, conversion)
  if (active instanceof HTMLElement && active.isContentEditable && document.execCommand('insertText', false, text)) {
    return { status: 'replaced', language }
  }
  return deliverWithoutEditing(text)
}

export function fixActiveElement({ layout = 'ar-pc', direction }: FixOptions = {}): Promise<FixResult> {
  const active = document.activeElement
  const conversion = { layout, direction }
  return isTextField(active) ? fixTextField(active, conversion) : fixSelection(active, conversion)
}
