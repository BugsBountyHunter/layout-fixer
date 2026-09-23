import type { Settings } from '../platform/settings'
import { FIX_COMMAND, OPEN_OPTIONS_MESSAGE } from '../shared/constants'
import { ALL_SITES, type SelectionScriptSync } from './selection-script'

/** The subset of the extension API the background uses; optional parts are absent on Firefox for Android. */
export interface ExtensionApi {
  readonly runtime: Pick<typeof chrome.runtime, 'onInstalled' | 'onStartup' | 'onMessage' | 'openOptionsPage'>
  readonly i18n: Pick<typeof chrome.i18n, 'getMessage'>
  readonly scripting: Pick<typeof chrome.scripting, 'executeScript'>
  readonly contextMenus?: Pick<typeof chrome.contextMenus, 'removeAll' | 'create' | 'onClicked'>
  readonly commands?: Pick<typeof chrome.commands, 'onCommand'>
  readonly permissions?: Pick<typeof chrome.permissions, 'onAdded' | 'onRemoved'>
}

export interface BackgroundDependencies {
  readonly selectionSync: SelectionScriptSync
  readonly saveSettings: (patch: Partial<Settings>) => Promise<unknown>
  readonly watchSettings: (onChange: (settings: Settings) => void) => () => void
}

export interface Background {
  readonly fixLayoutInTab: (tabId: number) => Promise<void>
}

function isOpenOptionsMessage(message: unknown): boolean {
  return (
    typeof message === 'object' && message !== null && (message as { type?: unknown }).type === OPEN_OPTIONS_MESSAGE
  )
}

export function registerBackground(api: ExtensionApi, contentScript: string, deps: BackgroundDependencies): Background {
  const { selectionSync, saveSettings, watchSettings } = deps

  async function fixLayoutInTab(tabId: number): Promise<void> {
    try {
      await api.scripting.executeScript({ target: { tabId, allFrames: true }, files: [contentScript] })
    } catch (error) {
      console.warn('[layout-fixer] Cannot run on this page:', error)
    }
  }

  api.runtime.onInstalled.addListener(async () => {
    await selectionSync.sync()
    if (!api.contextMenus) return
    // Menus persist across updates; recreating without clearing throws a duplicate-id error.
    await api.contextMenus.removeAll()
    api.contextMenus.create({
      id: FIX_COMMAND,
      title: api.i18n.getMessage('menuFix'),
      contexts: ['selection', 'editable'],
    })
  })

  api.runtime.onStartup.addListener(() => selectionSync.sync())
  watchSettings(() => void selectionSync.sync())
  api.permissions?.onAdded.addListener(() => selectionSync.sync())
  api.permissions?.onRemoved.addListener(async (removed) => {
    if (removed.origins?.includes(ALL_SITES)) await saveSettings({ selectionButton: false })
    await selectionSync.sync()
  })

  api.runtime.onMessage.addListener((message) => {
    if (isOpenOptionsMessage(message)) void api.runtime.openOptionsPage()
  })

  api.contextMenus?.onClicked.addListener((info, tab) => {
    if (info.menuItemId === FIX_COMMAND && tab?.id !== undefined) return fixLayoutInTab(tab.id)
  })

  api.commands?.onCommand.addListener((command, tab) => {
    if (command === FIX_COMMAND && tab?.id !== undefined) return fixLayoutInTab(tab.id)
  })

  return { fixLayoutInTab }
}
