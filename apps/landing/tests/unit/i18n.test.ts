import { describe, expect, it } from 'vitest'
import { direction, getDictionary, LOCALES, localePath, otherLocale, pageMetadata } from '@/lib/i18n'

/** Reduces a dictionary to its structure: keys, nesting and array lengths — not the text. */
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shape(child)]))
  }
  return typeof value
}

function leaves(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (value && typeof value === 'object') return Object.values(value).flatMap(leaves)
  return []
}

describe('dictionaries', () => {
  it('have the same structure in every locale', () => {
    expect(shape(getDictionary('ar'))).toEqual(shape(getDictionary('en')))
  })

  it.each(LOCALES)('%s has no empty strings', (locale) => {
    for (const text of leaves(getDictionary(locale))) expect(text.trim()).not.toBe('')
  })

  it('Arabic copy is actually Arabic', () => {
    expect(getDictionary('ar').hero.title).toMatch(/[؀-ۿ]/)
  })
})

describe('locale helpers', () => {
  it('puts English at the root and Arabic under /ar/', () => {
    expect(localePath('en')).toBe('/')
    expect(localePath('ar')).toBe('/ar/')
  })

  it('switches to the other locale', () => {
    expect(otherLocale('en')).toBe('ar')
    expect(otherLocale('ar')).toBe('en')
  })

  it('uses RTL for Arabic only', () => {
    expect(direction('ar')).toBe('rtl')
    expect(direction('en')).toBe('ltr')
  })
})

describe('pageMetadata', () => {
  it('points canonical and Open Graph at the page itself', () => {
    const metadata = pageMetadata('ar')
    expect(metadata.alternates?.canonical).toBe('/ar/')
    expect(metadata.openGraph?.url).toBe('/ar/')
    expect(JSON.stringify(metadata.openGraph?.images)).toContain('/og-ar.png')
    expect(metadata.openGraph?.images).toEqual([{ url: '/og-ar.png', width: 1200, height: 630 }])
  })

  it('lists both languages and an x-default', () => {
    expect(pageMetadata('en').alternates?.languages).toEqual({ en: '/', ar: '/ar/', 'x-default': '/' })
  })

  it('uses the localized title', () => {
    expect(pageMetadata('ar').title).toBe(getDictionary('ar').meta.title)
  })
})
