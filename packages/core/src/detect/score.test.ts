import { describe, expect, it } from 'vitest'
import { isCommonShortWord, wordScore } from './score'

describe('wordScore', () => {
  it('scores real English words above Arabic typed on the English layout', () => {
    expect(wordScore('hello', 'en')).toBeGreaterThan(wordScore('hgsghl', 'en'))
    expect(wordScore('meeting', 'en')).toBeGreaterThan(wordScore('ugd;l', 'en'))
  })

  it('scores real Arabic words above English typed on the Arabic layout', () => {
    expect(wordScore('السلام', 'ar')).toBeGreaterThan(wordScore('اثممخ', 'ar'))
    expect(wordScore('عليكم', 'ar')).toBeGreaterThan(wordScore('صخقمي', 'ar'))
  })

  it('treats letters outside the language as very unlikely', () => {
    expect(wordScore('héllo', 'en')).toBeLessThan(wordScore('hello', 'en'))
    expect(wordScore('سلامx', 'ar')).toBeLessThan(wordScore('سلام', 'ar'))
  })

  it('ignores case in English and harakat in Arabic', () => {
    expect(wordScore('Hello', 'en')).toBe(wordScore('hello', 'en'))
    expect(wordScore('مَرْحَبًا', 'ar')).toBe(wordScore('مرحبا', 'ar'))
  })
})

describe('isCommonShortWord', () => {
  it.each([
    ['of', 'en'],
    ['I', 'en'],
    ['tv', 'en'],
    ['على', 'ar'],
    ['في', 'ar'],
    ['مع', 'ar'],
  ] as const)('%s is a common %s word', (word, language) => {
    expect(isCommonShortWord(word, language)).toBe(true)
  })

  it.each([
    ['lu', 'en'],
    ['hello', 'en'],
    ['خب', 'ar'],
    ['السلام', 'ar'],
  ] as const)('%s is not a common short %s word', (word, language) => {
    expect(isCommonShortWord(word, language)).toBe(false)
  })
})
