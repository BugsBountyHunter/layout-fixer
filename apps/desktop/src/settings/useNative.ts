import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { useCallback, useEffect, useState } from 'react'

export interface ShortcutInfo {
  readonly accelerator: string
  readonly registered: boolean
  readonly paused: boolean
}

function logError(what: string) {
  return (error: unknown) => console.error(`[layout-fixer] ${what}:`, error)
}

/** Runs `check` now and whenever the window gains focus (e.g. back from System Settings or the tray). */
function useOnFocus(check: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    check()
    const unlisten = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (focused) check()
    })
    return () => {
      unlisten.then((stop) => stop()).catch(() => {})
    }
  }, [check, enabled])
}

export function useShortcutInfo(): readonly [ShortcutInfo | null, (info: ShortcutInfo) => void] {
  const [info, setInfo] = useState<ShortcutInfo | null>(null)
  const check = useCallback(() => {
    invoke<ShortcutInfo>('shortcut_info').then(setInfo).catch(logError('Could not read the shortcut'))
  }, [])
  useOnFocus(check)
  return [info, setInfo]
}

/** macOS only: whether the app may press ⌘C / ⌘V. */
export function useAccessibility(enabled: boolean): { readonly trusted: boolean | null; readonly request: () => void } {
  const [trusted, setTrusted] = useState<boolean | null>(null)
  const check = useCallback(() => {
    invoke<boolean>('accessibility_status').then(setTrusted).catch(logError('Could not read Accessibility status'))
  }, [])
  useOnFocus(check, enabled)
  const request = useCallback(() => {
    invoke('request_accessibility').catch(logError('Could not open Accessibility settings'))
  }, [])
  return { trusted, request }
}

/** Linux on Wayland can't send keys to other apps yet; Settings explains that. */
export function useWaylandSession(): boolean {
  const [wayland, setWayland] = useState(false)
  useEffect(() => {
    invoke<{ wayland: boolean }>('session_info')
      .then((info) => setWayland(info.wayland))
      .catch(logError('Could not read the session type'))
  }, [])
  return wayland
}

/** Login item state lives in the OS (LaunchAgent, registry, autostart file), not in our settings. */
export function useLaunchAtLogin(): readonly [boolean | null, (on: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  useEffect(() => {
    isEnabled().then(setEnabled).catch(logError('Could not read the login item'))
  }, [])
  const change = useCallback((on: boolean) => {
    ;(on ? enable() : disable()).then(isEnabled).then(setEnabled).catch(logError('Could not change the login item'))
  }, [])
  return [enabled, change]
}
