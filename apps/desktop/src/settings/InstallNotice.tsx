import { invoke } from '@tauri-apps/api/core'
import { useMessages } from '../i18n/react'
import type { InstallLocation } from './useNative'

/** Shown until the app runs from Applications; without that, updates and "Open at login" can't work. */
export function InstallNotice({ location }: { readonly location: InstallLocation }) {
  const m = useMessages()
  if (location === 'installed') return null

  const openApplications = () => {
    invoke('reveal_applications_folder').catch((error: unknown) =>
      console.error('[layout-fixer] Could not open the Applications folder:', error),
    )
  }

  return (
    <section className="section" aria-labelledby="move-title" data-testid="install-notice">
      <h2 id="move-title">{m.moveTitle}</h2>
      <div className="group">
        <div className="row notice-row">
          <p className="notice-text" role="alert">
            {location === 'disk-image' ? m.moveDiskImage : m.moveTranslocated}
          </p>
          <button type="button" className="primary" onClick={openApplications}>
            {m.moveButton}
          </button>
        </div>
      </div>
    </section>
  )
}
