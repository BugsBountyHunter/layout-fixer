import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { useCallback, useEffect, useState } from 'react'
import { errorCode } from '../fix/bridge'
import { type GnomeSwitching, parseGnomeSwitching } from '../platform/gnomeSwitching'
import { type LayoutInfo, parseLayoutList } from '../platform/layoutHints'
import { blocksFixing } from '../platform/session'

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

/**
 * The OS keyboard layouts, re-read on focus so a layout added in the system settings shows up.
 * `null` while unknown, and on systems without layout switching.
 */
export function useInputLayouts(): readonly LayoutInfo[] | null {
  const [layouts, setLayouts] = useState<readonly LayoutInfo[] | null>(null)
  const check = useCallback(() => {
    invoke<unknown>('list_layouts')
      .then((raw) => setLayouts(parseLayoutList(raw)))
      .catch((error: unknown) => {
        setLayouts(null)
        if (errorCode(error) !== 'unsupported') logError('Could not list the keyboard layouts')(error)
      })
  }, [])
  useOnFocus(check)
  return layouts
}

/** Linux on a Wayland desktop where the shortcut can't fix text; Settings explains that. */
export function useWaylandSession(): boolean {
  const [wayland, setWayland] = useState(false)
  useEffect(() => {
    invoke<unknown>('session_info')
      .then((info) => setWayland(blocksFixing(info)))
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

export type InstallLocation = 'installed' | 'disk-image' | 'translocated'

/** macOS: whether the app runs from Applications, the disk image, or a temporary (translocated) copy. */
export function useInstallLocation(): InstallLocation {
  const [location, setLocation] = useState<InstallLocation>('installed')
  useEffect(() => {
    invoke<InstallLocation>('install_location').then(setLocation).catch(logError('Could not read the install location'))
  }, [])
  return location
}

export interface GnomeSwitchingState {
  /** `null` outside GNOME, and while unknown. */
  readonly status: GnomeSwitching | null
  readonly busy: boolean
  readonly failed: boolean
  readonly enable: () => void
}

/** GNOME only: Layout Fixer's GNOME Shell extension, re-read on focus (e.g. after logging back in). */
export function useGnomeSwitching(): GnomeSwitchingState {
  const [status, setStatus] = useState<GnomeSwitching | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const check = useCallback(() => {
    invoke<unknown>('gnome_switching')
      .then((raw) => setStatus(parseGnomeSwitching(raw)))
      .catch(logError('Could not read the GNOME extension state'))
  }, [])
  useOnFocus(check)
  const enableExtension = useCallback(() => {
    setBusy(true)
    setFailed(false)
    invoke<unknown>('enable_gnome_switching')
      .then((raw) => setStatus(parseGnomeSwitching(raw)))
      .catch((error: unknown) => {
        setFailed(true)
        logError('Could not install the GNOME extension')(error)
      })
      .finally(() => setBusy(false))
  }, [])
  return { status, busy, failed, enable: enableExtension }
}
