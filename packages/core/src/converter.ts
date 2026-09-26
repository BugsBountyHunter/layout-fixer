import { type KeyboardLayout, type KeyCode, LAYOUTS, type LayoutId } from './layouts'
import { KEY_CODES } from './layouts/keys'
import { detectScript } from './scripts'

export type { Script } from './scripts'
export { detectScript } from './scripts'

export type Direction = 'en→ar' | 'ar→en'

export interface ConvertOptions {
  readonly direction?: Direction
  readonly layout?: LayoutId
}

interface Keystroke {
  readonly code: KeyCode
  readonly shift: boolean
}

interface CompiledPair {
  readonly map: ReadonlyMap<string, string>
  readonly maxLength: number
}

const ASCII = /^[\x20-\x7E]+$/
const compiledPairs = new Map<string, CompiledPair>()

/**
 * Which keystroke produced each character. Unshifted wins over shifted when a character appears
 * twice. ASCII typed on a non-Latin layout is skipped: it's almost always real punctuation.
 */
function keystrokesOf(layout: KeyboardLayout): ReadonlyMap<string, Keystroke> {
  const strokes = new Map<string, Keystroke>()
  const add = (char: string | null | undefined, stroke: Keystroke) => {
    if (!char || strokes.has(char) || (layout.script !== 'Latn' && ASCII.test(char))) return
    strokes.set(char, stroke)
  }
  for (const shift of [false, true]) {
    for (const code of KEY_CODES) add(layout.keys[code]?.[shift ? 1 : 0], { code, shift })
  }
  for (const [char, code] of Object.entries(layout.aliases ?? {})) add(char, { code, shift: false })
  return strokes
}

function compilePair(from: LayoutId, to: LayoutId): CompiledPair {
  const key = `${from}>${to}`
  const cached = compiledPairs.get(key)
  if (cached) return cached

  const target = LAYOUTS[to]
  const map = new Map<string, string>()
  for (const [char, { code, shift }] of keystrokesOf(LAYOUTS[from])) {
    const output = target.keys[code]?.[shift ? 1 : 0]
    if (output) map.set(char, output)
  }
  const compiled = { map, maxLength: Math.max(1, ...[...map.keys()].map((char) => Array.from(char).length)) }
  compiledPairs.set(key, compiled)
  return compiled
}

/** Retypes text as if the same physical keys had been pressed on another layout. Unmapped characters are kept. */
export function convertBetween(text: string, from: LayoutId, to: LayoutId): string {
  const { map, maxLength } = compilePair(from, to)
  const chars = Array.from(text) // code points, so emoji stay intact
  const out: string[] = []

  for (let i = 0; i < chars.length; ) {
    const match = findLongestMatch(chars, i, map, maxLength)
    out.push(match ? match.value : chars[i])
    i += match ? match.length : 1
  }
  return out.join('')
}

/** Tries longer sequences first so "لا" wins over "ل" + "ا". */
function findLongestMatch(
  chars: readonly string[],
  start: number,
  map: ReadonlyMap<string, string>,
  maxLength: number,
): { value: string; length: number } | undefined {
  for (let length = Math.min(maxLength, chars.length - start); length > 0; length--) {
    const value = map.get(chars.slice(start, start + length).join(''))
    if (value !== undefined) return { value, length }
  }
  return undefined
}

export function detectDirection(text: string): Direction {
  return detectScript(text) === 'Latn' ? 'en→ar' : 'ar→en'
}

/** English ⇄ Arabic convenience used by the current UI; superseded by user-selected languages in phase 1. */
export function convert(
  text: string,
  { direction = detectDirection(text), layout = 'ar-pc' }: ConvertOptions = {},
): string {
  return direction === 'en→ar' ? convertBetween(text, 'en-us', layout) : convertBetween(text, layout, 'en-us')
}
