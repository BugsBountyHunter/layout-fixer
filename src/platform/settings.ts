import { DEFAULT_LANGUAGE_PAIR, type LanguagePair, parseLanguagePair } from '../core/languages'
import { type ArabicLayoutId, defaultLayout } from '../core/layouts'

export type ArabicLayoutChoice = 'auto' | ArabicLayoutId

export interface Settings {
  /** The two languages text is converted between. */
  readonly languages: LanguagePair
  readonly arabicLayout: ArabicLayoutChoice
  /** Messages shown on the page after copying or when nothing is selected. */
  readonly showToasts: boolean
  /** Button next to selected text. Needs optional site access, so it is off until the user opts in. */
  readonly selectionButton: boolean
}

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  languages: DEFAULT_LANGUAGE_PAIR,
  arabicLayout: 'auto',
  showToasts: true,
  selectionButton: false,
})

export const ARABIC_LAYOUT_CHOICES: readonly ArabicLayoutChoice[] = ['auto', 'ar-pc', 'ar-mac']

const STORAGE_KEY = 'settings'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Storage is shared with other extension pages and synced across devices, so every field is re-validated. */
export function parseSettings(raw: unknown): Settings {
  const data = isRecord(raw) ? raw : {}
  return {
    languages: parseLanguagePair(data.languages),
    arabicLayout: ARABIC_LAYOUT_CHOICES.includes(data.arabicLayout as ArabicLayoutChoice)
      ? (data.arabicLayout as ArabicLayoutChoice)
      : DEFAULT_SETTINGS.arabicLayout,
    showToasts: typeof data.showToasts === 'boolean' ? data.showToasts : DEFAULT_SETTINGS.showToasts,
    selectionButton:
      typeof data.selectionButton === 'boolean' ? data.selectionButton : DEFAULT_SETTINGS.selectionButton,
  }
}

export function resolveLayout(settings: Settings, isMac: boolean): ArabicLayoutId {
  return settings.arabicLayout === 'auto' ? defaultLayout(isMac) : settings.arabicLayout
}

export async function loadSettings(): Promise<Settings> {
  const storage = globalThis.chrome?.storage?.sync
  if (!storage) return DEFAULT_SETTINGS
  try {
    const stored = await storage.get(STORAGE_KEY)
    return parseSettings(stored[STORAGE_KEY])
  } catch (error) {
    console.warn('[layout-fixer] Could not read settings; using defaults:', error)
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = parseSettings({ ...(await loadSettings()), ...patch })
  await globalThis.chrome?.storage?.sync.set({ [STORAGE_KEY]: next })
  return next
}

export function watchSettings(onChange: (settings: Settings) => void): () => void {
  const events = globalThis.chrome?.storage?.onChanged
  if (!events) return () => {}

  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'sync' && STORAGE_KEY in changes) onChange(parseSettings(changes[STORAGE_KEY].newValue))
  }
  events.addListener(listener)
  return () => events.removeListener(listener)
}
