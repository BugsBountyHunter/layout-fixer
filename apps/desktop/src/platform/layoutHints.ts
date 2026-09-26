import type { ArabicLayoutId } from '@layout-fixer/core/layouts'

/** An enabled OS keyboard layout, from the `list_layouts` command. */
export interface LayoutInfo {
  readonly id: string
  /** Primary language without region (`en`, `ar`), when the OS says. */
  readonly language: string | null
  /** Set when the layout is one of our Arabic layouts. */
  readonly arabicLayout: ArabicLayoutId | null
}

/** The languages the fix switches between. */
export type SwitchLanguage = 'ar' | 'en'
const SWITCH_LANGUAGES: readonly SwitchLanguage[] = ['ar', 'en']

export interface LayoutHints {
  /** Languages with no enabled layout, so switching to them can't happen. */
  readonly missing: readonly SwitchLanguage[]
  /** The Arabic layout the computer has, when it isn't the one chosen in Settings. */
  readonly suggestedArabicLayout: ArabicLayoutId | null
}

const NO_HINTS: LayoutHints = Object.freeze({ missing: [], suggestedArabicLayout: null })

/** `null` or an empty list means the OS list is unknown (unsupported system, failed read): no hints. */
export function layoutHints(layouts: readonly LayoutInfo[] | null, chosen: ArabicLayoutId): LayoutHints {
  if (!layouts || layouts.length === 0) return NO_HINTS
  const missing = SWITCH_LANGUAGES.filter((language) => !layouts.some((layout) => layout.language === language))
  const known = layouts.flatMap((layout) => (layout.arabicLayout ? [layout.arabicLayout] : []))
  const suggestedArabicLayout = known.length > 0 && !known.includes(chosen) ? known[0] : null
  return { missing, suggestedArabicLayout }
}

function isArabicLayoutId(value: unknown): value is ArabicLayoutId {
  return value === 'ar-pc' || value === 'ar-mac'
}

/** Re-validates the command's answer; anything unexpected is dropped rather than trusted. */
export function parseLayoutList(raw: unknown): readonly LayoutInfo[] | null {
  if (!Array.isArray(raw)) return null
  return raw.flatMap((item: unknown): LayoutInfo[] => {
    if (typeof item !== 'object' || item === null) return []
    const { id, language, arabicLayout } = item as Record<string, unknown>
    if (typeof id !== 'string') return []
    return [
      {
        id,
        language: typeof language === 'string' ? language : null,
        arabicLayout: isArabicLayoutId(arabicLayout) ? arabicLayout : null,
      },
    ]
  })
}
