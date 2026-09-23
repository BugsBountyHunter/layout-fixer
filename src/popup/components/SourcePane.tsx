import type { KeyboardEvent, RefObject } from 'react'
import { t } from '../../platform/i18n'
import { CloseIcon } from '../../ui/icons'

interface Props {
  readonly value: string
  readonly inputRef: RefObject<HTMLTextAreaElement | null>
  readonly onChange: (value: string) => void
  readonly onClear: () => void
  readonly onSubmit: () => void
}

export function SourcePane({ value, inputRef, onChange, onClear, onSubmit }: Props) {
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="pane-source">
      <label className="visually-hidden" htmlFor="input">
        {t('inputLabel')}
      </label>
      <textarea
        id="input"
        ref={inputRef}
        dir="auto"
        rows={3}
        // biome-ignore lint/a11y/noAutofocus: the popup exists to take pasted text; focusing it is the expected first step.
        autoFocus
        spellCheck={false}
        value={value}
        placeholder={t('inputPlaceholder')}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button type="button" className="icon clear" onClick={onClear} aria-label={t('clear')} title={t('clear')}>
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  )
}
