import { type ArabicLayoutId, defaultLayout } from '@layout-fixer/core/layouts'

export type ArabicLayoutChoice = 'auto' | ArabicLayoutId

export interface DesktopSettings {
  readonly arabicLayout: ArabicLayoutChoice
}

export const DEFAULT_SETTINGS: DesktopSettings = Object.freeze({ arabicLayout: 'auto' })

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
  return {
    arabicLayout: ARABIC_LAYOUT_CHOICES.includes(layout) ? layout : DEFAULT_SETTINGS.arabicLayout,
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
