import { ShortcutKeys } from '@layout-fixer/ui/ShortcutKeys'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { useMessages } from '../i18n/react'
import { formatAccelerator } from '../platform/accelerator'
import { DEFAULT_SHORTCUT, recordShortcut } from '../platform/shortcut'
import type { ShortcutInfo } from './useNative'

type Problem = 'needs-modifier' | 'reserved' | 'taken' | null

interface Props {
  readonly info: ShortcutInfo | null
  readonly isMac: boolean
  readonly onChanged: (info: ShortcutInfo) => void
}

function useRecorder(isMac: boolean, apply: (accelerator: string) => void) {
  const [recording, setRecording] = useState(false)
  const [problem, setProblem] = useState<Problem>(null)

  useEffect(() => {
    if (!recording) return
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') return setRecording(false)
      const result = recordShortcut(event, isMac)
      if (result.kind === 'invalid') setProblem(result.problem)
      if (result.kind === 'valid') {
        setRecording(false)
        apply(result.accelerator)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [recording, isMac, apply])

  const start = () => {
    setProblem(null)
    setRecording(true)
  }
  return { recording, problem, setProblem, start, cancel: () => setRecording(false) }
}

export function ShortcutSection({ info, isMac, onChanged }: Props) {
  const m = useMessages()
  const [pending, setPending] = useState<string | null>(null)

  const apply = (accelerator: string) => {
    setPending(accelerator)
    invoke<ShortcutInfo>('set_shortcut', { accelerator })
      .then(onChanged)
      .then(() => recorder.setProblem(null))
      .catch(() => recorder.setProblem('taken'))
      .finally(() => setPending(null))
  }
  const recorder = useRecorder(isMac, apply)

  const problemText = {
    'needs-modifier': m.shortcutNeedsModifier,
    reserved: m.shortcutReserved,
    taken: m.shortcutTaken,
  }
  const hint = recorder.problem
    ? problemText[recorder.problem]
    : info && !info.registered && !info.paused
      ? m.shortcutTaken
      : m.shortcutHint
  const shown = pending ?? info?.accelerator

  return (
    <section className="section" aria-labelledby="shortcut-title">
      <h2 id="shortcut-title">{m.shortcutSection}</h2>
      <div className="group">
        <div className="row">
          <span className="row-label">{m.shortcutLabel}</span>
          <span className="shortcut-controls">
            {recorder.recording ? (
              <span className="recording" aria-live="polite">
                {m.shortcutRecording}
              </span>
            ) : (
              shown && <ShortcutKeys keys={formatAccelerator(shown, isMac)} />
            )}
            {recorder.recording ? (
              <button type="button" onClick={recorder.cancel}>
                {m.shortcutCancel}
              </button>
            ) : (
              <button type="button" onClick={recorder.start} disabled={!info || pending !== null}>
                {m.shortcutChange}
              </button>
            )}
          </span>
        </div>
      </div>
      <p className={recorder.problem ? 'footnote notice' : 'footnote'} role={recorder.problem ? 'alert' : undefined}>
        {hint}{' '}
        {info && info.accelerator !== DEFAULT_SHORTCUT && !recorder.recording && (
          <button type="button" className="link" onClick={() => apply(DEFAULT_SHORTCUT)}>
            {m.shortcutReset}
          </button>
        )}
      </p>
    </section>
  )
}
