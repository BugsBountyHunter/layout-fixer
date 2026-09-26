import { describe, expect, it } from 'vitest'
import { type LayoutInfo, layoutHints, parseLayoutList } from './layoutHints'

const ABC: LayoutInfo = { id: 'com.apple.keylayout.ABC', language: 'en', arabicLayout: null }
const ARABIC_MAC: LayoutInfo = { id: 'com.apple.keylayout.Arabic', language: 'ar', arabicLayout: 'ar-mac' }
const ARABIC_PC: LayoutInfo = { id: 'com.apple.keylayout.ArabicPC', language: 'ar', arabicLayout: 'ar-pc' }
const ARABIC_OTHER: LayoutInfo = { id: '00010401', language: 'ar', arabicLayout: null }

describe('layoutHints', () => {
  it('has nothing to say when both languages have the chosen layouts', () => {
    expect(layoutHints([ABC, ARABIC_PC], 'ar-pc')).toEqual({ missing: [], suggestedArabicLayout: null })
  })

  it('names a language with no enabled layout', () => {
    expect(layoutHints([ABC], 'ar-pc').missing).toEqual(['ar'])
    expect(layoutHints([ARABIC_PC], 'ar-pc').missing).toEqual(['en'])
  })

  it('suggests the Arabic layout the computer actually has', () => {
    expect(layoutHints([ABC, ARABIC_MAC], 'ar-pc').suggestedArabicLayout).toBe('ar-mac')
    expect(layoutHints([ABC, ARABIC_PC], 'ar-mac').suggestedArabicLayout).toBe('ar-pc')
  })

  it('suggests nothing when the chosen layout is among several Arabic layouts', () => {
    expect(layoutHints([ARABIC_MAC, ABC, ARABIC_PC], 'ar-pc').suggestedArabicLayout).toBeNull()
  })

  it('suggests nothing for Arabic layouts it does not know', () => {
    expect(layoutHints([ABC, ARABIC_OTHER], 'ar-pc')).toEqual({ missing: [], suggestedArabicLayout: null })
  })

  it.each([
    ['unknown (unsupported system or a failed read)', null],
    ['an empty list', []],
  ])('stays quiet for %s', (_case, layouts) => {
    expect(layoutHints(layouts, 'ar-pc')).toEqual({ missing: [], suggestedArabicLayout: null })
  })
})

describe('parseLayoutList', () => {
  it('keeps valid entries', () => {
    expect(parseLayoutList([ABC, ARABIC_MAC])).toEqual([ABC, ARABIC_MAC])
  })

  it('drops malformed entries and normalizes unknown fields', () => {
    expect(
      parseLayoutList([
        null,
        'ABC',
        { id: 42 },
        { id: 'x', language: 7, arabicLayout: 'ar-klingon' },
        { id: 'y', language: 'ar', arabicLayout: 'ar-pc' },
      ]),
    ).toEqual([
      { id: 'x', language: null, arabicLayout: null },
      { id: 'y', language: 'ar', arabicLayout: 'ar-pc' },
    ])
  })

  it('treats anything but an array as unknown', () => {
    expect(parseLayoutList({ id: 'x' })).toBeNull()
  })
})
