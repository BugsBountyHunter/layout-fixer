import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, loadSettings, parseSettings, resolveLayout, saveSettings, watchSettings } from './settings'

type Listener = (changes: Record<string, { newValue?: unknown }>, area: string) => void

function fakeStorage(initial: Record<string, unknown> = {}) {
  let data = { ...initial }
  const listeners: Listener[] = []
  const sync = {
    get: vi.fn(async (key: string) => (key in data ? { [key]: data[key] } : {})),
    set: vi.fn(async (items: Record<string, unknown>) => {
      data = { ...data, ...items }
      for (const listener of listeners) {
        listener(Object.fromEntries(Object.entries(items).map(([k, v]) => [k, { newValue: v }])), 'sync')
      }
    }),
  }
  const onChanged = {
    addListener: (fn: Listener) => listeners.push(fn),
    removeListener: (fn: Listener) => listeners.splice(listeners.indexOf(fn), 1),
  }
  vi.stubGlobal('chrome', { storage: { sync, onChanged } })
  return {
    sync,
    fire: (changes: Record<string, { newValue?: unknown }>, area: string) =>
      listeners.forEach((listener) => {
        listener(changes, area)
      }),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('parseSettings', () => {
  it('returns defaults for missing or malformed data', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('oops')).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings([])).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid fields and replaces invalid ones individually', () => {
    expect(parseSettings({ arabicLayout: 'ar-mac', showToasts: 'yes' })).toEqual({
      ...DEFAULT_SETTINGS,
      arabicLayout: 'ar-mac',
    })
    expect(parseSettings({ arabicLayout: 'en-us', showToasts: false })).toEqual({
      ...DEFAULT_SETTINGS,
      showToasts: false,
    })
  })

  it('rejects layouts that are not Arabic layouts', () => {
    expect(parseSettings({ arabicLayout: 'toString' }).arabicLayout).toBe('auto')
    expect(parseSettings({ arabicLayout: 'en-us' }).arabicLayout).toBe('auto')
  })

  it('keeps the selection button off unless explicitly turned on', () => {
    expect(DEFAULT_SETTINGS.selectionButton).toBe(false)
    expect(parseSettings({ selectionButton: true }).selectionButton).toBe(true)
    expect(parseSettings({ selectionButton: 'true' }).selectionButton).toBe(false)
  })

  it('stores a validated pair of two languages', () => {
    expect(DEFAULT_SETTINGS.languages).toEqual(['ar', 'en'])
    expect(parseSettings({ languages: ['en', 'ar'] }).languages).toEqual(['en', 'ar'])
    expect(parseSettings({ languages: ['ar', 'ar'] }).languages).toEqual(['ar', 'en'])
  })

  it('drops unknown fields', () => {
    expect(parseSettings({ showToasts: true, extra: 1 })).not.toHaveProperty('extra')
  })
})

describe('resolveLayout', () => {
  it('follows the OS in automatic mode', () => {
    expect(resolveLayout({ ...DEFAULT_SETTINGS, arabicLayout: 'auto' }, true)).toBe('ar-mac')
    expect(resolveLayout({ ...DEFAULT_SETTINGS, arabicLayout: 'auto' }, false)).toBe('ar-pc')
  })

  it('uses an explicit choice on every OS', () => {
    expect(resolveLayout({ ...DEFAULT_SETTINGS, arabicLayout: 'ar-pc' }, true)).toBe('ar-pc')
    expect(resolveLayout({ ...DEFAULT_SETTINGS, arabicLayout: 'ar-mac' }, false)).toBe('ar-mac')
  })
})

describe('loadSettings / saveSettings', () => {
  it('returns defaults when nothing is stored', async () => {
    fakeStorage()
    await expect(loadSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('returns defaults outside the extension runtime', async () => {
    await expect(loadSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('returns defaults when storage fails', async () => {
    const { sync } = fakeStorage()
    sync.get.mockRejectedValue(new Error('quota'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(loadSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('merges a partial update with the stored settings and returns the result', async () => {
    const { sync } = fakeStorage({
      settings: { arabicLayout: 'ar-mac', showToasts: true, selectionButton: true, languages: ['en', 'ar'] },
    })
    const expected = { arabicLayout: 'ar-mac', showToasts: false, selectionButton: true, languages: ['en', 'ar'] }
    await expect(saveSettings({ showToasts: false })).resolves.toEqual(expected)
    expect(sync.set).toHaveBeenCalledWith({ settings: expected })
    await expect(loadSettings()).resolves.toEqual(expected)
  })

  it('never writes an invalid value', async () => {
    const { sync } = fakeStorage()
    await saveSettings({ arabicLayout: 'nope' as never })
    expect(sync.set).toHaveBeenCalledWith({ settings: DEFAULT_SETTINGS })
  })
})

describe('watchSettings', () => {
  it('reports validated changes from other pages and stops when unsubscribed', async () => {
    const { fire } = fakeStorage()
    const onChange = vi.fn()
    const stop = watchSettings(onChange)

    fire({ settings: { newValue: { arabicLayout: 'ar-mac', showToasts: 7 } } }, 'sync')
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_SETTINGS, arabicLayout: 'ar-mac' })

    fire({ settings: { newValue: { arabicLayout: 'ar-pc' } } }, 'local')
    fire({ other: { newValue: 1 } }, 'sync')
    expect(onChange).toHaveBeenCalledOnce()

    stop()
    fire({ settings: { newValue: {} } }, 'sync')
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('is a no-op outside the extension runtime', () => {
    expect(() => watchSettings(vi.fn())()).not.toThrow()
  })
})
