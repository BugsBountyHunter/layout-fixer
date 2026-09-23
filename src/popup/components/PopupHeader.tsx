import { t } from '../../platform/i18n'
import { SettingsIcon } from '../../ui/icons'
import { openSettings } from '../navigation'

export function PopupHeader() {
  return (
    <header className="header">
      <img src="/icons/icon-32.png" alt="" width={20} height={20} />
      <h1>{t('extName')}</h1>
      <button
        type="button"
        className="icon"
        onClick={openSettings}
        aria-label={t('openSettings')}
        title={t('openSettings')}
      >
        <SettingsIcon />
      </button>
    </header>
  )
}
