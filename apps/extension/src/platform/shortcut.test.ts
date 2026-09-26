import { describe, expect, it } from 'vitest'
import { formatShortcut, isMacPlatform, shortcutSettingsUrl } from './shortcut'

describe('formatShortcut', () => {
  it('uses macOS symbols for "+"-separated shortcuts (Firefox format)', () => {
    expect(formatShortcut('Alt+Shift+F', true)).toEqual(['⌥', '⇧', 'F'])
    expect(formatShortcut('Ctrl+Shift+F', true)).toEqual(['⌘', '⇧', 'F'])
    expect(formatShortcut('MacCtrl+F', true)).toEqual(['⌃', 'F'])
  })

  it('splits Chrome-on-macOS symbol strings into keys', () => {
    expect(formatShortcut('⇧⌥F', true)).toEqual(['⇧', '⌥', 'F'])
  })

  it('keeps key names on Windows, Linux and ChromeOS', () => {
    expect(formatShortcut('Alt+Shift+F', false)).toEqual(['Alt', 'Shift', 'F'])
    expect(formatShortcut('Ctrl+Shift+F', false)).toEqual(['Ctrl', 'Shift', 'F'])
  })

  it('returns no keys when the shortcut is unset', () => {
    expect(formatShortcut('', false)).toEqual([])
    expect(formatShortcut(undefined, true)).toEqual([])
  })
})

describe('isMacPlatform', () => {
  it('prefers User-Agent Client Hints when available', () => {
    expect(isMacPlatform({ userAgentData: { platform: 'macOS' }, platform: 'Win32' })).toBe(true)
    expect(isMacPlatform({ userAgentData: { platform: 'Windows' }, platform: 'MacIntel' })).toBe(false)
  })

  it('falls back to navigator.platform (Firefox, Safari)', () => {
    expect(isMacPlatform({ platform: 'MacIntel' })).toBe(true)
    expect(isMacPlatform({ platform: 'Linux x86_64' })).toBe(false)
    expect(isMacPlatform({ platform: 'Win32' })).toBe(false)
  })

  it('treats iPhone and iPad as Apple platforms', () => {
    expect(isMacPlatform({ platform: 'iPhone' })).toBe(true)
    expect(isMacPlatform({ platform: 'iPad' })).toBe(true)
  })
})

describe('shortcutSettingsUrl', () => {
  it.each([
    ['Mozilla/5.0 (Windows NT 10.0) Chrome/140.0 Safari/537.36 Edg/140.0', 'edge://extensions/shortcuts'],
    ['Mozilla/5.0 (Macintosh) Chrome/140.0 Safari/537.36 OPR/120.0', 'opera://extensions/shortcuts'],
    ['Mozilla/5.0 (X11; Linux x86_64) Chrome/140.0 Safari/537.36', 'chrome://extensions/shortcuts'],
    ['Mozilla/5.0 (X11; CrOS x86_64) Chrome/140.0 Safari/537.36', 'chrome://extensions/shortcuts'],
  ])('%s → %s', (userAgent, url) => {
    expect(shortcutSettingsUrl(userAgent)).toBe(url)
  })
})
