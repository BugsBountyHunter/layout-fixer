import { describe, expect, it, vi } from 'vitest'
import { ALL_SITES, createSelectionScriptSync, SELECTION_SCRIPT_ID, type SelectionScriptApi } from './selection-script'

const SCRIPT = 'assets/selection-loader.js'

function fakeApi({ granted = true, registered = false } = {}) {
  let scripts = registered ? [{ id: SELECTION_SCRIPT_ID }] : []
  const api = {
    permissions: { contains: vi.fn(async () => granted) },
    scripting: {
      getRegisteredContentScripts: vi.fn(async () => scripts),
      registerContentScripts: vi.fn(async (list: Array<{ id: string }>) => {
        scripts = list
      }),
      unregisterContentScripts: vi.fn(async () => {
        scripts = []
      }),
      executeScript: vi.fn(async () => []),
    },
    tabs: { query: vi.fn(async () => [{ id: 1 }, { id: 2 }, {}]) },
  }
  return { api: api as unknown as SelectionScriptApi, raw: api }
}

const on = vi.fn(async () => ({ selectionButton: true }))
const off = vi.fn(async () => ({ selectionButton: false }))

describe('selection script sync', () => {
  it('registers the script on all sites when the setting is on and access is granted', async () => {
    const { api, raw } = fakeApi()
    await createSelectionScriptSync(api, SCRIPT, on).sync()

    expect(raw.permissions.contains).toHaveBeenCalledWith({ origins: [ALL_SITES] })
    expect(raw.scripting.registerContentScripts).toHaveBeenCalledWith([
      {
        id: SELECTION_SCRIPT_ID,
        js: [SCRIPT],
        matches: [ALL_SITES],
        allFrames: true,
        runAt: 'document_idle',
        persistAcrossSessions: true,
      },
    ])
  })

  it('adds the button to tabs that are already open, skipping tabs without an id', async () => {
    const { api, raw } = fakeApi()
    await createSelectionScriptSync(api, SCRIPT, on).sync()

    expect(raw.scripting.executeScript).toHaveBeenCalledTimes(2)
    expect(raw.scripting.executeScript).toHaveBeenCalledWith({ target: { tabId: 1, allFrames: true }, files: [SCRIPT] })
  })

  it('ignores open tabs the browser refuses (chrome://, the Web Store)', async () => {
    const { api, raw } = fakeApi()
    raw.scripting.executeScript.mockRejectedValue(new Error('Cannot access'))
    await expect(createSelectionScriptSync(api, SCRIPT, on).sync()).resolves.toBeUndefined()
  })

  it('does not register twice', async () => {
    const { api, raw } = fakeApi({ registered: true })
    await createSelectionScriptSync(api, SCRIPT, on).sync()
    expect(raw.scripting.registerContentScripts).not.toHaveBeenCalled()
    expect(raw.scripting.executeScript).not.toHaveBeenCalled()
  })

  it('unregisters when the setting is off', async () => {
    const { api, raw } = fakeApi({ registered: true })
    await createSelectionScriptSync(api, SCRIPT, off).sync()
    expect(raw.scripting.unregisterContentScripts).toHaveBeenCalledWith({ ids: [SELECTION_SCRIPT_ID] })
  })

  it('unregisters when site access was revoked', async () => {
    const { api, raw } = fakeApi({ granted: false, registered: true })
    await createSelectionScriptSync(api, SCRIPT, on).sync()
    expect(raw.scripting.unregisterContentScripts).toHaveBeenCalled()
    expect(raw.scripting.registerContentScripts).not.toHaveBeenCalled()
  })

  it('does nothing when off and not registered', async () => {
    const { api, raw } = fakeApi()
    await createSelectionScriptSync(api, SCRIPT, off).sync()
    expect(raw.scripting.registerContentScripts).not.toHaveBeenCalled()
    expect(raw.scripting.unregisterContentScripts).not.toHaveBeenCalled()
  })

  it('logs instead of throwing when registration fails', async () => {
    const { api, raw } = fakeApi()
    raw.scripting.registerContentScripts.mockRejectedValue(new Error('boom'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(createSelectionScriptSync(api, SCRIPT, on).sync()).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
  })

  it('treats a browser without the permissions API as not granted', async () => {
    const { api, raw } = fakeApi()
    const withoutPermissions = { ...api, permissions: undefined }
    await createSelectionScriptSync(withoutPermissions, SCRIPT, on).sync()
    expect(raw.scripting.registerContentScripts).not.toHaveBeenCalled()
  })

  it('runs overlapping syncs one after another so the script is registered once', async () => {
    const { api, raw } = fakeApi()
    const sync = createSelectionScriptSync(api, SCRIPT, on)
    await Promise.all([sync.sync(), sync.sync()])
    expect(raw.scripting.registerContentScripts).toHaveBeenCalledOnce()
  })
})
