import { describe, expect, it, vi } from 'vitest'
import { errorCode, type FixBridge } from './bridge'
import { fixSelection } from './fix-flow'

function bridge(selection: string | null, overrides: Partial<FixBridge> = {}) {
  return {
    captureSelection: vi.fn(async () => selection),
    pasteText: vi.fn(async (_text: string) => {}),
    restoreClipboard: vi.fn(async () => {}),
    ...overrides,
  }
}

describe('fixSelection', () => {
  it('pastes Arabic typed on the English layout as Arabic', async () => {
    const native = bridge('hgsghl ugd;l')
    expect(await fixSelection(native, 'ar-pc')).toEqual({ kind: 'fixed' })
    expect(native.pasteText).toHaveBeenCalledWith('السلام عليكم')
    expect(native.restoreClipboard).not.toHaveBeenCalled()
  })

  it('pastes English typed on the Arabic layout as English', async () => {
    const native = bridge('اثممخ')
    await fixSelection(native, 'ar-pc')
    expect(native.pasteText).toHaveBeenCalledWith('hello')
  })

  it('uses the chosen Arabic layout', async () => {
    const pc = bridge('lvpfh')
    const mac = bridge('lnpfh')
    await fixSelection(pc, 'ar-pc')
    await fixSelection(mac, 'ar-mac')
    expect(pc.pasteText).toHaveBeenCalledWith('مرحبا')
    expect(mac.pasteText).toHaveBeenCalledWith('مرحبا')
  })

  it('reports an empty selection without pasting', async () => {
    const native = bridge(null)
    expect(await fixSelection(native, 'ar-pc')).toEqual({ kind: 'nothing-selected' })
    expect(native.pasteText).not.toHaveBeenCalled()
  })

  it('restores the clipboard instead of pasting unchanged text', async () => {
    const native = bridge('123 456')
    expect(await fixSelection(native, 'ar-pc')).toEqual({ kind: 'nothing-to-fix' })
    expect(native.pasteText).not.toHaveBeenCalled()
    expect(native.restoreClipboard).toHaveBeenCalledOnce()
  })

  it('turns a native error into an outcome and restores the clipboard', async () => {
    const native = bridge(null, {
      captureSelection: vi.fn(async () => Promise.reject({ code: 'accessibility-denied' })),
    })
    expect(await fixSelection(native, 'ar-pc')).toEqual({ kind: 'error', code: 'accessibility-denied' })
    expect(native.restoreClipboard).toHaveBeenCalledOnce()
  })

  it('logs unexpected failures and survives a failing restore', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const native = bridge('hgsghl', {
      pasteText: vi.fn(async () => Promise.reject(new Error('boom'))),
      restoreClipboard: vi.fn(async () => Promise.reject(new Error('also boom'))),
    })
    expect(await fixSelection(native, 'ar-pc')).toEqual({ kind: 'error', code: 'system' })
    expect(log).toHaveBeenCalledOnce()
    log.mockRestore()
  })
})

describe('errorCode', () => {
  it.each([
    [{ code: 'secure-input' }, 'secure-input'],
    [{ code: 'elevated-app' }, 'elevated-app'],
    [{ code: 'wayland' }, 'wayland'],
    [{ code: 'unsupported' }, 'unsupported'],
    [{ code: 'something-new' }, 'system'],
    [new Error('x'), 'system'],
    ['text', 'system'],
    [null, 'system'],
  ])('maps %j to %s', (error, code) => {
    expect(errorCode(error)).toBe(code)
  })
})
