import { type Direction, mistypedTailStart } from '@layout-fixer/core/converter'
import type { ArabicLayoutId } from '@layout-fixer/core/layouts'

export interface CaretOptions {
  readonly layout: ArabicLayoutId
  readonly direction?: Direction
}

const INLINE_DISPLAY = /^(inline|contents)/

/** The paragraph-like element around the caret, so words from the previous line don't run into this one. */
function blockOf(node: Node, host: HTMLElement): Element {
  for (let el = node instanceof Element ? node : node.parentElement; el && el !== host; el = el.parentElement) {
    if (!INLINE_DISPLAY.test(getComputedStyle(el).display)) return el
  }
  return host
}

/** The text of the caret's block up to the caret; <br> reads as a newline (Range.toString() drops it). */
export function textBeforeCaret(host: HTMLElement, caret: Range): string {
  const block = blockOf(caret.startContainer, host)
  const before = document.createRange()
  before.setStart(block, 0)
  before.setEnd(caret.startContainer, caret.startOffset)
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  const parts: string[] = []
  for (let node = walker.nextNode(); node && before.intersectsNode(node); node = walker.nextNode()) {
    if (node instanceof Text)
      parts.push(node === caret.startContainer ? node.data.slice(0, caret.startOffset) : node.data)
    else if (node instanceof HTMLBRElement) parts.push('\n')
  }
  return parts.join('')
}

const graphemeCount = (text: string): number =>
  Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)).length
const withoutSpace = (text: string): string => text.replace(/\s/g, '')

/** Moves a caret inside a word to the word's end, so the whole word is fixed. */
function moveToWordEnd(selection: Selection): void {
  const { focusNode, focusOffset } = selection
  if (!(focusNode instanceof Text) || focusOffset === 0 || /\s/.test(focusNode.data[focusOffset - 1] ?? '')) return
  const rest = focusNode.data.slice(focusOffset).search(/\s/)
  selection.collapse(focusNode, rest < 0 ? focusNode.length : focusOffset + rest)
}

/**
 * Selects the mistyped words that end at a collapsed caret in a rich editor, so they can be replaced like a
 * selection. Uses Selection.modify, which moves through the editor's own text the way arrow keys do. Returns false,
 * with the caret where it was, when there are none or the selection doesn't match the text that was read.
 */
export function selectMistypedBeforeCaret(host: HTMLElement, selection: Selection, options: CaretOptions): boolean {
  if (!selection.isCollapsed || selection.rangeCount !== 1 || typeof selection.modify !== 'function') return false
  const { focusNode, focusOffset } = selection
  const restore = () => {
    selection.collapse(focusNode, focusOffset)
    return false
  }
  moveToWordEnd(selection)
  const text = textBeforeCaret(host, selection.getRangeAt(0))
  const start = mistypedTailStart(text, options)
  if (start === null) return restore()

  const tail = text.slice(start)
  for (let i = graphemeCount(tail); i > 0; i--) selection.modify('extend', 'backward', 'character')
  return withoutSpace(selection.toString()) === withoutSpace(tail) || restore()
}
