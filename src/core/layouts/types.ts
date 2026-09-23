import type { Script } from '../scripts'
import type { KeyCode } from './keys'

/** What a key types without and with Shift; `null` means the key is left unmapped and input is kept. */
export type KeyOutput = readonly [base: string | null, shift: string | null]

export interface KeyboardLayout {
  readonly id: string
  /** BCP 47 language tag. */
  readonly language: string
  /** Native name shown in the UI. */
  readonly label: string
  /** 1–3 character badge for compact UI. */
  readonly chip: string
  readonly script: Script
  readonly platform: 'pc' | 'mac' | 'any'
  readonly keys: Readonly<Partial<Record<KeyCode, KeyOutput>>>
  /** Extra characters read as a key press (unshifted), e.g. Arabic-Indic digits typed by some keyboards. */
  readonly aliases?: Readonly<Record<string, KeyCode>>
}
