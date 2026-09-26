// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { Demo } from '@/components/demo/Demo'
import { getDictionary } from '@/lib/i18n'

const labels = getDictionary('en').demo

afterEach(cleanup)

describe('Demo try-it box', () => {
  it('fixes the typed text with the Fix button', async () => {
    const user = userEvent.setup()
    render(<Demo labels={labels} />)
    const input = screen.getByLabelText(labels.label)
    await user.type(input, 'hgsghl ugd;l')
    await user.click(screen.getByRole('button', { name: labels.fix }))
    expect(input).toHaveProperty('value', 'السلام عليكم')
  })

  it('fixes the typed text with Alt+Shift+F', async () => {
    const user = userEvent.setup()
    render(<Demo labels={labels} />)
    const input = screen.getByLabelText(labels.label)
    await user.type(input, 'اثممخ')
    await user.keyboard('{Alt>}{Shift>}F{/Shift}{/Alt}')
    expect(input).toHaveProperty('value', 'hello')
  })

  it('leaves a blank box alone', async () => {
    const user = userEvent.setup()
    render(<Demo labels={labels} />)
    const input = screen.getByLabelText(labels.label)
    await user.type(input, '   ')
    await user.click(screen.getByRole('button', { name: labels.fix }))
    expect(input).toHaveProperty('value', '   ')
  })
})

describe('Demo on a Mac', () => {
  afterEach(() => {
    delete (navigator as { platform?: string }).platform
  })

  it('converts with the macOS Arabic layout and shows ⌥⇧F', async () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })
    const user = userEvent.setup()
    render(<Demo labels={labels} />)
    const input = screen.getByLabelText(labels.label)
    await user.type(input, 'hgp,hv')
    await user.click(screen.getByRole('button', { name: labels.fix }))
    expect(input).toHaveProperty('value', 'الح،اد')
    expect(screen.getAllByText('⌥').length).toBeGreaterThan(0)
  })
})

describe('Demo announcements', () => {
  it('announces the fixed text to screen readers', async () => {
    const user = userEvent.setup()
    render(<Demo labels={labels} />)
    await user.type(screen.getByLabelText(labels.label), 'hgsghl ugd;l')
    await user.click(screen.getByRole('button', { name: labels.fix }))
    expect(screen.getByRole('status').textContent).toContain('السلام عليكم')
  })
})
