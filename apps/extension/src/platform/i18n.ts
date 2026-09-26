export type MessageKey = keyof typeof import('../../public/_locales/en/messages.json')

/** Falls back to the key so tests and non-extension contexts still render something readable. */
export function t(key: MessageKey, substitutions?: string[]): string {
  return globalThis.chrome?.i18n?.getMessage(key, substitutions) || key
}

/**
 * Read from the locale file actually in use rather than `@@bidi_dir`, which follows the
 * browser UI language and disagrees when the extension falls back to another locale.
 */
export function uiDirection(): 'rtl' | 'ltr' {
  return t('textDirection') === 'rtl' ? 'rtl' : 'ltr'
}

export function uiLanguage(): string {
  return globalThis.chrome?.i18n?.getUILanguage?.() ?? navigator.language
}
