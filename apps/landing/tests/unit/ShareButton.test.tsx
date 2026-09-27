// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareButton } from '@/components/ShareButton'

const props = {
  url: 'https://layoutfixer.dev',
  title: 'Layout Fixer',
  text: 'Fix it',
  label: 'Share',
  copiedLabel: 'Link copied',
}

function stubNavigator(key: 'share' | 'clipboard', value: unknown) {
  Object.defineProperty(navigator, key, { value, configurable: true })
}

afterEach(() => {
  cleanup()
  stubNavigator('share', undefined)
  vi.restoreAllMocks()
})

describe('ShareButton', () => {
  it('opens the system share sheet when there is one', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubNavigator('share', share)
    render(<ShareButton {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(share).toHaveBeenCalledWith({ title: 'Layout Fixer', text: 'Fix it', url: 'https://layoutfixer.dev' })
  })

  it('stays quiet when the share sheet is dismissed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    stubNavigator('share', vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')))
    render(<ShareButton {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(warn).not.toHaveBeenCalled()
  })

  it('copies the link where sharing is not available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigator('clipboard', { writeText })
    render(<ShareButton {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(writeText).toHaveBeenCalledWith('https://layoutfixer.dev')
    expect(await screen.findByRole('button', { name: 'Link copied' })).toBeTruthy()
  })

  it('shows the link to copy by hand when the clipboard is blocked', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const prompt = vi.fn().mockReturnValue(null)
    Object.defineProperty(window, 'prompt', { value: prompt, configurable: true })
    stubNavigator('clipboard', { writeText: vi.fn().mockRejectedValue(new Error('denied')) })
    render(<ShareButton {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(prompt).toHaveBeenCalledWith('Share', 'https://layoutfixer.dev')
  })
})
