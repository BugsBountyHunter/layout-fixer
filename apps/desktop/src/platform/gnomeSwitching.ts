/** GNOME only: whether Layout Fixer's GNOME Shell extension can switch the keyboard layout. */
export type GnomeSwitching = 'off' | 'on' | 'log-out' | 'extensions-off' | 'incompatible'

const STATES: readonly GnomeSwitching[] = ['off', 'on', 'log-out', 'extensions-off', 'incompatible']

/** `null` outside GNOME (`unavailable`) and for anything unexpected, so Settings shows nothing. */
export function parseGnomeSwitching(raw: unknown): GnomeSwitching | null {
  return STATES.find((state) => state === raw) ?? null
}
