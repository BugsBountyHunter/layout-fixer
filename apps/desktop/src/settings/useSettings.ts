import type { Store } from '@tauri-apps/plugin-store'
import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type DesktopSettings, loadSettings, saveSettings } from '../platform/settings'
import { settingsStore } from '../platform/store'

export interface SettingsState {
  readonly settings: DesktopSettings
  /** False until the saved settings are read, so first-run UI doesn't flash. */
  readonly loaded: boolean
  readonly failed: boolean
  readonly update: (patch: Partial<DesktopSettings>) => void
}

export function useSettings(): SettingsState {
  const [store, setStore] = useState<Store | null>(null)
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    settingsStore()
      .then(async (opened) => {
        const initial = await loadSettings(opened)
        if (!active) return
        setStore(opened)
        setSettings(initial)
        setLoaded(true)
      })
      .catch((error: unknown) => {
        console.error('[layout-fixer] Could not open the settings file:', error)
        if (!active) return
        setFailed(true)
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  const update = useCallback(
    (patch: Partial<DesktopSettings>) => {
      if (!store) return
      saveSettings(store, patch)
        .then(setSettings)
        .catch((error: unknown) => {
          console.error('[layout-fixer] Could not save settings:', error)
          setFailed(true)
        })
    },
    [store],
  )

  return { settings, loaded, failed, update }
}
