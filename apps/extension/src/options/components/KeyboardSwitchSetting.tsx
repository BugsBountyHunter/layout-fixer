import { SwitchRow } from '@layout-fixer/ui/SwitchRow'
import { useState } from 'react'
import type { DesktopStatus } from '../../platform/desktop-app'
import { t } from '../../platform/i18n'
import { releaseDesktopAccess, requestDesktopAccess, useDesktopStatus } from '../../ui/desktopApp'

interface Props {
  readonly enabled: boolean
  readonly onChange: (enabled: boolean) => Promise<void>
}

function StatusLine({ status }: { readonly status: DesktopStatus | null }) {
  if (!status) return null
  if (status.kind === 'connected') {
    return (
      <p className="row row-detail" data-testid="desktop-status">
        {t('desktopConnected', [status.version])}
      </p>
    )
  }
  return (
    <p className="row notice" role="alert" data-testid="desktop-status">
      {t('desktopMissing')}{' '}
      <a href={t('desktopDownloadUrl')} target="_blank" rel="noreferrer">
        {t('desktopDownload')}
      </a>
    </p>
  )
}

export function KeyboardSwitchSetting({ enabled, onChange }: Props) {
  const [denied, setDenied] = useState(false)
  /** Shown while the permission prompt and save are in flight, so the switch responds at once. */
  const [pending, setPending] = useState<boolean | null>(null)
  const status = useDesktopStatus(enabled && pending === null)

  function toggle(on: boolean) {
    setDenied(false)
    setPending(on)
    if (!on) {
      void onChange(false)
        .then(releaseDesktopAccess)
        .finally(() => setPending(null))
      return
    }
    void requestDesktopAccess()
      .then(async (allowed) => {
        if (allowed) await onChange(true)
        else setDenied(true)
      })
      .finally(() => setPending(null))
  }

  return (
    <>
      <SwitchRow label={t('desktopSwitchLabel')} checked={pending ?? enabled} onChange={toggle} />
      {denied && (
        <p className="row notice" role="alert">
          {t('desktopPermissionDenied')}
        </p>
      )}
      <StatusLine status={status} />
    </>
  )
}
