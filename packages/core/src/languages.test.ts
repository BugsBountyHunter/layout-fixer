import { describe, expect, it } from 'vitest'
import { DEFAULT_LANGUAGE_PAIR, isLanguageCode, LANGUAGE_CODES, LANGUAGES, parseLanguagePair } from './languages'

describe('languages', () => {
  it('offers Arabic and English in v1', () => {
    expect(LANGUAGE_CODES).toEqual(['ar', 'en'])
    expect(LANGUAGES.ar).toMatchObject({ name: 'العربية', chip: 'ع' })
    expect(LANGUAGES.en).toMatchObject({ name: 'English', chip: 'EN' })
  })

  it('validates language codes from untrusted storage', () => {
    expect(isLanguageCode('ar')).toBe(true)
    expect(isLanguageCode('ru')).toBe(false)
    expect(isLanguageCode('toString')).toBe(false)
    expect(isLanguageCode(1)).toBe(false)
  })
})

describe('parseLanguagePair', () => {
  it('keeps a valid pair of two different languages, in order', () => {
    expect(parseLanguagePair(['en', 'ar'])).toEqual(['en', 'ar'])
    expect(parseLanguagePair(['ar', 'en'])).toEqual(['ar', 'en'])
  })

  it('falls back to the default for anything else', () => {
    expect(DEFAULT_LANGUAGE_PAIR).toEqual(['ar', 'en'])
    for (const raw of [undefined, 'ar', [], ['ar'], ['ar', 'ar'], ['ar', 'ru'], ['ar', 'en', 'fr'], [1, 2]]) {
      expect(parseLanguagePair(raw), JSON.stringify(raw)).toEqual(DEFAULT_LANGUAGE_PAIR)
    }
  })
})
