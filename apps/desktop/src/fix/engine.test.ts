import { describe, expect, it, vi } from 'vitest'
import type { FixBridge } from './bridge'
import { createFixHandler, type EngineDeps } from './engine'
import { messageFor } from './messages'

function deps(bridge: Partial<FixBridge> = {}) {
  return {
    bridge: {
      captureSelection: async () => 'hgsghl',
      pasteText: async () => {},
      restoreClipboard: async () => {},
      ...bridge,
    },
    resolveLayout: async () => 'ar-pc',
    showMessage: vi.fn<(message: string) => void>(),
    onAccessibilityDenied: vi.fn<() => void>(),
  } satisfies EngineDeps
}

describe('createFixHandler', () => {
  it('fixes silently when it works', async () => {
    const d = deps()
    expect(await createFixHandler(d)()).toEqual({ kind: 'fixed' })
    expect(d.showMessage).not.toHaveBeenCalled()
  })

  it('explains an empty selection', async () => {
    const d = deps({ captureSelection: async () => null })
    await createFixHandler(d)()
    expect(d.showMessage).toHaveBeenCalledWith('Select the text first')
  })

  it('asks for Accessibility when macOS blocks key presses', async () => {
    const d = deps({ captureSelection: () => Promise.reject({ code: 'accessibility-denied' }) })
    await createFixHandler(d)()
    expect(d.onAccessibilityDenied).toHaveBeenCalledOnce()
    expect(d.showMessage).toHaveBeenCalledWith('Allow Layout Fixer in Accessibility settings')
  })

  it('ignores a second press while a fix is running', async () => {
    let finish: (text: string) => void = () => {}
    const selection = new Promise<string>((resolve) => {
      finish = resolve
    })
    const d = deps({ captureSelection: () => selection })
    const handle = createFixHandler(d)

    const first = handle()
    expect(await handle()).toBeNull()
    finish('hgsghl')
    expect(await first).toEqual({ kind: 'fixed' })
  })

  it('accepts the next press once the fix is done', async () => {
    const handle = createFixHandler(deps())
    await handle()
    expect(await handle()).toEqual({ kind: 'fixed' })
  })
})

describe('messageFor', () => {
  it.each([
    [{ kind: 'nothing-to-fix' } as const, 'Nothing to fix'],
    [{ kind: 'error', code: 'secure-input' } as const, 'Can’t fix text in password fields'],
    [{ kind: 'error', code: 'elevated-app' } as const, 'Can’t fix text in apps running as administrator'],
    [{ kind: 'error', code: 'unsupported' } as const, 'Fixing text isn’t available on this system yet'],
    [{ kind: 'error', code: 'system' } as const, 'Couldn’t fix the text'],
  ])('%j → %s', (outcome, message) => {
    expect(messageFor(outcome)).toBe(message)
  })
})
