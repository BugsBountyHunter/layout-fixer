import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CheckIcon, CloseIcon, CopyIcon, SettingsIcon } from './icons'
import { ShortcutKeys } from './ShortcutKeys'

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
