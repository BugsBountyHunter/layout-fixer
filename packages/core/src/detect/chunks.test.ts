import { describe, expect, it } from 'vitest'
import { splitChunks } from './chunks'

describe('splitChunks', () => {
  it('keeps every character, whitespace included, in order', () => {
    const text = '  meeting\tat 5\nhgsghl ugd;l  '
    expect(
      splitChunks(text)
        .map((chunk) => chunk.text)
        .join(''),
    ).toBe(text)
  })

  it('finds the script of each word by its letters', () => {
    expect(splitChunks('hello اثممخ ugd;l 123 ;').map(({ text, script }) => [text, script])).toEqual([
      ['hello', 'Latn'],
      [' ', null],
      ['اثممخ', 'Arab'],
      [' ', null],
      ['ugd;l', 'Latn'],
      [' ', null],
      ['123', null],
      [' ', null],
      [';', null],
    ])
  })

  it.each(['https://example.com', 'www.example.com', 'me@example.com', 'v2', 'hgsghl2026'])(
    'protects %s from conversion',
    (word) => {
      expect(splitChunks(word)[0]?.protected).toBe(true)
    },
  )

  it('does not protect ordinary words', () => {
    expect(splitChunks('hgsghl, hello.')[0]?.protected).toBe(false)
  })

  it('returns nothing for empty text', () => {
    expect(splitChunks('')).toEqual([])
  })
})
