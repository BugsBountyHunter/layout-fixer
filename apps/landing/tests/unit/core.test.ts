import { convert } from '@layout-fixer/core/converter'
import { defaultLayout } from '@layout-fixer/core/layouts'
import { describe, expect, it } from 'vitest'
import { isMacPlatform } from '@/lib/platform'

describe('shared converter and platform check', () => {
  it('converts both directions on the PC Arabic layout', () => {
    expect(convert('hgsghl ugd;l')).toBe('السلام عليكم')
    expect(convert('اثممخ')).toBe('hello')
  })

  it('converts with the macOS Arabic layout', () => {
    expect(convert('hgp,hv', { layout: 'ar-mac' })).toBe('الح،اد')
  })

  it('picks the Arabic layout per platform like the extension', () => {
    expect(defaultLayout(true)).toBe('ar-mac')
    expect(defaultLayout(false)).toBe('ar-pc')
  })

  it('detects Apple platforms', () => {
    expect(isMacPlatform({ platform: 'MacIntel' })).toBe(true)
    expect(isMacPlatform({ platform: 'Win32' })).toBe(false)
  })
})
