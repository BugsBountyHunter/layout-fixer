import { t } from '../../platform/i18n'
import { CheckIcon } from '../../ui/icons'

export function PageHeader({ saved }: { readonly saved: boolean }) {
  return (
    <header className="page-header">
      <img src="/icons/icon-48.png" alt="" width={36} height={36} />
      <div className="page-title">
        <h1>{t('extName')}</h1>
        <p>{t('version', [chrome.runtime.getManifest().version])}</p>
      </div>
      <p className={saved ? 'saved visible' : 'saved'} role="status" aria-live="polite">
        {saved && (
          <>
            <CheckIcon size={14} />
            {t('saved')}
          </>
        )}
      </p>
    </header>
  )
}
