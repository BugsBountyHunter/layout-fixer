import { invoke } from '@tauri-apps/api/core'
import { describe, expect, it, vi } from 'vitest'
import { tauriBridge } from './bridge'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(async () => null) }))

// The command names must match the Rust `#[tauri::command]` functions; a typo only fails at runtime.
describe('tauriBridge', () => {
  it('calls the native commands', async () => {
    await tauriBridge.captureSelection()
    await tauriBridge.pasteText('مرحبا')
    await tauriBridge.restoreClipboard()
    expect(vi.mocked(invoke).mock.calls).toEqual([
      ['capture_selection'],
      ['paste_text', { text: 'مرحبا' }],
      ['restore_clipboard'],
    ])
  })
})
