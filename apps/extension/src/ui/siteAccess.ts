import { useEffect, useState } from 'react'

const ALL_SITES = { origins: ['<all_urls>'] }

/**
 * Must be called synchronously from the click/change handler: browsers only show the permission
 * prompt during a user gesture, and an earlier `await` would end it.
 */
export function requestSiteAccess(): Promise<boolean> {
  return chrome.permissions?.request(ALL_SITES) ?? Promise.resolve(false)
}

/** Fails harmlessly when access is required by the manifest (e.g. test builds). */
export function releaseSiteAccess(): Promise<boolean> {
  return (chrome.permissions?.remove(ALL_SITES) ?? Promise.resolve(false)).catch(() => false)
}

/** Access can also be revoked from the browser's own extension page, so track it live. */
export function useSiteAccess(): boolean {
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    const permissions = chrome.permissions
    if (!permissions) return
    const refresh = () => void permissions.contains(ALL_SITES).then(setGranted)
    refresh()
    permissions.onAdded.addListener(refresh)
    permissions.onRemoved.addListener(refresh)
    return () => {
      permissions.onAdded.removeListener(refresh)
      permissions.onRemoved.removeListener(refresh)
    }
  }, [])

  return granted
}
