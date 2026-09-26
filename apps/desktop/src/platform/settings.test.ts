import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  parseSettings,
  resolveLayout,
  type SettingsStore,
  saveSettings,
} from './settings'

function memoryStore(initial: Record<string, unknown> = {}): SettingsStore & { data: Record<string, unknown> } {
  const data = { ...initial }
  return {
    data,
    get: async (key) => data[key],
    set: async (key, value) => {
      data[key] = value
    },
    save: vi.fn(async () => {}),
  }
}

describe('parseSettings', () => {
  it('keeps valid layout choices', () => {
    expect(parseSettings({ arabicLayout: 'ar-mac' })).toEqual({ arabicLayout: 'ar-mac' })
  })

  it.each([undefined, null, 'ar-mac', [], { arabicLayout: 'en-us' }, { arabicLayout: 42 }])(
    'falls back to defaults for %j (the file on disk is untrusted)',
    (raw) => {
      expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS)
    },
  )
})

describe('resolveLayout', () => {
  it('uses the Mac layout on macOS and the PC layout elsewhere when automatic', () => {
    expect(resolveLayout(DEFAULT_SETTINGS, true)).toBe('ar-mac')
    expect(resolveLayout(DEFAULT_SETTINGS, false)).toBe('ar-pc')
  })

  it('respects an explicit choice on every OS', () => {
    expect(resolveLayout({ arabicLayout: 'ar-pc' }, true)).toBe('ar-pc')
  })
})

describe('loadSettings / saveSettings', () => {
  it('returns defaults for an empty store', async () => {
    expect(await loadSettings(memoryStore())).toEqual(DEFAULT_SETTINGS)
  })

  it('returns defaults when the store fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const store = { ...memoryStore(), get: async () => Promise.reject(new Error('corrupt file')) }
    expect(await loadSettings(store)).toEqual(DEFAULT_SETTINGS)
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('validates, stores and flushes a change', async () => {
    const store = memoryStore()
    expect(await saveSettings(store, { arabicLayout: 'ar-pc' })).toEqual({ arabicLayout: 'ar-pc' })
    expect(store.data.settings).toEqual({ arabicLayout: 'ar-pc' })
    expect(store.save).toHaveBeenCalledOnce()
  })

  it('rejects invalid values instead of storing them', async () => {
    const store = memoryStore({ settings: { arabicLayout: 'ar-mac' } })
    const next = await saveSettings(store, { arabicLayout: 'xx' as never })
    expect(next).toEqual(DEFAULT_SETTINGS)
  })
})
