import { LANGUAGE_CODES, LANGUAGES, type LanguageCode, type LanguagePair } from '@layout-fixer/core/languages'
import { type MessageKey, t } from '../../platform/i18n'

const LABELS: readonly [MessageKey, MessageKey] = ['firstLanguage', 'secondLanguage']

interface Props {
  readonly value: LanguagePair
  readonly onChange: (value: LanguagePair) => void
}

/** Picking the language already chosen in the other slot swaps the two, so the pair stays valid. */
function withLanguage(pair: LanguagePair, slot: 0 | 1, code: LanguageCode): LanguagePair {
  const other = pair[slot === 0 ? 1 : 0]
  if (code === other) return [pair[1], pair[0]]
  return slot === 0 ? [code, other] : [other, code]
}

export function LanguagePairPicker({ value, onChange }: Props) {
  return (
    <>
      {([0, 1] as const).map((slot) => (
        <label key={slot} className="row">
          <span className="row-label">{t(LABELS[slot])}</span>
          <select
            value={value[slot]}
            onChange={(event) => onChange(withLanguage(value, slot, event.target.value as LanguageCode))}
          >
            {LANGUAGE_CODES.map((code) => (
              <option key={code} value={code} lang={code}>
                {LANGUAGES[code].name}
              </option>
            ))}
          </select>
        </label>
      ))}
    </>
  )
}
