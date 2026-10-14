import { describe, expect, it } from 'vitest'
import { splitChunks } from './chunks'
import { findMistyped, judgeWord } from './judge'

describe('judgeWord', () => {
  it.each(['hgsghl', 'ugd;l', 'lvpfh', 'ahvu', 'Hkh', 'lk;'])(
    '%s (Latin) is Arabic typed on the English layout',
    (word) => {
      expect(judgeWord(word, 'Latn', 'ar-pc')).toBe('mistyped')
    },
  )

  it.each(['meeting', 'hello,', "don't", 'of', 'I', 'tv', 'Wednesday'])('%s (Latin) is correct', (word) => {
    expect(judgeWord(word, 'Latn', 'ar-pc')).toBe('correct')
  })

  it.each(['اثممخ', 'صخقمي', 'ةثثفهىل'])('%s (Arabic) is English typed on the Arabic layout', (word) => {
    expect(judgeWord(word, 'Arab', 'ar-pc')).toBe('mistyped')
  })

  it.each(['السلام', 'عليكم،', 'على', 'في', 'والمدرسة'])('%s (Arabic) is correct', (word) => {
    expect(judgeWord(word, 'Arab', 'ar-pc')).toBe('correct')
  })

  it('reads words with the Mac Arabic layout', () => {
    expect(judgeWord('lnpfh', 'Latn', 'ar-mac')).toBe('mistyped')
    expect(judgeWord('ahnu', 'Latn', 'ar-mac')).toBe('mistyped')
  })

  it('calls a word correct when its converted reading has no letters', () => {
    expect(judgeWord('ك؟', 'Arab', 'ar-pc')).toBe('correct')
  })
})

describe('findMistyped', () => {
  const directions = (text: string, direction?: 'en→ar' | 'ar→en') =>
    findMistyped(splitChunks(text), { layout: 'ar-pc', direction })
      .map((value, i) => [splitChunks(text)[i]?.text, value])
      .filter(([text]) => text?.trim())

  it('marks only the mistyped words of a mixed sentence', () => {
    expect(directions('meeting at 5 hgsghl ugd;l')).toEqual([
      ['meeting', null],
      ['at', null],
      ['5', null],
      ['hgsghl', 'en→ar'],
      ['ugd;l', 'en→ar'],
    ])
  })

  it('fixes each word in its own direction', () => {
    expect(directions('اثممخ hgsghl')).toEqual([
      ['اثممخ', 'ar→en'],
      ['hgsghl', 'en→ar'],
    ])
  })

  it('lets an unsure word follow a mistyped neighbour', () => {
    expect(directions('hgsghl ugd;l lu hgkhs')).toEqual([
      ['hgsghl', 'en→ar'],
      ['ugd;l', 'en→ar'],
      ['lu', 'en→ar'],
      ['hgkhs', 'en→ar'],
    ])
  })

  it('only considers the source script of an explicit direction', () => {
    expect(directions('اثممخ hgsghl', 'en→ar')).toEqual([
      ['اثممخ', null],
      ['hgsghl', 'en→ar'],
    ])
  })

  it('never converts protected words', () => {
    expect(directions('hgsghl https://example.com')).toEqual([
      ['hgsghl', 'en→ar'],
      ['https://example.com', null],
    ])
  })

  it('finds nothing in correct text', () => {
    expect(directions('see you at the meeting').every(([, value]) => value === null)).toBe(true)
    expect(directions('السلام عليكم ورحمة الله').every(([, value]) => value === null)).toBe(true)
  })
})
