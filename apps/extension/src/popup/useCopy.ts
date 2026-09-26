import { useEffect, useState } from 'react'

const COPIED_RESET_MS = 1500

export interface CopyState {
  readonly copied: boolean
  readonly copy: () => Promise<void>
}

/** Copies `text` and reports "copied" briefly so the button can confirm it. */
export function useCopy(text: string): CopyState {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_RESET_MS)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
  }

  return { copied, copy }
}
