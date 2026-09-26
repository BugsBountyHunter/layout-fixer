import { t } from '../platform/i18n'
import type { Settings } from '../platform/settings'
import type { FixResult } from './replace'
import { showToast } from './toast'

/** 'shown' ignores the setting: the toast is the only place the fixed text appears. */
export function notify(result: FixResult, { showToasts }: Settings): void {
  switch (result.status) {
    case 'replaced':
      break
    case 'copied':
      if (showToasts) showToast({ message: t('toastCopied'), text: result.text })
      break
    case 'shown':
      showToast({ message: t('toastShown'), text: result.text, durationMs: 10_000 })
      break
    case 'empty':
      if (showToasts) showToast({ message: t('toastEmpty'), durationMs: 2500 })
      break
  }
}
