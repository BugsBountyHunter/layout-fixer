import { t } from '../../platform/i18n'

export function PrivacyNote() {
  return (
    <section className="privacy" aria-labelledby="privacy-title">
      <h2 id="privacy-title">{t('privacyTitle')}</h2>
      <p>{t('privacyBody')}</p>
    </section>
  )
}
