import { describe, expect, it } from 'vitest'
import { buildSamples, fixText, isFixShortcut, SAMPLE_INPUTS, shortcutKeys } from '@/lib/demo/samples'

const NO_MODIFIERS = { altKey: false, shiftKey: false, ctrlKey: false, metaKey: false }

describe('buildSamples', () => {
  it('converts every sample with the extension converter, in both directions', () => {
    expect(buildSamples()).toEqual([
      { typed: 'hgsghl ugd;l', fixed: 'السلام عليكم' },
      { typed: 'اثممخ صخقمي', fixed: 'hello world' },
      { typed: ';dt phg;?', fixed: 'كيف حالك؟' },
    ])
  })

  it('has one sample per input', () => {
    expect(buildSamples(SAMPLE_INPUTS)).toHaveLength(SAMPLE_INPUTS.length)
  })
})

describe('fixText', () => {
  it('converts typed text', () => {
    expect(fixText('hgsghl ugd;l')).toBe('السلام عليكم')
  })

  it('leaves empty and whitespace-only text unchanged', () => {
    expect(fixText('')).toBe('')
    expect(fixText('   ')).toBe('   ')
  })

  it('uses the Arabic layout the extension picks for the platform', () => {
    expect(fixText('hgp,hv', { isMac: false })).toBe('الحوار')
    expect(fixText('hgp,hv', { isMac: true })).toBe('الح،اد')
  })
})

describe('isFixShortcut', () => {
  it('matches Alt+Shift+F by physical key', () => {
    expect(isFixShortcut({ ...NO_MODIFIERS, code: 'KeyF', altKey: true, shiftKey: true })).toBe(true)
  })

  it('ignores the produced character (⌥⇧F types Ï on macOS)', () => {
    const macEvent = { ...NO_MODIFIERS, code: 'KeyF', altKey: true, shiftKey: true, key: 'Ï' }
    expect(isFixShortcut(macEvent)).toBe(true)
    const otherKeyTypingF = { ...macEvent, code: 'KeyG', key: 'F' }
    expect(isFixShortcut(otherKeyTypingF)).toBe(false)
  })

  it('rejects other combinations', () => {
    expect(isFixShortcut({ ...NO_MODIFIERS, code: 'KeyF', altKey: true })).toBe(false)
    expect(isFixShortcut({ ...NO_MODIFIERS, code: 'KeyG', altKey: true, shiftKey: true })).toBe(false)
    expect(isFixShortcut({ ...NO_MODIFIERS, code: 'KeyF', altKey: true, shiftKey: true, ctrlKey: true })).toBe(false)
    expect(isFixShortcut({ ...NO_MODIFIERS, code: 'KeyF', altKey: true, shiftKey: true, metaKey: true })).toBe(false)
  })
})

describe('shortcutKeys', () => {
  it('uses symbols on Apple platforms and names elsewhere', () => {
    expect(shortcutKeys(true)).toEqual(['⌥', '⇧', 'F'])
    expect(shortcutKeys(false)).toEqual(['Alt', 'Shift', 'F'])
  })
})
