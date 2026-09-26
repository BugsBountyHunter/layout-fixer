import { ShortcutKeys } from '@layout-fixer/ui/ShortcutKeys'
import { formatAccelerator } from '../platform/accelerator'
import { STRINGS } from './strings'
import type { ShortcutInfo } from './useNative'

interface Props {
  readonly info: ShortcutInfo | null
  readonly isMac: boolean
}

export function ShortcutSection({ info, isMac }: Props) {
  return (
    <section className="section" aria-labelledby="shortcut-title">
      <h2 id="shortcut-title">{STRINGS.shortcutSection}</h2>
      <div className="group">
        <div className="row">
          <span className="row-label">{STRINGS.shortcutLabel}</span>
          {info && <ShortcutKeys keys={formatAccelerator(info.accelerator, isMac)} />}
        </div>
      </div>
      <p className="footnote">{info && !info.registered ? STRINGS.shortcutTaken : STRINGS.shortcutHint}</p>
    </section>
  )
}
