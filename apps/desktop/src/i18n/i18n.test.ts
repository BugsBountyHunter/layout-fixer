import { describe, expect, it } from 'vitest'
import { AR } from './ar'
import { EN } from './en'
import { directionOf, messagesFor, resolveLanguage } from './index'

describe('messages', () => {
  it('has the same keys in every language', () => {
    expect(Object.keys(AR).sort()).toEqual(Object.keys(EN).sort())
  })

  it('translates every string (only product and layout names may match)', () => {
    const allowedSame = new Set(['layoutPc', 'layoutMac', 'welcomeSample'])
    const untranslated = Object.keys(EN).filter(
      (key) => !allowedSame.has(key) && EN[key as keyof typeof EN] === AR[key as keyof typeof AR],
    )
    expect(untranslated).toEqual([])
  })

  it.each([
    ['en', EN],
    ['ar', AR],
  ])('includes the value in every message that takes one (%s)', (_language, messages) => {
    const functions = Object.values(messages).filter((value) => typeof value === 'function')
    for (const message of functions) {
      expect((message as (...values: string[]) => string)('VALUE-1', 'VALUE-2')).toContain('VALUE-1')
    }
  })

  it('fills in placeholders in both languages', () => {
    expect(messagesFor('en').layoutExample('lvpfh', 'مرحبا')).toBe('Typing lvpfh gives مرحبا')
    expect(messagesFor('ar').layoutExample('lvpfh', 'مرحبا')).toBe('كتابة lvpfh تعطي مرحبا')
    expect(messagesFor('ar').layoutAutoHint('Mac')).toContain('Mac')
  })
})

describe('resolveLanguage', () => {
  it('follows the first Arabic or English system language', () => {
    expect(resolveLanguage('auto', ['ar-SA', 'en-US'])).toBe('ar')
    expect(resolveLanguage('auto', ['fr-FR', 'en-GB', 'ar'])).toBe('en')
    expect(resolveLanguage('auto', ['de-DE'])).toBe('en')
    expect(resolveLanguage('auto', [])).toBe('en')
  })

  it('respects an explicit choice', () => {
    expect(resolveLanguage('ar', ['en-US'])).toBe('ar')
    expect(resolveLanguage('en', ['ar-EG'])).toBe('en')
  })

  it('sets the text direction', () => {
    expect(directionOf('ar')).toBe('rtl')
    expect(directionOf('en')).toBe('ltr')
  })
})
