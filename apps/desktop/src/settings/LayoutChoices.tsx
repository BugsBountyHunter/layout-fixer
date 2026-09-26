import { convertBetween } from '@layout-fixer/core/converter'
import type { ArabicLayoutId } from '@layout-fixer/core/layouts'
import { CheckIcon } from '@layout-fixer/ui/icons'
import type { Messages } from '../i18n'
import { useMessages } from '../i18n/react'
import { ARABIC_LAYOUT_CHOICES, type ArabicLayoutChoice } from '../platform/settings'

const EXAMPLE_WORD = 'مرحبا'

function copyFor(m: Messages, choice: ArabicLayoutChoice, autoLayout: ArabicLayoutId): { name: string; hint: string } {
  const name: Readonly<Record<ArabicLayoutId, string>> = { 'ar-pc': m.layoutPc, 'ar-mac': m.layoutMac }
  if (choice === 'auto') return { name: m.layoutAuto, hint: m.layoutAutoHint(name[autoLayout]) }
  return { name: name[choice], hint: choice === 'ar-pc' ? m.layoutPcHint : m.layoutMacHint }
}

interface Props {
  readonly value: ArabicLayoutChoice
  readonly autoLayout: ArabicLayoutId
  readonly onChange: (value: ArabicLayoutChoice) => void
}

export function LayoutChoices({ value, autoLayout, onChange }: Props) {
  const m = useMessages()
  return (
    <fieldset className="choices">
      <legend className="visually-hidden">{m.layoutSection}</legend>
      {ARABIC_LAYOUT_CHOICES.map((choice) => {
        const { name, hint } = copyFor(m, choice, autoLayout)
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
              <span className="example">{m.layoutExample(keys, EXAMPLE_WORD)}</span>
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
