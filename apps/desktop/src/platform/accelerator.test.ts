import { describe, expect, it } from 'vitest'
import { formatAccelerator } from './accelerator'

describe('formatAccelerator', () => {
  it('draws macOS symbols', () => {
    expect(formatAccelerator('Alt+Shift+F', true)).toEqual(['⌥', '⇧', 'F'])
    expect(formatAccelerator('CmdOrCtrl+Control+K', true)).toEqual(['⌘', '⌃', 'K'])
  })

  it('uses key names on Windows and Linux', () => {
    expect(formatAccelerator('Alt+Shift+F', false)).toEqual(['Alt', 'Shift', 'F'])
    expect(formatAccelerator('CmdOrCtrl+Super+K', false)).toEqual(['Ctrl', 'Win', 'K'])
  })

  it('ignores empty parts', () => {
    expect(formatAccelerator('', false)).toEqual([])
  })
})
