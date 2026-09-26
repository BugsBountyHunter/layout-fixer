import { Store } from '@tauri-apps/plugin-store'

const SETTINGS_FILE = 'settings.json'

let store: Promise<Store> | undefined

/** One store for the whole page, shared by the Settings UI and the fix engine. */
export function settingsStore(): Promise<Store> {
  store ??= Store.load(SETTINGS_FILE, { autoSave: false, defaults: {} })
  return store
}
