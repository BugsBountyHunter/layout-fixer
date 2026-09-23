import { useEffect, useState } from 'react'

const SAVED_VISIBLE_MS = 1500

/** "Saved" confirmation that shows briefly after each change. */
export function useSavedFlash(): { readonly visible: boolean; readonly flash: () => void } {
  const [savedAt, setSavedAt] = useState(0)

  useEffect(() => {
    if (!savedAt) return
    const timer = setTimeout(() => setSavedAt(0), SAVED_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [savedAt])

  return { visible: savedAt > 0, flash: () => setSavedAt(Date.now()) }
}
