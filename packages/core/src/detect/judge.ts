import type { Direction } from '../converter'
import { convertBetween } from '../keystrokes'
import type { ArabicLayoutId } from '../layouts'
import type { Script } from '../scripts'
import type { Chunk } from './chunks'
import { isCommonShortWord, type ModelLanguage, wordScore } from './score'

export type Verdict = 'correct' | 'mistyped' | 'unsure'

/**
 * How much more word-like, per letter transition, one reading must be than the other to decide. Tuned on held-out words:
 * Arabic retyped in Latin letters looks more like English than English retyped in Arabic looks like Arabic.
 */
const MARGIN: Readonly<Record<'Latn' | 'Arab', number>> = { Latn: 0.3, Arab: 0.5 }
/**
 * Punctuation that can surround a word in each language. Arabic letters are all letters, but on the English side
 * [ ] ` are Arabic letters (ج د ذ on the PC layout), so only marks that really end or open an English word count.
 */
const EDGES: Readonly<Record<ModelLanguage, RegExp>> = {
  en: /^["(]+|[.,!?;:'")]+$/g,
  ar: /^[^\p{L}]+|[^\p{L}]+$/gu,
}

interface Reading {
  readonly word: string
  readonly language: ModelLanguage
}

/** Edge punctuation is judged per reading: a trailing ";" is punctuation in English but the letter ك in Arabic. */
function reading(text: string, language: ModelLanguage): Reading {
  return { word: text.replace(EDGES[language], ''), language }
}

function readings(text: string, script: Script, layout: ArabicLayoutId): readonly [Reading, Reading] {
  return script === 'Latn'
    ? [reading(text, 'en'), reading(convertBetween(text, 'en-us', layout), 'ar')]
    : [reading(text, 'ar'), reading(convertBetween(text, layout, 'en-us'), 'en')]
}

/** Whether a word was typed on the wrong layout; Latin words are checked against Arabic and the other way round. */
export function judgeWord(text: string, script: Script, layout: ArabicLayoutId): Verdict {
  if (script !== 'Latn' && script !== 'Arab') return 'correct'
  const [asTyped, converted] = readings(text, script, layout)
  if (!converted.word) return 'correct'
  if (!asTyped.word) return 'mistyped'

  const typedKnown = isCommonShortWord(asTyped.word, asTyped.language)
  const convertedKnown = isCommonShortWord(converted.word, converted.language)
  if (typedKnown !== convertedKnown) return typedKnown ? 'correct' : 'mistyped'
  if (typedKnown) return 'unsure'

  const difference = wordScore(converted.word, converted.language) - wordScore(asTyped.word, asTyped.language)
  if (difference > MARGIN[script]) return 'mistyped'
  return difference < -MARGIN[script] ? 'correct' : 'unsure'
}

export interface FindOptions {
  readonly layout: ArabicLayoutId
  /** Only words in this direction's source script are considered. */
  readonly direction?: Direction
}

const DIRECTION: Readonly<Partial<Record<Script, Direction>>> = { Latn: 'en→ar', Arab: 'ar→en' }

function candidateDirection(chunk: Chunk, direction: Direction | undefined): Direction | null {
  if (chunk.protected || !chunk.script) return null
  const own = DIRECTION[chunk.script] ?? null
  return direction === undefined || direction === own ? own : null
}

/** The direction to retype each chunk in, or null to keep it. */
export function findMistyped(
  chunks: readonly Chunk[],
  { layout, direction }: FindOptions,
): readonly (Direction | null)[] {
  const verdicts = chunks.map((chunk) =>
    candidateDirection(chunk, direction) && chunk.script ? judgeWord(chunk.text, chunk.script, layout) : null,
  )
  return chunks.map((chunk, i) => {
    const own = candidateDirection(chunk, direction)
    const verdict = verdicts[i]
    if (!own || !verdict || verdict === 'correct') return null
    if (verdict === 'mistyped') return own
    return followsMistakes(chunks, verdicts, i) ? own : null
  })
}

/** An unsure word is mistyped when the nearest decided word of the same script on either side is. */
function followsMistakes(chunks: readonly Chunk[], verdicts: readonly (Verdict | null)[], at: number): boolean {
  const script = chunks[at]?.script
  const nearest = (step: 1 | -1): Verdict | undefined => {
    for (let i = at + step; i >= 0 && i < chunks.length; i += step) {
      const verdict = verdicts[i]
      if (chunks[i]?.script === script && verdict && verdict !== 'unsure') return verdict
    }
    return undefined
  }
  return nearest(-1) === 'mistyped' || nearest(1) === 'mistyped'
}
