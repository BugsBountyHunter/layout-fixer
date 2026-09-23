// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FixResult } from './replace'
import { SELECTION_UI_HOST_ID } from './selection/selection-ui'

const { fixActiveElement, loadSettings, watchSettings, sendMessage } = vi.hoisted(() => ({
  fixActiveElement: vi.fn<(options?: object) => Promise<FixResult>>(),
  loadSettings: vi.fn(),
  watchSettings: vi.fn(),
  sendMessage: vi.fn(),
}))

vi.mock('./replace', () => ({ fixActiveElement }))
vi.mock('../platform/settings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../platform/settings')>()),
  loadSettings,
  watchSettings,
}))

const { onExecute, startSelectionButton } = await import('./selection-button')

const ENABLED = { arabicLayout: 'ar-pc', showToasts: true, selectionButton: true }

function selectParagraph(text: string): HTMLElement {
  document.body.innerHTML = `<p>${text}</p>`
  const paragraph = document.querySelector('p')!
  const range = document.createRange()
  range.selectNodeContents(paragraph)
  window.getSelection()!.removeAllRanges()
  window.getSelection()!.addRange(range)
  return paragraph
}

function releasePointer(): void {
  document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 100, clientY: 100 }))
  vi.advanceTimersByTime(300)
}

function host(): HTMLElement | null {
  return document.getElementById(SELECTION_UI_HOST_ID)
}

let stop: () => void = () => {}

beforeEach(() => {
  vi.useFakeTimers()
  loadSettings.mockResolvedValue(ENABLED)
  watchSettings.mockReturnValue(() => {})
  fixActiveElement.mockResolvedValue({ status: 'replaced' })
  vi.stubGlobal('chrome', { runtime: { sendMessage }, i18n: { getMessage: (key: string) => key } })
})

afterEach(() => {
  stop()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.resetAllMocks()
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('selection button', () => {
  it('appears after selecting text that can be fixed', async () => {
    stop = await startSelectionButton()
    selectParagraph('hgsghl ugd;l')
    releasePointer()
    expect(host()).not.toBeNull()
  })

  it('stays hidden when the setting is off', async () => {
    loadSettings.mockResolvedValue({ ...ENABLED, selectionButton: false })
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()
    expect(host()).toBeNull()
  })

  it('stays hidden for text no language option would change', async () => {
    stop = await startSelectionButton()
    selectParagraph('12345')
    releasePointer()
    expect(host()).toBeNull()
  })

  it('hides on Escape and when the selection is cleared', async () => {
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(host()).toBeNull()

    selectParagraph('hgsghl')
    releasePointer()
    window.getSelection()!.removeAllRanges()
    document.dispatchEvent(new Event('selectionchange'))
    vi.advanceTimersByTime(300)
    expect(host()).toBeNull()
  })

  it('fixes the text in the picked direction with the chosen layout', async () => {
    loadSettings.mockResolvedValue({ ...ENABLED, arabicLayout: 'ar-mac' })
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()

    const root = host()!.shadowRoot!
    root.querySelector<HTMLButtonElement>('button.trigger')!.click()
    root.querySelector<HTMLButtonElement>('button.item')!.click()
    await vi.runAllTimersAsync()

    expect(fixActiveElement).toHaveBeenCalledWith({ layout: 'ar-mac', direction: 'en→ar' })
    expect(host()).toBeNull()
  })

  it('asks the background to open settings', async () => {
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()
    const root = host()!.shadowRoot!
    root.querySelector<HTMLButtonElement>('button.trigger')!.click()
    root.querySelector<HTMLButtonElement>('button.settings')!.click()
    expect(sendMessage).toHaveBeenCalledWith({ type: 'layout-fixer:open-options' })
  })

  it('reacts live when the setting is turned off in another page', async () => {
    let push: (settings: object) => void = () => {}
    watchSettings.mockImplementation((listener: (settings: object) => void) => {
      push = listener
      return () => {}
    })
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()
    expect(host()).not.toBeNull()

    push({ ...ENABLED, selectionButton: false })
    expect(host()).toBeNull()
  })

  it('removes its listeners when stopped', async () => {
    stop = await startSelectionButton()
    stop()
    selectParagraph('hgsghl')
    releasePointer()
    expect(host()).toBeNull()
  })

  it('hides while the page scrolls', async () => {
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()
    window.dispatchEvent(new Event('scroll'))
    expect(host()).toBeNull()
  })

  it('appears after selecting with the keyboard', async () => {
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', shiftKey: true, bubbles: true }))
    vi.advanceTimersByTime(300)
    expect(host()).not.toBeNull()
  })

  it('appears for a selection inside an input, placed at the field', async () => {
    stop = await startSelectionButton()
    document.body.innerHTML = '<input value="hgsghl">'
    const input = document.querySelector('input')!
    input.focus()
    input.setSelectionRange(0, 6)
    document.dispatchEvent(new Event('select'))
    vi.advanceTimersByTime(300)
    expect(host()).not.toBeNull()
  })

  it('keeps the button when pressing its own UI', async () => {
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()
    host()!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
    expect(host()).not.toBeNull()
  })

  it('does not reposition while its menu is open', async () => {
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()
    host()!.shadowRoot!.querySelector<HTMLButtonElement>('button.trigger')!.click()
    const before = host()
    document.dispatchEvent(new Event('selectionchange'))
    vi.advanceTimersByTime(300)
    expect(host()).toBe(before)
  })
})

describe('selection button — after it was used or dismissed', () => {
  it('does not come back for the same selection after picking a language', async () => {
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()
    const root = host()!.shadowRoot!
    root.querySelector<HTMLButtonElement>('button.trigger')!.click()
    root.querySelector<HTMLButtonElement>('button.item')!.click()
    await vi.runAllTimersAsync()

    document.dispatchEvent(new Event('selectionchange'))
    releasePointer()
    expect(host()).toBeNull()
  })

  it('does not come back for the same selection after Escape, but does for a new one', async () => {
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    releasePointer()
    expect(host()).toBeNull()

    selectParagraph('ugd;l')
    releasePointer()
    expect(host()).not.toBeNull()
  })

  it('comes back when the user selects the same text again with a new gesture', async () => {
    stop = await startSelectionButton()
    selectParagraph('hgsghl')
    releasePointer()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    selectParagraph('hgsghl')
    releasePointer()
    expect(host()).not.toBeNull()
  })
})

describe('onExecute', () => {
  it('starts only one instance per frame', async () => {
    onExecute()
    onExecute()
    await vi.runAllTimersAsync()
    expect(loadSettings).toHaveBeenCalledOnce()
  })
})
