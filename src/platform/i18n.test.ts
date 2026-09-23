import { afterEach, describe, expect, it, vi } from 'vitest'
import { t, uiDirection } from './i18n'

function stubMessages(messages: Record<string, string>): void {
  vi.stubGlobal('chrome', { i18n: { getMessage: (key: string) => messages[key] ?? '' } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('i18n', () => {
  it('returns the translated message', () => {
    stubMessages({ copy: 'نسخ' })
    expect(t('copy')).toBe('نسخ')
  })

  it('passes substitutions to the browser', () => {
    const getMessage = vi.fn(() => 'Version 1.0.0')
    vi.stubGlobal('chrome', { i18n: { getMessage } })
    expect(t('version', ['1.0.0'])).toBe('Version 1.0.0')
    expect(getMessage).toHaveBeenCalledWith('version', ['1.0.0'])
  })

  it('falls back to the key outside the extension runtime', () => {
    expect(t('copy')).toBe('copy')
  })

  it('uses right-to-left when the active locale declares it', () => {
    stubMessages({ textDirection: 'rtl' })
    expect(uiDirection()).toBe('rtl')
  })

  it('uses left-to-right for LTR locales and when no locale is loaded', () => {
    stubMessages({ textDirection: 'ltr' })
    expect(uiDirection()).toBe('ltr')
    vi.unstubAllGlobals()
    expect(uiDirection()).toBe('ltr')
  })
})
