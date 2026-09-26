import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect, useState } from 'react'

export interface ShortcutInfo {
  readonly accelerator: string
  readonly registered: boolean
}

export function useShortcutInfo(): ShortcutInfo | null {
  const [info, setInfo] = useState<ShortcutInfo | null>(null)
  useEffect(() => {
    invoke<ShortcutInfo>('shortcut_info')
      .then(setInfo)
      .catch((error: unknown) => console.error('[layout-fixer] Could not read the shortcut:', error))
  }, [])
  return info
}

/** Re-checked whenever the window gains focus, e.g. after the user comes back from System Settings. */
export function useAccessibility(enabled: boolean): { readonly trusted: boolean | null; readonly request: () => void } {
  const [trusted, setTrusted] = useState<boolean | null>(null)

  useEffect(() => {
    if (!enabled) return
    const check = () =>
      invoke<boolean>('accessibility_status')
        .then(setTrusted)
        .catch((error: unknown) => console.error('[layout-fixer] Could not read Accessibility status:', error))
    check()
    const unlisten = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (focused) check()
    })
    return () => {
      unlisten.then((stop) => stop()).catch(() => {})
    }
  }, [enabled])

  const request = () => {
    invoke('request_accessibility').catch((error: unknown) =>
      console.error('[layout-fixer] Could not open Accessibility settings:', error),
    )
  }
  return { trusted, request }
}
