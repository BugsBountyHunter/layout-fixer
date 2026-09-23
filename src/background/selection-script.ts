export const SELECTION_SCRIPT_ID = 'layout-fixer-selection-button'
export const ALL_SITES = '<all_urls>'

export interface SelectionScriptApi {
  readonly permissions?: Pick<typeof chrome.permissions, 'contains'>
  readonly scripting: Pick<
    typeof chrome.scripting,
    'getRegisteredContentScripts' | 'registerContentScripts' | 'unregisterContentScripts' | 'executeScript'
  >
  readonly tabs: Pick<typeof chrome.tabs, 'query'>
}

export interface SelectionScriptSync {
  readonly sync: () => Promise<void>
}

const REGISTRATION: Readonly<Omit<chrome.scripting.RegisteredContentScript, 'js'>> = {
  id: SELECTION_SCRIPT_ID,
  matches: [ALL_SITES],
  allFrames: true,
  runAt: 'document_idle',
  persistAcrossSessions: true,
}

async function injectIntoOpenTabs(api: SelectionScriptApi, script: string): Promise<void> {
  const tabs = await api.tabs.query({})
  const injections = tabs.flatMap((tab) =>
    tab.id === undefined
      ? []
      : [api.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: [script] })],
  )
  await Promise.allSettled(injections)
}

async function reconcile(api: SelectionScriptApi, script: string, loadSettings: SettingsLoader): Promise<void> {
  try {
    const [{ selectionButton }, granted, registered] = await Promise.all([
      loadSettings(),
      api.permissions?.contains({ origins: [ALL_SITES] }) ?? false,
      api.scripting.getRegisteredContentScripts({ ids: [SELECTION_SCRIPT_ID] }),
    ])
    const wanted = selectionButton && granted

    if (wanted && registered.length === 0) {
      await api.scripting.registerContentScripts([{ ...REGISTRATION, js: [script] }])
      await injectIntoOpenTabs(api, script)
    } else if (!wanted && registered.length > 0) {
      await api.scripting.unregisterContentScripts({ ids: [SELECTION_SCRIPT_ID] })
    }
  } catch (error) {
    console.warn('[layout-fixer] Could not update the selection button script:', error)
  }
}

type SettingsLoader = () => Promise<{ readonly selectionButton: boolean }>

/**
 * Keeps the always-on selection script registered exactly when the user has turned the button on
 * and granted optional access to all sites. Both can change from outside (settings on another
 * device, access revoked in the browser's extension page), so callers re-sync on every change.
 * Syncs are queued so overlapping events can't register the script twice.
 */
export function createSelectionScriptSync(
  api: SelectionScriptApi,
  script: string,
  loadSettings: SettingsLoader,
): SelectionScriptSync {
  let queue = Promise.resolve()
  return {
    sync: () => {
      queue = queue.then(() => reconcile(api, script, loadSettings))
      return queue
    },
  }
}
