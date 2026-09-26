import { describe, expect, it, vi } from 'vitest'
import { AR } from '../i18n/ar'
import { EN } from '../i18n/en'
import type { FixBridge } from './bridge'
import { createFixHandler, type EngineDeps, type FixContext } from './engine'
import { messageFor } from './messages'

function deps(bridge: Partial<FixBridge> = {}, context: Partial<FixContext> = {}) {
  return {
    bridge: {
      captureSelection: async () => 'hgsghl',
      pasteText: async () => {},
      restoreClipboard: async () => {},
      ...bridge,
    },
    context: async () => ({ layout: 'ar-pc' as const, messages: EN, showMessages: true, ...context }),
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

  it('explains an empty selection in the user’s language', async () => {
    const d = deps({ captureSelection: async () => null }, { messages: AR })
    await createFixHandler(d)()
    expect(d.showMessage).toHaveBeenCalledWith('حدد النص أولًا')
  })

  it('stays quiet when on-screen messages are off', async () => {
    const d = deps({ captureSelection: async () => null }, { showMessages: false })
    await createFixHandler(d)()
    expect(d.showMessage).not.toHaveBeenCalled()
  })

  it('always asks for Accessibility when macOS blocks key presses', async () => {
    const d = deps(
      { captureSelection: () => Promise.reject({ code: 'accessibility-denied' }) },
      { showMessages: false },
    )
    await createFixHandler(d)()
    expect(d.onAccessibilityDenied).toHaveBeenCalledOnce()
    expect(d.showMessage).toHaveBeenCalledWith(EN.hudAccessibility)
  })

  it('ignores a second press while a fix is running', async () => {
    let finish: (text: string) => void = () => {}
    const selection = new Promise<string>((resolve) => {
      finish = resolve
    })
    const handle = createFixHandler(deps({ captureSelection: () => selection }))

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
    [{ kind: 'nothing-to-fix' } as const, EN.hudNothingToFix],
    [{ kind: 'error', code: 'secure-input' } as const, EN.hudSecureInput],
    [{ kind: 'error', code: 'elevated-app' } as const, EN.hudElevated],
    [{ kind: 'error', code: 'wayland' } as const, EN.hudWayland],
    [{ kind: 'error', code: 'unsupported' } as const, EN.hudUnsupported],
    [{ kind: 'error', code: 'system' } as const, EN.hudFailed],
  ])('%j → %s', (outcome, message) => {
    expect(messageFor(outcome, EN)).toBe(message)
  })

  it('translates', () => {
    expect(messageFor({ kind: 'error', code: 'elevated-app' }, AR)).toBe(AR.hudElevated)
  })
})
