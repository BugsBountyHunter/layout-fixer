import { describe, expect, it } from 'vitest'
import { convert, convertBetween, detectDirection, detectScript } from './converter'

describe('convert — en→ar on the PC layout (default)', () => {
  it.each([
    ['hgsghl ugd;l', 'السلام عليكم'],
    ['ahvu', 'شارع'],
    ['lvpfh', 'مرحبا'],
    ['`', 'ذ'],
    ["'", 'ط'],
    [',', 'و'],
    ['.', 'ز'],
    ['/', 'ظ'],
    ['[]', 'جد'],
    ['zxc', 'ئءؤ'],
    ['nm', 'ىة'],
  ])('%s → %s', (input, expected) => {
    expect(convert(input, { direction: 'en→ar' })).toBe(expected)
  })

  it('maps the multi-character key b → لا', () => {
    expect(convert('b', { direction: 'en→ar' })).toBe('لا')
    expect(convert('bh', { direction: 'en→ar' })).toBe('لاا')
  })

  it('maps shifted keys (hamza forms, lam-alef variants, punctuation)', () => {
    expect(convert('H', { direction: 'en→ar' })).toBe('أ')
    expect(convert('Y', { direction: 'en→ar' })).toBe('إ')
    expect(convert('N', { direction: 'en→ar' })).toBe('آ')
    expect(convert('G', { direction: 'en→ar' })).toBe('لأ')
    expect(convert('T', { direction: 'en→ar' })).toBe('لإ')
    expect(convert('B', { direction: 'en→ar' })).toBe('لآ')
    expect(convert('?', { direction: 'en→ar' })).toBe('؟')
    expect(convert('K', { direction: 'en→ar' })).toBe('،')
    expect(convert('P', { direction: 'en→ar' })).toBe('؛')
  })

  it('maps shifted keys to harakat (diacritics)', () => {
    expect(convert('QWERASX~', { direction: 'en→ar' })).toBe('ًٌٍَُِّْ')
  })

  it('keeps digits, spaces, newlines and emoji unchanged', () => {
    expect(convert('hgsghl 123 😀\nugd;l', { direction: 'en→ar' })).toBe('السلام 123 😀\nعليكم')
  })
})

describe('convert — ar→en on the PC layout (default)', () => {
  it.each([
    ['اثممخ', 'hello'],
    ['صخقمي', 'world'],
    ['ذ', '`'],
    ['ك', ';'],
    ['ط', "'"],
    ['و', ','],
    ['ز', '.'],
    ['ظ', '/'],
  ])('%s → %s', (input, expected) => {
    expect(convert(input, { direction: 'ar→en' })).toBe(expected)
  })

  it('matches lam-alef ligature sequences before single characters', () => {
    expect(convert('لا', { direction: 'ar→en' })).toBe('b')
    expect(convert('لأ', { direction: 'ar→en' })).toBe('G')
    expect(convert('لإ', { direction: 'ar→en' })).toBe('T')
    expect(convert('لآ', { direction: 'ar→en' })).toBe('B')
    expect(convert('ل', { direction: 'ar→en' })).toBe('g')
  })

  it('reads ل + ا as the lam-alef key "b" (known ambiguity: "gh" produces the same characters)', () => {
    // Both keystrokes insert U+0644 U+0627, so they can't be told apart. "b" is the more common intent.
    expect(convert('ىهلاف', { direction: 'ar→en' })).toBe('nibt')
  })

  it('converts Arabic-Indic digits to Western digits', () => {
    expect(convert('٠١٢٣٤٥٦٧٨٩', { direction: 'ar→en' })).toBe('0123456789')
  })

  it('keeps ASCII punctuation that the user really typed', () => {
    expect(convert('اثممخ! [x] <y>', { direction: 'ar→en' })).toBe('hello! [x] <y>')
  })

  it('keeps unmapped characters (Persian letters, emoji)', () => {
    expect(convert('اثممخ پ 🎉', { direction: 'ar→en' })).toBe('hello پ 🎉')
  })
})

describe('convert — round trip', () => {
  it.each(['hello world', 'the quick brown fox', 'type;script', 'a,b.c/d'])(
    'ar→en(en→ar(%s)) returns the original',
    (text) => {
      expect(convert(convert(text, { direction: 'en→ar' }), { direction: 'ar→en' })).toBe(text)
    },
  )

  it.each(['السلام عليكم', 'مرحبا بالعالم', 'لا إله'])('en→ar(ar→en(%s)) returns the original', (text) => {
    expect(convert(convert(text, { direction: 'ar→en' }), { direction: 'en→ar' })).toBe(text)
  })
})

describe('convert — auto direction', () => {
  it('detects the direction when none is given', () => {
    expect(convert('hgsghl ugd;l')).toBe('السلام عليكم')
    expect(convert('اثممخ')).toBe('hello')
  })

  it('returns an empty string for empty input', () => {
    expect(convert('')).toBe('')
  })

  it('does not mutate its input', () => {
    const input = 'hgsghl'
    convert(input)
    expect(input).toBe('hgsghl')
  })
})

