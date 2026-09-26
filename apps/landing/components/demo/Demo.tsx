'use client'

import { type KeyboardEvent, useState } from 'react'
import { buildSamples, fixText, isFixShortcut, shortcutKeys } from '@/lib/demo/samples'
import type { Dictionary } from '@/lib/i18n'
import { Keys } from '../Keys'
import styles from './Demo.module.css'
import { useHydrated, useIsMac } from './usePlatform'
import { useShowcase } from './useShowcase'

type Labels = Dictionary['demo']

const SAMPLES = buildSamples()

interface DemoPartProps {
  readonly labels: Labels
  readonly keys: readonly string[]
}

function Showcase({ labels, keys }: DemoPartProps) {
  const { animate, paused, togglePaused, phase, sample, shown } = useShowcase(SAMPLES)
  return (
    <figure className={styles.showcase}>
      {/* Always in the layout so hydration doesn't shift the page; only visible when the demo can't animate. */}
      <p className={styles.before} data-animating={animate} aria-hidden="true">
        <span className={styles.beforeLabel}>{labels.before}</span>
        <span className={styles.beforeText} dir="auto" data-testid="demo-before">
          {sample.typed}
        </span>
      </p>
      <div className={styles.field} aria-hidden="true">
        <span dir="auto" data-testid="demo-showcase">
          {shown}
        </span>
        {animate && phase !== 'fixed' && <span className={styles.caret} />}
      </div>
      <figcaption className={styles.caption}>
        <span className="visually-hidden">
          {labels.before}: {SAMPLES[0].typed} → {labels.after}: {SAMPLES[0].fixed}
        </span>
        <span aria-hidden="true">
          <Keys keys={keys} active={phase === 'pressed'} testId="demo-keys" />
        </span>
        {animate && (
          <button type="button" className="button button-secondary button-small" onClick={togglePaused}>
            {paused ? labels.play : labels.pause}
          </button>
        )}
      </figcaption>
    </figure>
  )
}

/** The try-it box's state. `announcement` tells screen readers the result, since focus stays on the button. */
function useTryIt(labels: Labels, isMac: boolean) {
  const [input, setInput] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const fix = () => {
    const fixed = fixText(input, { isMac })
    setInput(fixed)
    setAnnouncement(fixed.trim() ? `${labels.after}: ${fixed}` : '')
  }
  return { input, setInput, announcement, fix }
}

function TryIt({ labels, keys, isMac }: DemoPartProps & { readonly isMac: boolean }) {
  const { input, setInput, announcement, fix } = useTryIt(labels, isMac)
  // Hydration resets a controlled input, so text typed before it would be lost: stay disabled until then.
  const ready = useHydrated()

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isFixShortcut(event)) return
    event.preventDefault()
    fix()
  }

  return (
    <form
      className={styles.tryIt}
      onSubmit={(event) => {
        event.preventDefault()
        fix()
      }}
    >
      <label className={styles.label} htmlFor="demo-input">
        {labels.label}
      </label>
      <div className={styles.row}>
        <input
          id="demo-input"
          className={styles.input}
          data-testid="demo-input"
          // Empty, the box follows the page (so the Arabic placeholder reads right to left); typed text picks its own.
          dir={input ? 'auto' : undefined}
          disabled={!ready}
          value={input}
          placeholder={labels.placeholder}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="button button-secondary" disabled={!ready}>
          {labels.fix}
        </button>
      </div>
      <p className={`muted small ${styles.hint}`} data-testid="demo-hint">
        {labels.orPress} <Keys keys={keys} />
      </p>
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </form>
  )
}

/** Autoplaying before → after showcase plus a box to try it, both running the extension's converter. */
export function Demo({ labels }: { labels: Labels }) {
  const isMac = useIsMac()
  const keys = shortcutKeys(isMac)
  return (
    <div className={styles.demo}>
      <Showcase labels={labels} keys={keys} />
      <TryIt labels={labels} keys={keys} isMac={isMac} />
    </div>
  )
}
