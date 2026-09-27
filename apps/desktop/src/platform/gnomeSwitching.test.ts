import { describe, expect, it } from 'vitest'
import { parseGnomeSwitching } from './gnomeSwitching'

describe('parseGnomeSwitching', () => {
  it.each(['off', 'on', 'log-out', 'extensions-off', 'incompatible'] as const)('accepts %s', (status) => {
    expect(parseGnomeSwitching(status)).toBe(status)
  })

  it('shows nothing outside GNOME', () => {
    expect(parseGnomeSwitching('unavailable')).toBeNull()
  })

  it.each([null, undefined, 42, 'maybe', { status: 'on' }])('ignores %j', (raw) => {
    expect(parseGnomeSwitching(raw)).toBeNull()
  })
})
