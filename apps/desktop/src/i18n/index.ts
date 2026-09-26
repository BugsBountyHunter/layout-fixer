import { AR } from './ar'
import { EN, type Messages } from './en'

export type { Messages } from './en'

export type Language = 'en' | 'ar'
export type LanguageChoice = 'auto' | Language

export const LANGUAGE_CHOICES: readonly LanguageChoice[] = ['auto', 'en', 'ar']

const MESSAGES: Readonly<Record<Language, Messages>> = { en: EN, ar: AR }

/** Each language is named in itself, so it can be found whatever the current UI language. */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = { en: 'English', ar: 'العربية' }

export function resolveLanguage(choice: LanguageChoice, systemLanguages: readonly string[]): Language {
  if (choice !== 'auto') return choice
  const preferred = systemLanguages.find((tag) => /^(ar|en)\b/i.test(tag))
  return preferred?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function messagesFor(language: Language): Messages {
  return MESSAGES[language]
}

export function directionOf(language: Language): 'rtl' | 'ltr' {
  return language === 'ar' ? 'rtl' : 'ltr'
}
