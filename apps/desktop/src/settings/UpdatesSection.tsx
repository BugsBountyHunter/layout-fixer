import { SwitchRow } from '@layout-fixer/ui/SwitchRow'
import { useMessages } from '../i18n/react'
import type { Updater } from '../update/useUpdater'

interface Props {
  readonly automatic: boolean
  readonly onAutomaticChange: (on: boolean) => void
  readonly updater: Updater
}

export function UpdatesSection({ automatic, onAutomaticChange, updater }: Props) {
  const m = useMessages()
  const { status } = updater
  const busy = status.kind === 'checking' || status.kind === 'installing'
  const statusText = {
    idle: null,
    checking: m.updateChecking,
    current: m.updateCurrent,
    available: status.kind === 'available' ? m.updateAvailable(status.version) : null,
    installing: m.updateInstalling,
    failed: m.updateFailed,
  }[status.kind]

  return (
    <section className="section" aria-labelledby="updates-title">
      <h2 id="updates-title">{m.updatesSection}</h2>
      <div className="group">
        <SwitchRow label={m.autoUpdate} checked={automatic} onChange={onAutomaticChange} />
        <div className="row">
          <span className="row-label" aria-live="polite">
            {statusText ?? (updater.version ? m.appVersion(updater.version) : '')}
          </span>
          {status.kind === 'available' ? (
            <button type="button" className="primary" onClick={updater.install}>
              {m.updateInstall}
            </button>
          ) : (
            <button type="button" onClick={updater.checkNow} disabled={busy}>
              {m.updateCheckNow}
            </button>
          )}
        </div>
      </div>
      <p className="footnote">
        {updater.version && statusText ? `${m.appVersion(updater.version)} · ` : ''}
        {m.updateHint}
      </p>
    </section>
  )
}
