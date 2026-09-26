import { t } from '../../platform/i18n'
import { ShortcutKeys } from '../../ui/ShortcutKeys'
import type { Platform } from '../../ui/usePlatform'

export function ShortcutHint({ hasShortcuts, shortcutKeys, openShortcutSettings }: Platform) {
  if (!hasShortcuts) return null

  return (
    <footer className="hint">
      {shortcutKeys.length > 0 ? (
        <p>
          {t('shortcutHint')}{' '}
          <button type="button" className="link kbd-button" onClick={openShortcutSettings}>
            <ShortcutKeys keys={shortcutKeys} />
          </button>
        </p>
      ) : (
        <button type="button" className="link" onClick={openShortcutSettings}>
          {t('shortcutNotSet')}
        </button>
      )}
      <p className="muted">{t('contextMenuHint')}</p>
    </footer>
  )
}
