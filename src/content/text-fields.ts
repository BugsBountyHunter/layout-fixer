export type TextField = HTMLInputElement | HTMLTextAreaElement

/** Input types that support the selection API (setRangeText throws on the others). */
const SELECTABLE_INPUT_TYPES = new Set(['text', 'search', 'url', 'tel'])

export function isTextField(el: Element | null): el is TextField {
  return el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && SELECTABLE_INPUT_TYPES.has(el.type))
}
