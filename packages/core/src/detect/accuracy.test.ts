import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { convertBetween } from '../keystrokes'
import type { ArabicLayoutId } from '../layouts'
import { judgeWord } from './judge'

// Words the model never saw (see scripts/build-language-model.ts).
const heldOut = (language: 'en' | 'ar') =>
  readFileSync(new URL(`./fixtures/held-out-${language}.txt`, import.meta.url), 'utf8')
    .trim()
    .split('\n')

const rate = (words: readonly string[], test: (word: string) => boolean) => words.filter(test).length / words.length

describe.each(['ar-pc', 'ar-mac'] as const satisfies readonly ArabicLayoutId[])('accuracy on %s', (layout) => {
  const english = heldOut('en')
  const arabic = heldOut('ar')

  it('catches at least 95% of Arabic words typed on the English layout', () => {
    const typed = arabic.map((word) => convertBetween(word, layout, 'en-us'))
    expect(rate(typed, (word) => judgeWord(word, 'Latn', layout) === 'mistyped')).toBeGreaterThanOrEqual(0.95)
  })

  it('catches at least 95% of English words typed on the Arabic layout', () => {
    const typed = english.map((word) => convertBetween(word, 'en-us', layout))
    expect(rate(typed, (word) => judgeWord(word, 'Arab', layout) === 'mistyped')).toBeGreaterThanOrEqual(0.95)
  })

  it('flags at most 1% of real English words', () => {
    expect(rate(english, (word) => judgeWord(word, 'Latn', layout) === 'mistyped')).toBeLessThanOrEqual(0.01)
  })

  it('flags at most 1% of real Arabic words', () => {
    expect(rate(arabic, (word) => judgeWord(word, 'Arab', layout) === 'mistyped')).toBeLessThanOrEqual(0.01)
  })
})
