import { isTextField } from '../text-fields'

export const MAX_SELECTION_LENGTH = 5000

export interface SelectionInfo {
  readonly text: string
  readonly editable: boolean
  /** Where the selection is drawn, used to place the button. */
  readonly rect: DOMRect | null
  /** Fallback placement: the focused field (inputs have no Range) or the element holding the selection. */
  readonly anchor: HTMLElement | null
}

function usable(text: string): boolean {
  return text.trim().length > 0 && text.length <= MAX_SELECTION_LENGTH
}

export function readSelection(): SelectionInfo | null {
  const active = document.activeElement
  if (active instanceof HTMLInputElement && active.type === 'password') return null

  if (isTextField(active)) {
    const text = active.value.slice(active.selectionStart ?? 0, active.selectionEnd ?? 0)
    if (!usable(text)) return null
    return { text, editable: !active.readOnly && !active.disabled, rect: null, anchor: active }
  }

  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null
  const text = selection.toString()
  if (!usable(text)) return null

  const rects = selection.getRangeAt(0).getClientRects()
  const focusNode = selection.focusNode
  return {
    text,
    editable: active instanceof HTMLElement && active.isContentEditable,
    rect: rects.length > 0 ? rects[rects.length - 1] : null,
    anchor: focusNode instanceof HTMLElement ? focusNode : (focusNode?.parentElement ?? null),
  }
}
