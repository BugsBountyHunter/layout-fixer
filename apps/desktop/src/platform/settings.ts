import { type ArabicLayoutId, defaultLayout } from '@layout-fixer/core/layouts'
import { LANGUAGE_CHOICES, type LanguageChoice } from '../i18n'
import { DEFAULT_SHORTCUT, isValidShortcut } from './shortcut'

export type ArabicLayoutChoice = 'auto' | ArabicLayoutId

export interface DesktopSettings {
  readonly arabicLayout: ArabicLayoutChoice
  readonly language: LanguageChoice
  /** Short messages when nothing is selected or the text can't be fixed. */
  readonly showMessages: boolean
  /** Tauri accelerator, e.g. "Alt+Shift+F". The native side registers it at launch. */
  readonly shortcut: string
  /** Set once the first-run welcome has been dismissed. */
  readonly welcomed: boolean
}

export const DEFAULT_SETTINGS: DesktopSettings = Object.freeze({
  arabicLayout: 'auto',
  language: 'auto',
  showMessages: true,
  shortcut: DEFAULT_SHORTCUT,
  welcomed: false,
})

export const ARABIC_LAYOUT_CHOICES: readonly ArabicLayoutChoice[] = ['auto', 'ar-pc', 'ar-mac']

/** The subset of the Tauri store this module needs, so tests can pass an in-memory one. */
export interface SettingsStore {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  save(): Promise<void>
}

const STORAGE_KEY = 'settings'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The settings file is user-editable on disk, so every field is re-validated. */
export function parseSettings(raw: unknown): DesktopSettings {
  const data = isRecord(raw) ? raw : {}
  const layout = data.arabicLayout as ArabicLayoutChoice
  const language = data.language as LanguageChoice
  return {
    arabicLayout: ARABIC_LAYOUT_CHOICES.includes(layout) ? layout : DEFAULT_SETTINGS.arabicLayout,
    language: LANGUAGE_CHOICES.includes(language) ? language : DEFAULT_SETTINGS.language,
    showMessages: typeof data.showMessages === 'boolean' ? data.showMessages : DEFAULT_SETTINGS.showMessages,
    shortcut: isValidShortcut(data.shortcut) ? data.shortcut : DEFAULT_SETTINGS.shortcut,
    welcomed: typeof data.welcomed === 'boolean' ? data.welcomed : DEFAULT_SETTINGS.welcomed,
  }
}

export function resolveLayout(settings: DesktopSettings, isMac: boolean): ArabicLayoutId {
  return settings.arabicLayout === 'auto' ? defaultLayout(isMac) : settings.arabicLayout
}

export async function loadSettings(store: SettingsStore): Promise<DesktopSettings> {
  try {
    return parseSettings(await store.get(STORAGE_KEY))
  } catch (error) {
    console.warn('[layout-fixer] Could not read settings; using defaults:', error)
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(store: SettingsStore, patch: Partial<DesktopSettings>): Promise<DesktopSettings> {
  const next = parseSettings({ ...(await loadSettings(store)), ...patch })
  await store.set(STORAGE_KEY, next)
  await store.save()
  return next
}
