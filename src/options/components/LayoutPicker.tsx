import { convertBetween } from '../../core/converter'
import type { ArabicLayoutId } from '../../core/layouts'
import { type MessageKey, t } from '../../platform/i18n'
import { ARABIC_LAYOUT_CHOICES, type ArabicLayoutChoice } from '../../platform/settings'
import { CheckIcon } from '../../ui/icons'
import { LAYOUT_NAME } from '../../ui/layoutLabels'

const EXAMPLE_WORD = 'مرحبا'

const COPY: Readonly<Record<ArabicLayoutChoice, { name: MessageKey; hint: MessageKey }>> = {
  auto: { name: 'layoutAuto', hint: 'layoutAutoHint' },
  'ar-pc': { name: 'layoutPc', hint: 'layoutPcHint' },
  'ar-mac': { name: 'layoutMac', hint: 'layoutMacHint' },
}

interface Props {
  readonly value: ArabicLayoutChoice
  readonly autoLayout: ArabicLayoutId
  readonly onChange: (value: ArabicLayoutChoice) => void
}

export function LayoutPicker({ value, autoLayout, onChange }: Props) {
  return (
    <fieldset className="choices">
      <legend className="visually-hidden">{t('layoutSectionTitle')}</legend>
      {ARABIC_LAYOUT_CHOICES.map((choice) => {
        const layout = choice === 'auto' ? autoLayout : choice
        const keys = convertBetween(EXAMPLE_WORD, layout, 'en-us')
        return (
          <label key={choice} className="row choice">
            <input
              type="radio"
              name="arabic-layout"
              value={choice}
              checked={value === choice}
              onChange={() => onChange(choice)}
            />
            <span className="choice-body">
              <span className="row-label">{t(COPY[choice].name)}</span>
              <span className="row-detail">
                {choice === 'auto' ? t('layoutAutoHint', [t(LAYOUT_NAME[autoLayout])]) : t(COPY[choice].hint)}
              </span>
              <span className="example">{t('layoutExample', [keys, EXAMPLE_WORD])}</span>
            </span>
            <span className="choice-check">
              <CheckIcon />
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
