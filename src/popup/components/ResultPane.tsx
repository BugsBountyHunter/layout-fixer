import type { ArabicLayoutId } from '../../core/layouts'
import { t } from '../../platform/i18n'
import { CheckIcon, CopyIcon } from '../../ui/icons'
import { LAYOUT_NAME } from '../../ui/layoutLabels'
import { openSettings } from '../navigation'

interface Props {
  readonly output: string
  readonly layout: ArabicLayoutId
  readonly copied: boolean
  readonly onCopy: () => void
}

export function ResultPane({ output, layout, copied, onCopy }: Props) {
  return (
    <section className="pane-target" aria-labelledby="output-label">
      <span id="output-label" className="visually-hidden">
        {t('outputLabel')}
      </span>
      <output htmlFor="input" dir="auto" className={output ? 'output' : 'output empty'} aria-live="polite">
        {output || t('outputEmpty')}
      </output>
      <div className="pane-actions">
        <button type="button" className="link layout-note" onClick={openSettings}>
          {t('popupLayout', [t(LAYOUT_NAME[layout])])}
        </button>
        <button type="button" className="primary" onClick={onCopy} disabled={!output}>
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          {copied ? t('copied') : t('copy')}
        </button>
      </div>
    </section>
  )
}
