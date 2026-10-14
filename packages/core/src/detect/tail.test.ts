import { describe, expect, it } from 'vitest'
import { mistypedTailStart } from './tail'

const tail = (text: string) => {
  const start = mistypedTailStart(text, { layout: 'ar-pc' })
  return start === null ? null : text.slice(start)
}

describe('mistypedTailStart', () => {
  it('finds the mistyped words that end the text', () => {
    expect(tail('meeting at 5 hgsghl ugd;l')).toBe('hgsghl ugd;l')
    expect(tail('السلام عليكم اثممخ صخقمي')).toBe('اثممخ صخقمي')
  })

  it('includes trailing whitespace and punctuation', () => {
    expect(tail('ok hgsghl ugd;l ')).toBe('hgsghl ugd;l ')
    expect(tail('ok ;dt phg;?')).toBe(';dt phg;?')
  })

  it('stops at the first correct word', () => {
    expect(tail('hgsghl see you ugd;l')).toBe('ugd;l')
  })

  it('crosses letterless chunks only between mistyped words', () => {
    expect(tail('hgsghl - ugd;l')).toBe('hgsghl - ugd;l')
    expect(tail('ok - ugd;l')).toBe('ugd;l')
  })

  it('takes a whole text that is all mistyped', () => {
    expect(tail('hgsghl ugd;l')).toBe('hgsghl ugd;l')
  })

  it('returns null when the last word is correct or there is nothing', () => {
    expect(tail('hgsghl see you')).toBeNull()
    expect(tail('meeting at 5')).toBeNull()
    expect(tail('')).toBeNull()
    expect(tail('   ')).toBeNull()
  })

  it('reads the chosen layout', () => {
    expect(mistypedTailStart('meeting lnpfh', { layout: 'ar-mac' })).toBe(8)
  })
})
