import type { Store } from '@tauri-apps/plugin-store'
import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type DesktopSettings, loadSettings, saveSettings } from '../platform/settings'
import { settingsStore } from '../platform/store'

interface SettingsState {
  readonly settings: DesktopSettings
  readonly failed: boolean
  readonly update: (patch: Partial<DesktopSettings>) => void
}

export function useSettings(): SettingsState {
  const [store, setStore] = useState<Store | null>(null)
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_SETTINGS)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    settingsStore()
      .then(async (loaded) => {
        const initial = await loadSettings(loaded)
        if (!active) return
        setStore(loaded)
        setSettings(initial)
      })
      .catch((error: unknown) => {
        console.error('[layout-fixer] Could not open the settings file:', error)
        if (active) setFailed(true)
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

  return { settings, failed, update }
}
