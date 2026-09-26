import { describe, expect, it } from 'vitest'
import { isMacPlatform } from './os'

describe('isMacPlatform', () => {
  it('detects the macOS webview', () => {
    expect(isMacPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15')).toBe(true)
  })

  it.each([
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/140.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15',
  ])('is false for %s', (ua) => {
    expect(isMacPlatform(ua)).toBe(false)
  })
})