describe('detectDirection', () => {
  it('returns en→ar when Latin letters are the majority', () => {
    expect(detectDirection('hgsghl ugd;l')).toBe('en→ar')
  })

  it('returns ar→en when Arabic letters are the majority', () => {
    expect(detectDirection('اثممخ صخقمي')).toBe('ar→en')
  })

  it('uses the majority for mixed text', () => {
    expect(detectDirection('hgsghl عل')).toBe('en→ar')
    expect(detectDirection('اثممخ صخقمي ok')).toBe('ar→en')
  })

  it('defaults to en→ar when there are no letters', () => {
    expect(detectDirection('')).toBe('en→ar')
    expect(detectDirection('123 !?')).toBe('en→ar')
  })
})

describe('convert — macOS "Arabic" layout', () => {
  const mac = { layout: 'ar-mac' } as const

  it.each([
    ['hgsghl ugd;l', 'السلام عليكم'],
    ['lnpfh', 'مرحبا'],
    ['ahnu', 'شارع'],
    ['c', 'ذ'],
    [']', 'ة'],
    [',', '،'],
    ["'", '؛'],
    ['b', 'ز'],
    ['m', 'و'],
    ['x', 'ط'],
    ['z', 'ظ'],
  ])('en→ar: %s → %s', (input, expected) => {
    expect(convert(input, { ...mac, direction: 'en→ar' })).toBe(expected)
  })

  it('maps shifted hamza forms', () => {
    expect(convert('BHNCMV', { ...mac, direction: 'en→ar' })).toBe('أآإئؤء')
  })

  it.each([
    ['اثممخ', 'hello'],
    ['لا', 'gh'],
    ['ة', ']'],
    ['ذ', 'c'],
    ['،', ','],
  ])('ar→en: %s → %s', (input, expected) => {
    expect(convert(input, { ...mac, direction: 'ar→en' })).toBe(expected)
  })

  it('has no lam-alef key, so "gh" words round-trip (unlike the PC layout)', () => {
    const typed = convert('night light', { ...mac, direction: 'en→ar' })
    expect(convert(typed, { ...mac, direction: 'ar→en' })).toBe('night light')
  })

  it('keeps digits unchanged even though the layout types Arabic-Indic digits', () => {
    expect(convert('hgsghl 2026', { ...mac, direction: 'en→ar' })).toBe('السلام 2026')
    expect(convert('٢٠٢٦', { ...mac, direction: 'ar→en' })).toBe('2026')
  })
})

describe('convert — layouts differ', () => {
  it('gives different results for the same keys on PC and Mac', () => {
    expect(convert('lvpfh', { layout: 'ar-pc', direction: 'en→ar' })).toBe('مرحبا')
    expect(convert('lvpfh', { layout: 'ar-mac', direction: 'en→ar' })).toBe('مدحبا')
  })
})

describe('convertBetween — any layout to any layout', () => {
  it('converts from US QWERTY to an Arabic layout and back', () => {
    expect(convertBetween('hgsghl', 'en-us', 'ar-pc')).toBe('السلام')
    expect(convertBetween('السلام', 'ar-pc', 'en-us')).toBe('hgsbl')
  })

  it('converts directly between two non-Latin layouts by physical key', () => {
    expect(convertBetween('مرحبا', 'ar-pc', 'ar-mac')).toBe('مدحبا')
    expect(convertBetween('مدحبا', 'ar-mac', 'ar-pc')).toBe('مرحبا')
  })

  it('is the identity for the same layout', () => {
    expect(convertBetween('hello, world!', 'en-us', 'en-us')).toBe('hello, world!')
  })

  it('keeps characters the source layout cannot type', () => {
    expect(convertBetween('hgsghl 😀 ok', 'ar-pc', 'en-us')).toBe('hgsghl 😀 ok')
  })

  it.each(['ar-pc', 'ar-mac'] as const)('round-trips every letter key through %s', (layout) => {
    const letters = 'qwertyuiopasdfhgjklzxcvnm' // avoids "gh", which reads back as the PC lam-alef key
    const typed = convertBetween(letters, 'en-us', layout)
    expect(convertBetween(typed, layout, 'en-us')).toBe(letters)
  })
})

describe('detectScript', () => {
  it.each([
    ['hello', 'Latn'],
    ['السلام', 'Arab'],
    ['привет', 'Cyrl'],
    ['hgsghl عل', 'Latn'],
    ['привет ok', 'Cyrl'],
    ['', 'Latn'],
    ['123 !?', 'Latn'],
  ] as const)('%s → %s', (text, script) => {
    expect(detectScript(text)).toBe(script)
  })
})
