import { splitChunks } from './detect/chunks'
import { findMistyped } from './detect/judge'
import { convertBetween } from './keystrokes'
import type { ArabicLayoutId } from './layouts'
import { detectScript } from './scripts'

export { mistypedTailStart } from './detect/tail'
export { convertBetween } from './keystrokes'
export type { Script } from './scripts'
export { detectScript } from './scripts'

export type Direction = 'en→ar' | 'ar→en'

export interface ConvertOptions {
  /** Omit to detect it per word. */
  readonly direction?: Direction
  readonly layout?: ArabicLayoutId
}

export interface Fix {
  readonly text: string
  /** The direction most of the converted letters went, which is the language the text now ends in. */
  readonly direction: Direction
}

export function detectDirection(text: string): Direction {
  return detectScript(text) === 'Latn' ? 'en→ar' : 'ar→en'
}

function convertAll(text: string, direction: Direction | null, layout: ArabicLayoutId): string {
  if (!direction) return text
  return direction === 'en→ar' ? convertBetween(text, 'en-us', layout) : convertBetween(text, layout, 'en-us')
}

const letterCount = (text: string): number => text.match(/\p{L}/gu)?.length ?? 0

/**
 * Retypes the words that were typed on the wrong layout and keeps the rest. When no word looks mistyped, the whole
 * text is converted, because the user asked for a fix.
 */
export function fix(text: string, { direction, layout = 'ar-pc' }: ConvertOptions = {}): Fix {
  const chunks = splitChunks(text)
  const mistyped = findMistyped(chunks, { layout, direction })
  if (!mistyped.some(Boolean)) {
    const fallback = direction ?? detectDirection(text)
    return { text: convertAll(text, fallback, layout), direction: fallback }
  }
  const lettersTo = (to: Direction) =>
    chunks.reduce((sum, chunk, i) => sum + (mistyped[i] === to ? letterCount(chunk.text) : 0), 0)
  return {
    text: chunks.map((chunk, i) => convertAll(chunk.text, mistyped[i] ?? null, layout)).join(''),
    direction: lettersTo('ar→en') > lettersTo('en→ar') ? 'ar→en' : 'en→ar',
  }
}

/** English ⇄ Arabic conversion used by every app; see fix(). */
export function convert(text: string, options: ConvertOptions = {}): string {
  return fix(text, options).text
}
