// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { showToast, TOAST_HOST_ID } from './toast'

function toastRoot(): ShadowRoot {
  const host = document.getElementById(TOAST_HOST_ID)
  expect(host).not.toBeNull()
  return host!.shadowRoot!
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('showToast', () => {
  it('renders inside a shadow root so page CSS cannot restyle it', () => {
    showToast({ message: 'Fixed text', text: 'السلام' })
    expect(toastRoot().querySelector('[role="status"]')?.textContent).toContain('السلام')
  })

  it('announces politely to screen readers', () => {
    showToast({ message: 'Copied' })
    expect(toastRoot().querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite')
  })

  it('lets the browser pick text direction for mixed Arabic/English content', () => {
    showToast({ message: 'Fixed text', text: 'hello' })
    expect(toastRoot().querySelector('.text')?.getAttribute('dir')).toBe('auto')
  })

  it('replaces the previous toast instead of stacking', () => {
    showToast({ message: 'one' })
    showToast({ message: 'two' })
    expect(document.querySelectorAll(`#${TOAST_HOST_ID}`)).toHaveLength(1)
    expect(toastRoot().textContent).toContain('two')
  })

  it('removes itself after the timeout', () => {
    vi.useFakeTimers()
    showToast({ message: 'bye', durationMs: 1000 })
    vi.advanceTimersByTime(1500)
    expect(document.getElementById(TOAST_HOST_ID)).toBeNull()
  })

  it('never injects page-provided text as HTML', () => {
    showToast({ message: 'x', text: '<img src=x onerror=alert(1)>' })
    expect(toastRoot().querySelector('img')).toBeNull()
  })
})

describe('showToast — long text', () => {
  it('truncates very long previews', () => {
    showToast({ message: 'x', text: 'a'.repeat(1000) })
    const preview = toastRoot().querySelector('.text')!.textContent!
    expect(preview.length).toBeLessThan(300)
    expect(preview.endsWith('…')).toBe(true)
  })
})
