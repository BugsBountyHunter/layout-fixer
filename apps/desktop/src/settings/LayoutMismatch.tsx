import type { ArabicLayoutId } from '@layout-fixer/core/layouts'
import { useMessages } from '../i18n/react'

interface Props {
  readonly suggested: ArabicLayoutId | null
  readonly onUse: (layout: ArabicLayoutId) => void
}

/** The chosen Arabic layout isn't the one the computer has, so fixes would use the wrong key map. */
export function LayoutMismatch({ suggested, onUse }: Props) {
  const m = useMessages()
  if (!suggested) return null
  const name = suggested === 'ar-pc' ? m.layoutPc : m.layoutMac
  return (
    <div className="row notice-row" data-testid="layout-mismatch">
      <p className="notice-text" role="note">
        {m.layoutMismatch(name)}
      </p>
      <button type="button" onClick={() => onUse(suggested)}>
        {m.layoutMismatchUse(name)}
      </button>
    </div>
  )
}
