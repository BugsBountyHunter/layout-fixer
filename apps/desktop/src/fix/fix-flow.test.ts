import { describe, expect, it, vi } from 'vitest'
import { errorCode, type FixBridge } from './bridge'
import { fixSelection } from './fix-flow'

function bridge(selection: string | null, overrides: Partial<FixBridge> = {}) {
  return {
    captureSelection: vi.fn(async () => selection),
    pasteText: vi.fn(async (_text: string) => {}),
    restoreClipboard: vi.fn(async () => {}),
    switchLayout: vi.fn(async (_language: string, _layout: string) => 'switched' as const),
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

describe('fixSelection with layout switching', () => {
  const SWITCH = { switchLayout: true }

  it('switches to Arabic after fixing Arabic typed on the English layout', async () => {
    const native = bridge('hgsghl')
    expect(await fixSelection(native, 'ar-mac', SWITCH)).toEqual({ kind: 'fixed' })
    expect(native.switchLayout).toHaveBeenCalledWith('ar', 'ar-mac')
  })

  it('switches to English after fixing English typed on the Arabic layout', async () => {
    const native = bridge('اثممخ')
    await fixSelection(native, 'ar-pc', SWITCH)
    expect(native.switchLayout).toHaveBeenCalledWith('en', 'ar-pc')
  })

  it('switches only after the paste', async () => {
    const order: string[] = []
    const native = bridge('hgsghl', {
      pasteText: vi.fn(async () => void order.push('paste')),
      switchLayout: vi.fn(async () => {
        order.push('switch')
        return 'switched' as const
      }),
    })
    await fixSelection(native, 'ar-pc', SWITCH)
    expect(order).toEqual(['paste', 'switch'])
  })

  it('does not switch when the setting is off', async () => {
    const native = bridge('hgsghl')
    await fixSelection(native, 'ar-pc', { switchLayout: false })
    expect(native.switchLayout).not.toHaveBeenCalled()
  })

  it.each([
    ['nothing selected', null],
    ['nothing to fix', '123'],
  ])('does not switch when there was %s', async (_case, selection) => {
    const native = bridge(selection)
    await fixSelection(native, 'ar-pc', SWITCH)
    expect(native.switchLayout).not.toHaveBeenCalled()
  })

  it('does not switch when the paste failed', async () => {
    const native = bridge('hgsghl', { pasteText: vi.fn(async () => Promise.reject({ code: 'secure-input' })) })
    await fixSelection(native, 'ar-pc', SWITCH)
    expect(native.switchLayout).not.toHaveBeenCalled()
  })

  it('still reports the fix when switching fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const native = bridge('hgsghl', { switchLayout: vi.fn(async () => Promise.reject({ code: 'unsupported' })) })
    expect(await fixSelection(native, 'ar-pc', SWITCH)).toEqual({ kind: 'fixed' })
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})

describe('errorCode', () => {
  it.each([
    [{ code: 'secure-input' }, 'secure-input'],
    [{ code: 'elevated-app' }, 'elevated-app'],
    [{ code: 'wayland' }, 'wayland'],
    [{ code: 'gnome-extension' }, 'gnome-extension'],
    [{ code: 'unsupported' }, 'unsupported'],
    [{ code: 'something-new' }, 'system'],
    [new Error('x'), 'system'],
    ['text', 'system'],
    [null, 'system'],
  ])('maps %j to %s', (error, code) => {
    expect(errorCode(error)).toBe(code)
  })
})
