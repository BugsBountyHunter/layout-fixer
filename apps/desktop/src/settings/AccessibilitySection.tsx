import { CheckIcon } from '@layout-fixer/ui/icons'
import { STRINGS } from './strings'

interface Props {
  readonly trusted: boolean | null
  readonly onRequest: () => void
}

/** macOS only: without Accessibility the app can't press ⌘C / ⌘V for the user. */
export function AccessibilitySection({ trusted, onRequest }: Props) {
  return (
    <section className="section" aria-labelledby="access-title">
      <h2 id="access-title">{STRINGS.accessSection}</h2>
      <div className="group">
        <div className="row">
          <span className="row-label">{STRINGS.accessLabel}</span>
          {trusted ? (
            <span className="status allowed">
              <CheckIcon /> {STRINGS.accessAllowed}
            </span>
          ) : (
            <button type="button" className="primary" onClick={onRequest} disabled={trusted === null}>
              {STRINGS.accessButton}
            </button>
          )}
        </div>
      </div>
      <p className="footnote">{trusted ? STRINGS.accessAllowedHint : STRINGS.accessHint}</p>
    </section>
  )
}
