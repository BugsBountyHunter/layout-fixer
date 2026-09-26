import { CheckIcon } from '@layout-fixer/ui/icons'
import { useMessages } from '../i18n/react'

interface Props {
  readonly trusted: boolean | null
  readonly onRequest: () => void
}

/** macOS only: without Accessibility the app can't press ⌘C / ⌘V for the user. */
export function AccessibilitySection({ trusted, onRequest }: Props) {
  const m = useMessages()
  return (
    <section className="section" aria-labelledby="access-title">
      <h2 id="access-title">{m.accessSection}</h2>
      <div className="group">
        <div className="row">
          <span className="row-label">{m.accessLabel}</span>
          {trusted ? (
            <span className="status allowed">
              <CheckIcon /> {m.accessAllowed}
            </span>
          ) : (
            <button type="button" className="primary" onClick={onRequest} disabled={trusted === null}>
              {m.accessButton}
            </button>
          )}
        </div>
      </div>
      <p className="footnote">{trusted ? m.accessAllowedHint : m.accessHint}</p>
    </section>
  )
}
