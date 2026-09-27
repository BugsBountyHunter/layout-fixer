import { CheckIcon } from '@layout-fixer/ui/icons'
import { useMessages } from '../i18n/react'
import type { GnomeSwitching } from '../platform/gnomeSwitching'
import type { GnomeSwitchingState } from './useNative'

type Messages = ReturnType<typeof useMessages>

function hint(m: Messages, status: GnomeSwitching): string {
  return {
    off: m.gnomeOffHint,
    on: m.gnomeOnHint,
    'log-out': m.gnomeLogOutHint,
    'extensions-off': m.gnomeExtensionsOffHint,
    incompatible: m.gnomeIncompatibleHint,
  }[status]
}

function Status({ state }: { readonly state: GnomeSwitchingState }) {
  const m = useMessages()
  switch (state.status) {
    case 'on':
      return (
        <span className="status allowed">
          <CheckIcon /> {m.gnomeOn}
        </span>
      )
    case 'off':
      return (
        <button type="button" className="primary" onClick={state.enable} disabled={state.busy}>
          {m.gnomeInstall}
        </button>
      )
    case 'log-out':
      return <span className="status">{m.gnomeLogOut}</span>
    case 'extensions-off':
      return <span className="status">{m.gnomeExtensionsOff}</span>
    default:
      return <span className="status">{m.gnomeIncompatible}</span>
  }
}

/** GNOME only: apps can switch the keyboard layout there only through a GNOME Shell extension. */
export function GnomeSection({ state }: { readonly state: GnomeSwitchingState }) {
  const m = useMessages()
  if (!state.status) return null
  return (
    <section className="section" aria-labelledby="gnome-title">
      <h2 id="gnome-title">{m.gnomeSection}</h2>
      <div className="group">
        <div className="row">
          <span className="row-label">{m.gnomeLabel}</span>
          <Status state={state} />
        </div>
      </div>
      <p className="footnote">{hint(m, state.status)}</p>
      {state.failed && (
        <p className="footnote notice-text" role="alert">
          {m.gnomeFailed}
        </p>
      )}
    </section>
  )
}
