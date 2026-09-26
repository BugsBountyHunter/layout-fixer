import { useState } from 'react'
import { t } from '../../platform/i18n'
import { releaseSiteAccess, requestSiteAccess, useSiteAccess } from '../../ui/siteAccess'
import { SwitchRow } from './SwitchRow'

interface Props {
  readonly enabled: boolean
  readonly onChange: (enabled: boolean) => Promise<void>
}

export function SelectionButtonSetting({ enabled, onChange }: Props) {
  const granted = useSiteAccess()
  const [denied, setDenied] = useState(false)
  /** Shown while the permission prompt and save are in flight, so the switch responds at once. */
  const [pending, setPending] = useState<boolean | null>(null)

  function toggle(on: boolean) {
    setDenied(false)
    setPending(on)
    if (!on) {
      void onChange(false)
        .then(releaseSiteAccess)
        .finally(() => setPending(null))
      return
    }
    void requestSiteAccess()
      .then(async (allowed) => {
        if (allowed) await onChange(true)
        else setDenied(true)
      })
      .finally(() => setPending(null))
  }

  return (
    <>
      <SwitchRow label={t('selectionSectionLabel')} checked={pending ?? (enabled && granted)} onChange={toggle} />
      {denied && (
        <p className="row notice" role="alert">
          {t('selectionPermissionDenied')}
        </p>
      )}
    </>
  )
}
