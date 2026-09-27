import { useEffect, useState } from 'react'
import { type DesktopStatus, NATIVE_MESSAGING, pingDesktop } from '../platform/desktop-app'

/**
 * Must be called synchronously from the change handler: browsers only show the permission prompt
 * during a user gesture.
 */
export function requestDesktopAccess(): Promise<boolean> {
  return chrome.permissions?.request(NATIVE_MESSAGING) ?? Promise.resolve(false)
}

export function releaseDesktopAccess(): Promise<boolean> {
  return (chrome.permissions?.remove(NATIVE_MESSAGING) ?? Promise.resolve(false)).catch(() => false)
}

/**
 * Whether the desktop app answers, re-checked when the page regains focus (the user may have
 * installed or opened it meanwhile). `null` while unknown or when the switch is off.
 */
export function useDesktopStatus(enabled: boolean): DesktopStatus | null {
  const [status, setStatus] = useState<DesktopStatus | null>(null)

  useEffect(() => {
    if (!enabled) {
      setStatus(null)
      return
    }
    let active = true
    const check = () => void pingDesktop(chrome.runtime).then((next) => active && setStatus(next))
    check()
    window.addEventListener('focus', check)
    return () => {
      active = false
      window.removeEventListener('focus', check)
    }
  }, [enabled])

  return status
}
