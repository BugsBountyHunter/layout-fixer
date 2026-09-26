import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  parseSettings,
  type Settings,
  saveSettings,
  watchSettings,
} from '../platform/settings'

export interface SettingsState {
  readonly settings: Settings
  readonly loaded: boolean
  readonly update: (patch: Partial<Settings>) => Promise<void>
}

/** Stays in sync when another extension page (popup ↔ options) or another device changes settings. */
export function useSettings(): SettingsState {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    void loadSettings().then((stored) => {
      if (!active) return
      setSettings(stored)
      setLoaded(true)
    })
    const stop = watchSettings(setSettings)
    return () => {
      active = false
      stop()
    }
  }, [])

  /** Updates the UI immediately so controls respond at once, then persists. */
  const update = useCallback(async (patch: Partial<Settings>) => {
    setSettings((current) => parseSettings({ ...current, ...patch }))
    setSettings(await saveSettings(patch))
  }, [])

  return { settings, loaded, update }
}
