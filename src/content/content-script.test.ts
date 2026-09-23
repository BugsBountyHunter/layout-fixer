// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FixResult } from './replace'

const { fixActiveElement, showToast, loadSettings } = vi.hoisted(() => ({
  fixActiveElement: vi.fn<(options?: { layout?: string }) => Promise<FixResult>>(),
  showToast: vi.fn(),
  loadSettings: vi.fn(),
}))

vi.mock('./replace', () => ({ fixActiveElement }))
vi.mock('./toast', () => ({ showToast }))
vi.mock('../platform/settings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../platform/settings')>()),
  loadSettings,
}))

const { onExecute } = await import('./content-script')

beforeEach(() => {
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  loadSettings.mockResolvedValue({ arabicLayout: 'auto', showToasts: true })
})

afterEach(() => {
  vi.resetAllMocks()
  document.body.innerHTML = ''
})

describe('onExecute', () => {
  it('stays silent after an in-place replacement', async () => {
    fixActiveElement.mockResolvedValue({ status: 'replaced' })
    await onExecute()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('shows the copied text when the page could not be edited', async () => {
    fixActiveElement.mockResolvedValue({ status: 'copied', text: 'السلام' })
    await onExecute()
    expect(showToast).toHaveBeenCalledWith({ message: 'toastCopied', text: 'السلام' })
  })

  it('keeps the text on screen longer when it could not be copied either', async () => {
    fixActiveElement.mockResolvedValue({ status: 'shown', text: 'hello' })
    await onExecute()
    expect(showToast).toHaveBeenCalledWith({ message: 'toastShown', text: 'hello', durationMs: 10_000 })
  })

  it('asks the user to select text when there is nothing to fix', async () => {
    fixActiveElement.mockResolvedValue({ status: 'empty' })
    await onExecute()
    expect(showToast).toHaveBeenCalledWith({ message: 'toastEmpty', durationMs: 2500 })
  })

  it('does nothing in frames that do not have focus', async () => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(false)
    await onExecute()
    expect(fixActiveElement).not.toHaveBeenCalled()
  })

  it('defers to the child frame when an iframe owns focus', async () => {
    document.body.innerHTML = '<iframe></iframe>'
    document.querySelector('iframe')!.focus()
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(document.querySelector('iframe'))

    await onExecute()
    expect(fixActiveElement).not.toHaveBeenCalled()
  })

  it('converts with the layout chosen in settings', async () => {
    loadSettings.mockResolvedValue({ arabicLayout: 'ar-mac', showToasts: true })
    fixActiveElement.mockResolvedValue({ status: 'replaced' })
    await onExecute()
    expect(fixActiveElement).toHaveBeenCalledWith({ layout: 'ar-mac' })
  })

  it('picks the layout from the OS in automatic mode', async () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32')
    fixActiveElement.mockResolvedValue({ status: 'replaced' })
    await onExecute()
    expect(fixActiveElement).toHaveBeenCalledWith({ layout: 'ar-pc' })
  })

  it('stays quiet when on-page messages are turned off', async () => {
    loadSettings.mockResolvedValue({ arabicLayout: 'auto', showToasts: false })
    for (const result of [{ status: 'copied', text: 'x' }, { status: 'empty' }] as const) {
      fixActiveElement.mockResolvedValue(result)
      await onExecute()
    }
    expect(showToast).not.toHaveBeenCalled()
  })

  it('still shows the fixed text when it could not be copied, even with messages off', async () => {
    loadSettings.mockResolvedValue({ arabicLayout: 'auto', showToasts: false })
    fixActiveElement.mockResolvedValue({ status: 'shown', text: 'hello' })
    await onExecute()
    expect(showToast).toHaveBeenCalledOnce()
  })
})
