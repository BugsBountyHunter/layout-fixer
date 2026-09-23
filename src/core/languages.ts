import type { Script } from './scripts'

export interface Language {
  /** Native name, shown the same in every UI language. */
  readonly name: string
  readonly chip: string
  readonly script: Script
}

/** Languages the user can pair. v1 ships Arabic and English; new ones need layouts first. */
export const LANGUAGES = Object.freeze({
  ar: { name: 'العربية', chip: 'ع', script: 'Arab' },
  en: { name: 'English', chip: 'EN', script: 'Latn' },
}) satisfies Readonly<Record<string, Language>>

export type LanguageCode = keyof typeof LANGUAGES
export type LanguagePair = readonly [LanguageCode, LanguageCode]

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as readonly LanguageCode[]
export const DEFAULT_LANGUAGE_PAIR: LanguagePair = Object.freeze(['ar', 'en'] as const)

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && Object.hasOwn(LANGUAGES, value)
}

/** Exactly two different, known languages; anything else falls back to the default pair. */
export function parseLanguagePair(raw: unknown): LanguagePair {
  if (!Array.isArray(raw) || raw.length !== 2) return DEFAULT_LANGUAGE_PAIR
  const [first, second] = raw
  return isLanguageCode(first) && isLanguageCode(second) && first !== second ? [first, second] : DEFAULT_LANGUAGE_PAIR
}
