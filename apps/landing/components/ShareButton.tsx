'use client'

import { useEffect, useRef, useState } from 'react'

const COPIED_MS = 2000

interface Props {
  readonly url: string
  readonly title: string
  readonly text: string
  readonly label: string
  readonly copiedLabel: string
}

/** Opens the system share sheet where there is one, otherwise copies the link. */
export function ShareButton({ url, title, text, label, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  async function share() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url })
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) console.warn('Share failed', error)
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), COPIED_MS)
    } catch (error) {
      console.warn('Copy failed', error)
      window.prompt(label, url)
    }
  }

  return (
    <button
      type="button"
      className="button button-secondary button-small"
      onClick={() => void share()}
      aria-live="polite"
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
