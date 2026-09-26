import { convert } from '@layout-fixer/core/converter'
import { defaultLayout } from '@layout-fixer/core/layouts'

export interface Sample {
  readonly typed: string
  readonly fixed: string
}

export interface ShortcutEventLike {
  readonly code: string
  readonly altKey: boolean
  readonly shiftKey: boolean
  readonly ctrlKey: boolean
  readonly metaKey: boolean
}

/** Text as it comes out when the wrong layout is active. Outputs are computed, never hard-coded. */
export const SAMPLE_INPUTS: readonly string[] = Object.freeze(['hgsghl ugd;l', 'اثممخ صخقمي', ';dt phg;?'])

export function buildSamples(inputs: readonly string[] = SAMPLE_INPUTS): readonly Sample[] {
  return inputs.map((typed) => ({ typed, fixed: convert(typed) }))
}

/** Same layout choice as the extension's "Automatic" setting: the macOS Arabic layout on Macs, PC elsewhere. */
export function fixText(text: string, { isMac = false }: { readonly isMac?: boolean } = {}): string {
  return text.trim() === '' ? text : convert(text, { layout: defaultLayout(isMac) })
}

/** Matches by physical key: on macOS ⌥⇧F produces "Ï", so `event.key` can't be used. */
export function isFixShortcut(event: ShortcutEventLike): boolean {
  return event.code === 'KeyF' && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey
}

export function shortcutKeys(isMac: boolean): readonly string[] {
  return isMac ? ['⌥', '⇧', 'F'] : ['Alt', 'Shift', 'F']
}
