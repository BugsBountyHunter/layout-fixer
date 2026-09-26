import { convertBetween } from '@layout-fixer/core/converter'
import type { ArabicLayoutId } from '@layout-fixer/core/layouts'
import { CheckIcon } from '@layout-fixer/ui/icons'
import { ARABIC_LAYOUT_CHOICES, type ArabicLayoutChoice } from '../platform/settings'
import { STRINGS } from './strings'

const EXAMPLE_WORD = 'مرحبا'

const NAME: Readonly<Record<ArabicLayoutId, string>> = { 'ar-pc': STRINGS.layoutPc, 'ar-mac': STRINGS.layoutMac }

function copyFor(choice: ArabicLayoutChoice, autoLayout: ArabicLayoutId): { name: string; hint: string } {
  if (choice === 'auto') return { name: STRINGS.layoutAuto, hint: STRINGS.layoutAutoHint(NAME[autoLayout]) }
  return { name: NAME[choice], hint: choice === 'ar-pc' ? STRINGS.layoutPcHint : STRINGS.layoutMacHint }
}

interface Props {
  readonly value: ArabicLayoutChoice
  readonly autoLayout: ArabicLayoutId
  readonly onChange: (value: ArabicLayoutChoice) => void
}

export function LayoutChoices({ value, autoLayout, onChange }: Props) {
  return (
    <fieldset className="choices">
      <legend className="visually-hidden">{STRINGS.layoutSection}</legend>
      {ARABIC_LAYOUT_CHOICES.map((choice) => {
        const { name, hint } = copyFor(choice, autoLayout)
        const keys = convertBetween(EXAMPLE_WORD, choice === 'auto' ? autoLayout : choice, 'en-us')
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
              <span className="row-label">{name}</span>
              <span className="row-detail">{hint}</span>
              <span className="example">{STRINGS.layoutExample(keys, EXAMPLE_WORD)}</span>
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
