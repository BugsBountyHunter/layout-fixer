import { describe, expect, it } from 'vitest'
import { detectDesktopOs } from '@/lib/desktopOs'

const nav = (platform: string, userAgent = '', extra: object = {}) => ({ platform, userAgent, ...extra })

describe('detectDesktopOs', () => {
  it.each([
    [nav('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), 'mac'],
    [nav('Win32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'windows'],
    [nav('Linux x86_64', 'Mozilla/5.0 (X11; Linux x86_64)'), 'linux'],
    [nav('', '', { userAgentData: { platform: 'macOS', mobile: false } }), 'mac'],
    [nav('', '', { userAgentData: { platform: 'Windows', mobile: false } }), 'windows'],
  ])('%j → %s', (navigator, os) => {
    expect(detectDesktopOs(navigator)).toBe(os)
  })

  it.each([
    nav('Linux armv8l', 'Mozilla/5.0 (Linux; Android 15; Pixel 9)'),
    nav('iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X)'),
    nav('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', { maxTouchPoints: 5 }),
    nav('', '', { userAgentData: { platform: 'Android', mobile: true } }),
    nav('FreeBSD amd64', 'Mozilla/5.0 (FreeBSD)'),
  ])('returns null where the app doesn’t run (%j)', (navigator) => {
    expect(detectDesktopOs(navigator)).toBeNull()
  })
})
