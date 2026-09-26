import { invoke } from '@tauri-apps/api/core'

/** Error codes from the Rust side (`FixError`). */
export type FixErrorCode = 'accessibility-denied' | 'secure-input' | 'unsupported' | 'system'

/** Native operations the fix needs; the Rust side handles clipboard timing and key presses. */
export interface FixBridge {
  /** The focused app's selection, or `null` when nothing is selected. */
  captureSelection(): Promise<string | null>
  /** Pastes over the selection, then restores the user's clipboard. */
  pasteText(text: string): Promise<void>
  /** Restores the user's clipboard without pasting. */
  restoreClipboard(): Promise<void>
}

const CODES: readonly FixErrorCode[] = ['accessibility-denied', 'secure-input', 'unsupported', 'system']

/** Tauri rejects with the serialized `FixError`; anything else is an unexpected failure. */
export function errorCode(error: unknown): FixErrorCode {
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined
  return CODES.includes(code as FixErrorCode) ? (code as FixErrorCode) : 'system'
}

export const tauriBridge: FixBridge = {
  captureSelection: () => invoke<string | null>('capture_selection'),
  pasteText: (text) => invoke('paste_text', { text }),
  restoreClipboard: () => invoke('restore_clipboard'),
}
