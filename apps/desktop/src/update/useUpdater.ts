import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { relaunch } from '@tauri-apps/plugin-process'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Messages } from '../i18n'

const CHECK_EVERY_MS = 24 * 60 * 60 * 1000

export type UpdateStatus =
  | { readonly kind: 'idle' }
  | { readonly kind: 'checking' }
  | { readonly kind: 'current' }
  | { readonly kind: 'available'; readonly version: string }
  | { readonly kind: 'installing' }
  | { readonly kind: 'failed' }

export interface Updater {
  readonly version: string | null
  readonly status: UpdateStatus
  readonly checkNow: () => void
  readonly install: () => void
}

function logError(what: string) {
  return (error: unknown) => console.error(`[layout-fixer] ${what}:`, error)
}

/** Checks at launch and daily while `automatic` is on; installing always waits for the user. */
export function useUpdater(automatic: boolean, messages: Messages): Updater {
  const [version, setVersion] = useState<string | null>(null)
  const [status, setStatus] = useState<UpdateStatus>({ kind: 'idle' })
  const pending = useRef<Update | null>(null)

  useEffect(() => {
    getVersion().then(setVersion).catch(logError('Could not read the app version'))
  }, [])

  const checkNow = useCallback(() => {
    setStatus({ kind: 'checking' })
    check()
      .then((update) => {
        pending.current = update
        setStatus(update ? { kind: 'available', version: update.version } : { kind: 'current' })
      })
      .catch((error: unknown) => {
        logError('Update check failed')(error)
        setStatus({ kind: 'failed' })
      })
  }, [])

  useEffect(() => {
    if (!automatic) return
    checkNow()
    const timer = window.setInterval(checkNow, CHECK_EVERY_MS)
    return () => window.clearInterval(timer)
  }, [automatic, checkNow])

  // The tray offers the update too, in the current language.
  const available = status.kind === 'available' ? status.version : null
  useEffect(() => {
    const label = available ? messages.trayUpdate(available) : null
    invoke('set_update_label', { label }).catch(logError('Could not update the tray menu'))
  }, [available, messages])

  const install = useCallback(() => {
    const update = pending.current
    if (!update) return
    setStatus({ kind: 'installing' })
    update
      .downloadAndInstall()
      .then(() => relaunch())
      .catch((error: unknown) => {
        logError('Update install failed')(error)
        setStatus({ kind: 'failed' })
      })
  }, [])

  return { version, status, checkNow, install }
}
