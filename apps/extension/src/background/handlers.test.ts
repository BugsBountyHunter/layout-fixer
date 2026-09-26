import { describe, expect, it, vi } from 'vitest'
import { type ExtensionApi, registerBackground } from './handlers'

type Listener = (...args: never[]) => unknown

function fakeEvent() {
  const listeners: Listener[] = []
  return {
    addListener: (fn: Listener) => listeners.push(fn),
    fire: (...args: unknown[]) => Promise.all(listeners.map((fn) => (fn as (...a: unknown[]) => unknown)(...args))),
  }
}

function fakeApi(options: { mobile?: boolean } = {}) {
  const onInstalled = fakeEvent()
  const onStartup = fakeEvent()
  const onMessage = fakeEvent()
  const onClicked = fakeEvent()
  const onCommand = fakeEvent()
  const onAdded = fakeEvent()
  const onRemoved = fakeEvent()
  const api = {
    runtime: { onInstalled, onStartup, onMessage, openOptionsPage: vi.fn(async () => {}) },
    permissions: { onAdded, onRemoved },
    i18n: { getMessage: (key: string) => `msg:${key}` },
    scripting: { executeScript: vi.fn().mockResolvedValue([]) },
    contextMenus: options.mobile
      ? undefined
      : { removeAll: vi.fn().mockResolvedValue(undefined), create: vi.fn(), onClicked },
    commands: options.mobile ? undefined : { onCommand },
  }
  return {
    api: api as unknown as ExtensionApi,
    raw: api,
    onInstalled,
    onStartup,
    onMessage,
    onClicked,
    onCommand,
    onAdded,
    onRemoved,
  }
}

const SCRIPT = 'assets/content-loader.js'

function deps() {
  return {
    selectionSync: { sync: vi.fn(async () => {}) },
    saveSettings: vi.fn(async () => ({})),
    watchSettings: vi.fn(() => () => {}),
  }
}

describe('registerBackground', () => {
  it('creates a localized context menu for selections and editable fields on install', async () => {
    const { api, raw, onInstalled } = fakeApi()
    registerBackground(api, SCRIPT, deps())
    await onInstalled.fire({ reason: 'install' })

    expect(raw.contextMenus!.removeAll).toHaveBeenCalledBefore(raw.contextMenus!.create)
    expect(raw.contextMenus!.create).toHaveBeenCalledWith({
      id: 'fix-layout',
      title: 'msg:menuFix',
      contexts: ['selection', 'editable'],
    })
  })

  it('injects the content script into every frame of the tab when the menu is clicked', async () => {
    const { api, raw, onClicked } = fakeApi()
    registerBackground(api, SCRIPT, deps())
    await onClicked.fire({ menuItemId: 'fix-layout' }, { id: 7 })

    expect(raw.scripting.executeScript).toHaveBeenCalledWith({ target: { tabId: 7, allFrames: true }, files: [SCRIPT] })
  })

  it('injects the content script when the keyboard shortcut is pressed', async () => {
    const { api, raw, onCommand } = fakeApi()
    registerBackground(api, SCRIPT, deps())
    await onCommand.fire('fix-layout', { id: 3 })

    expect(raw.scripting.executeScript).toHaveBeenCalledWith({ target: { tabId: 3, allFrames: true }, files: [SCRIPT] })
  })

  it('ignores unrelated menu items, commands and tab-less events', async () => {
    const { api, raw, onClicked, onCommand } = fakeApi()
    registerBackground(api, SCRIPT, deps())
    await onClicked.fire({ menuItemId: 'other' }, { id: 1 })
    await onCommand.fire('other', { id: 1 })
    await onCommand.fire('fix-layout', undefined)

    expect(raw.scripting.executeScript).not.toHaveBeenCalled()
  })

  it('does not throw on restricted pages (chrome://, addons.mozilla.org, Web Store)', async () => {
    const { api, raw, onCommand } = fakeApi()
    raw.scripting.executeScript.mockRejectedValue(new Error('Cannot access contents of the page'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    registerBackground(api, SCRIPT, deps())

    await expect(onCommand.fire('fix-layout', { id: 1 })).resolves.toBeDefined()
    expect(warn).toHaveBeenCalled()
  })

  it('works without contextMenus and commands (Firefox for Android)', async () => {
    const { api, onInstalled } = fakeApi({ mobile: true })
    expect(() => registerBackground(api, SCRIPT, deps())).not.toThrow()
    await expect(onInstalled.fire({ reason: 'install' })).resolves.toBeDefined()
  })

  it('syncs the selection script on install, startup, settings and permission changes', async () => {
    const { api, onInstalled, onStartup, onAdded, onRemoved } = fakeApi()
    const d = deps()
    let pushSettings: () => void = () => {}
    d.watchSettings.mockImplementation(((listener: () => void) => {
      pushSettings = listener
      return () => {}
    }) as never)
    registerBackground(api, SCRIPT, d)

    await onInstalled.fire({ reason: 'install' })
    await onStartup.fire()
    pushSettings()
    await onAdded.fire({ origins: ['<all_urls>'] })
    await onRemoved.fire({ origins: ['https://example.com/*'] })
    expect(d.selectionSync.sync).toHaveBeenCalledTimes(5)
  })

  it('turns the setting off when the user revokes site access in the browser', async () => {
    const { api, onRemoved } = fakeApi()
    const d = deps()
    registerBackground(api, SCRIPT, d)
    await onRemoved.fire({ origins: ['<all_urls>'] })
    expect(d.saveSettings).toHaveBeenCalledWith({ selectionButton: false })
  })

  it('opens the settings page when a content script asks', async () => {
    const { api, raw, onMessage } = fakeApi()
    registerBackground(api, SCRIPT, deps())
    await onMessage.fire({ type: 'layout-fixer:open-options' })
    await onMessage.fire({ type: 'something-else' })
    await onMessage.fire(null)
    expect(raw.runtime.openOptionsPage).toHaveBeenCalledOnce()
  })
})
