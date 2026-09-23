import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { defaultLayout, isLayoutId, LAYOUT_IDS, LAYOUTS, type LayoutId } from './index'
import { KEY_CODES, type KeyCode } from './keys'

interface OsLayout {
  readonly base: Record<KeyCode, string>
  readonly shift: Record<KeyCode, string>
}

function fixture(macosId: string): OsLayout {
  return JSON.parse(readFileSync(new URL(`./fixtures/com.apple.keylayout.${macosId}.json`, import.meta.url), 'utf8'))
}

const FIXTURES: Record<LayoutId, string> = {
  'en-us': 'US',
  'ar-pc': 'ArabicPC',
  'ar-mac': 'Arabic',
}

/** Keys a layout deliberately leaves unmapped, so the character the user typed is kept. */
const INTENTIONALLY_UNMAPPED: Partial<Record<LayoutId, ReadonlyArray<`${'base' | 'shift'}:${KeyCode}`>>> = {
  'ar-pc': ['shift:Digit5', 'shift:Minus'],
  'ar-mac': ['shift:Digit5', 'shift:Minus'],
}

const DIGIT_KEYS = new Set(KEY_CODES.filter((code) => code.startsWith('Digit')))
const MIRRORED = new Set(['()', ')(', '<>', '><', '{}', '}{', '[]', ']['])

describe('KEY_CODES', () => {
  it('lists the 47 printable keys once each, using KeyboardEvent.code names', () => {
    expect(KEY_CODES).toHaveLength(47)
    expect(new Set(KEY_CODES).size).toBe(47)
    expect(KEY_CODES).toContain('KeyQ')
    expect(KEY_CODES).toContain('Semicolon')
  })
})

describe('layout registry', () => {
  it('registers every layout under its own id', () => {
    for (const id of LAYOUT_IDS) expect(LAYOUTS[id].id).toBe(id)
  })

  it('has an OS fixture for every layout', () => {
    expect(Object.keys(FIXTURES).sort()).toEqual([...LAYOUT_IDS].sort())
  })

  it('only uses known key codes', () => {
    for (const id of LAYOUT_IDS) {
      for (const code of Object.keys(LAYOUTS[id].keys)) expect(KEY_CODES, `${id}: ${code}`).toContain(code)
    }
  })
})

describe.each(Object.entries(FIXTURES) as Array<[LayoutId, string]>)(
  '%s matches the real OS layout (%s)',
  (id, macosId) => {
    const layout = LAYOUTS[id]
    const os = fixture(macosId)
    const us = fixture('US')

    it('every mapped key types exactly what the OS types', () => {
      for (const [code, [base, shift]] of Object.entries(layout.keys) as Array<
        [KeyCode, readonly [string | null, string | null]]
      >) {
        if (base !== null) expect(base, `base:${code}`).toBe(os.base[code])
        if (shift !== null) expect(shift, `shift:${code}`).toBe(os.shift[code])
      }
    })

    it('maps every key that differs from US QWERTY, except digits, mirrored brackets and documented gaps', () => {
      const skipped = new Set(INTENTIONALLY_UNMAPPED[id] ?? [])
      for (const code of KEY_CODES) {
        for (const [layer, index] of [
          ['base', 0],
          ['shift', 1],
        ] as const) {
          const osChar = os[layer][code]
          const usChar = us[layer][code]
          const expected =
            osChar === usChar ||
            osChar === '' ||
            (id !== 'en-us' && DIGIT_KEYS.has(code) && layer === 'base') ||
            MIRRORED.has(usChar + osChar) ||
            skipped.has(`${layer}:${code}`)
              ? id === 'en-us'
                ? osChar
                : null
              : osChar
          expect(layout.keys[code]?.[index] ?? null, `${layer}:${code}`).toBe(expected)
        }
      }
    })
  },
)

describe('defaultLayout', () => {
  it('uses the macOS Arabic layout on Apple platforms and the PC layout elsewhere', () => {
    expect(defaultLayout(true)).toBe('ar-mac')
    expect(defaultLayout(false)).toBe('ar-pc')
  })
})

describe('isLayoutId', () => {
  it('accepts registered layouts only (values from storage are untrusted)', () => {
    expect(isLayoutId('ar-pc')).toBe(true)
    expect(isLayoutId('en-us')).toBe(true)
    expect(isLayoutId('azerty')).toBe(false)
    expect(isLayoutId('toString')).toBe(false)
    expect(isLayoutId(undefined)).toBe(false)
    expect(isLayoutId(42)).toBe(false)
  })
})
