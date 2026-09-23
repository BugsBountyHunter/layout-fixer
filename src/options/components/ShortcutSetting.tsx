import { t } from '../../platform/i18n'
import { ShortcutKeys } from '../../ui/ShortcutKeys'
import type { Platform } from '../../ui/usePlatform'

export function ShortcutSetting({ shortcutKeys, openShortcutSettings }: Platform) {
  return (
    <div className="row">
      {shortcutKeys.length > 0 ? (
        <ShortcutKeys keys={shortcutKeys} />
      ) : (
        <span className="muted">{t('shortcutNotSet')}</span>
      )}
      <button type="button" onClick={openShortcutSettings}>
        {t('changeShortcut')}
      </button>
    </div>
  )
}
