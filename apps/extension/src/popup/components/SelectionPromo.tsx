import { t } from '../../platform/i18n'
import { openSelectionSetting } from '../navigation'

export function SelectionPromo() {
  return (
    <p className="promo">
      <span>{t('selectionPromo')}</span>
      <button type="button" className="link" onClick={openSelectionSetting}>
        {t('turnOn')}
      </button>
    </p>
  )
}
