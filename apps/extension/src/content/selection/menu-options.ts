import { convert, type Direction, detectDirection } from '@layout-fixer/core/converter'
import { LANGUAGES, type LanguageCode } from '@layout-fixer/core/languages'
import type { ArabicLayoutId } from '@layout-fixer/core/layouts'

export interface MenuOption {
  readonly direction: Direction
  readonly language: LanguageCode
  /** Native language name, the same in every UI language. */
  readonly name: string
  readonly chip: string
  readonly preview: string
}

const TARGET: Readonly<Record<Direction, LanguageCode>> = { 'en→ar': 'ar', 'ar→en': 'en' }

/** Languages the selection can be fixed into, most likely first; options that change nothing are left out. */
export function menuOptions(text: string, layout: ArabicLayoutId): MenuOption[] {
  const detected = detectDirection(text)
  const directions: Direction[] = detected === 'en→ar' ? ['en→ar', 'ar→en'] : ['ar→en', 'en→ar']
  return directions
    .map((direction) => {
      const language = TARGET[direction]
      const { name, chip } = LANGUAGES[language]
      return { direction, language, name, chip, preview: convert(text, { direction, layout }) }
    })
    .filter((option) => option.preview !== text)
}
