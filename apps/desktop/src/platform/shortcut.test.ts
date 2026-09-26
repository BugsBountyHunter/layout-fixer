import { describe, expect, it } from 'vitest'
import { isValidShortcut, recordShortcut } from './shortcut'

const press = (code: string, mods: Partial<Record<'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey', boolean>> = {}) => ({
  code,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...mods,
})

describe('recordShortcut', () => {
  it('builds an accelerator from physical keys in a fixed order', () => {
    expect(recordShortcut(press('KeyF', { altKey: true, shiftKey: true }), true)).toEqual({
      kind: 'valid',
      accelerator: 'Alt+Shift+F',
    })
    expect(recordShortcut(press('Digit2', { metaKey: true, ctrlKey: true }), true)).toEqual({
      kind: 'valid',
      accelerator: 'Cmd+Ctrl+2',
    })
    expect(recordShortcut(press('F9', { ctrlKey: true }), false)).toEqual({ kind: 'valid', accelerator: 'Ctrl+F9' })
  })

  it('waits while only modifiers are held', () => {
    expect(recordShortcut(press('ShiftLeft', { shiftKey: true }), false)).toEqual({ kind: 'incomplete' })
    expect(recordShortcut(press('MetaRight', { metaKey: true }), true)).toEqual({ kind: 'incomplete' })
  })

  it.each([
    [press('KeyF'), true],
    [press('KeyF', { shiftKey: true }), false],
    [press('KeyF', { metaKey: true }), false],
    [press('Space', { altKey: true }), true],
    [press('BracketLeft', { ctrlKey: true }), false],
  ])('needs Ctrl, Alt or ⌘ with a letter, digit or F-key (%j)', (key, isMac) => {
    expect(recordShortcut(key, isMac)).toEqual({ kind: 'invalid', problem: 'needs-modifier' })
  })

  it('refuses shortcuts the system and every app rely on', () => {
    expect(recordShortcut(press('KeyC', { metaKey: true }), true)).toEqual({ kind: 'invalid', problem: 'reserved' })
    expect(recordShortcut(press('KeyV', { ctrlKey: true }), false)).toEqual({ kind: 'invalid', problem: 'reserved' })
    expect(recordShortcut(press('F4', { altKey: true }), false)).toEqual({ kind: 'invalid', problem: 'reserved' })
  })
})

describe('isValidShortcut', () => {
  it.each(['Alt+Shift+F', 'Cmd+Ctrl+2', 'Ctrl+F12', 'Super+Alt+K'])('accepts %s', (value) => {
    expect(isValidShortcut(value)).toBe(true)
  })

  it.each(['F', 'Alt+', 'Alt+Shift+Space', 'rm -rf', 42, null])('rejects %j', (value) => {
    expect(isValidShortcut(value)).toBe(false)
  })
})
