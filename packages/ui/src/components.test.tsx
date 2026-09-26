import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { CheckIcon, CloseIcon, CopyIcon, SettingsIcon } from './icons'
import { ShortcutKeys } from './ShortcutKeys'
import { SwitchRow } from './SwitchRow'

describe('ShortcutKeys', () => {
  it('renders one kbd per key, left to right even in RTL pages', () => {
    const html = renderToStaticMarkup(<ShortcutKeys keys={['⌥', '⇧', 'F']} />)
    expect(html).toBe('<span class="kbd-group" dir="ltr"><kbd>⌥</kbd><kbd>⇧</kbd><kbd>F</kbd></span>')
  })
})

describe('icons', () => {
  it.each([
    ['SettingsIcon', SettingsIcon],
    ['CopyIcon', CopyIcon],
    ['CheckIcon', CheckIcon],
    ['CloseIcon', CloseIcon],
  ])('%s is decorative and sized 16px by default', (_name, Icon) => {
    const html = renderToStaticMarkup(<Icon />)
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('width="16"')
  })

  it('accepts a custom size', () => {
    expect(renderToStaticMarkup(<CheckIcon size={24} />)).toContain('height="24"')
  })
})

describe('SwitchRow', () => {
  it('is a labelled switch that reports its state', () => {
    const html = renderToStaticMarkup(<SwitchRow label="Open at login" checked onChange={() => {}} />)
    expect(html).toContain('role="switch"')
    expect(html).toContain('aria-checked="true"')
    expect(html).toContain('Open at login')
  })

  it('passes the new state to onChange', () => {
    const onChange = vi.fn()
    const row = SwitchRow({ label: 'Open at login', checked: false, onChange }) as ReactElement<{
      children: ReactElement<{ onChange: (event: { target: { checked: boolean } }) => void }>[]
    }>
    row.props.children[1]?.props.onChange({ target: { checked: true } })
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
