import { describe, expect, it } from 'vitest'
import { blocksFixing } from './session'

describe('blocksFixing', () => {
  it('is false outside Wayland', () => {
    expect(blocksFixing({ wayland: false, fixesOnWayland: false })).toBe(false)
  })

  it('is false on a Wayland desktop the shortcut works on (KDE Plasma)', () => {
    expect(blocksFixing({ wayland: true, fixesOnWayland: true })).toBe(false)
  })

  it('is true on other Wayland desktops', () => {
    expect(blocksFixing({ wayland: true, fixesOnWayland: false })).toBe(true)
  })

  it.each([null, 'x', { wayland: 'yes' }, {}])('is false for an unexpected answer %j', (raw) => {
    expect(blocksFixing(raw)).toBe(false)
  })
})
