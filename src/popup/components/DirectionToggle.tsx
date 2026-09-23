import type { Direction } from '../../core/converter'
import { type MessageKey, t } from '../../platform/i18n'

export type DirectionChoice = 'auto' | Direction

const OPTIONS: ReadonlyArray<{ value: DirectionChoice; label: MessageKey }> = [
  { value: 'auto', label: 'directionAuto' },
  { value: 'en→ar', label: 'directionEnAr' },
  { value: 'ar→en', label: 'directionArEn' },
]

interface Props {
  readonly value: DirectionChoice
  readonly onChange: (value: DirectionChoice) => void
}

export function DirectionToggle({ value, onChange }: Props) {
  return (
    <fieldset className="segmented">
      <legend className="visually-hidden">{t('directionLabel')}</legend>
      {OPTIONS.map((option) => (
        <label key={option.value} className="segment">
          <input
            type="radio"
            name="direction"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>{t(option.label)}</span>
        </label>
      ))}
    </fieldset>
  )
}
