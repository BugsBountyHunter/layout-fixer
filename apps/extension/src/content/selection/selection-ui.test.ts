// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MenuOption } from './menu-options'
import { createSelectionUi, SELECTION_UI_HOST_ID } from './selection-ui'

const ARABIC: MenuOption = { direction: 'en→ar', language: 'ar', name: 'العربية', chip: 'ع', preview: 'السلام عليكم' }
const ENGLISH: MenuOption = { direction: 'ar→en', language: 'en', name: 'English', chip: 'EN', preview: 'hello' }

function setup() {
  const onPick = vi.fn()
  const onOpenSettings = vi.fn()
  const ui = createSelectionUi({
    dir: 'ltr',
    labels: { button: 'Fix keyboard layout', settings: 'Settings' },
    onPick,
    onOpenSettings,
  })
  return { ui, onPick, onOpenSettings }
}

function root(): ShadowRoot {
  const host = document.getElementById(SELECTION_UI_HOST_ID)
  expect(host).not.toBeNull()
  return host!.shadowRoot!
}

afterEach(() => {
  for (const el of document.documentElement.querySelectorAll(`#${SELECTION_UI_HOST_ID}`)) el.remove()
})

describe('selection UI', () => {
  it('shows a labelled button at the given position inside a shadow root', () => {
    const { ui } = setup()
    ui.show({ left: 120, top: 80 }, [ARABIC])

    const button = root().querySelector<HTMLButtonElement>('button.trigger')!
    expect(button.getAttribute('aria-label')).toBe('Fix keyboard layout')
    const container = root().querySelector<HTMLElement>('.container')!
    expect(container.style.left).toBe('120px')
    expect(container.style.top).toBe('80px')
  })

  it('draws the icon as real SVG, not text', () => {
    const { ui } = setup()
    ui.show({ left: 0, top: 0 }, [ARABIC])
    const svg = root().querySelector('button.trigger svg')
    expect(svg?.namespaceURI).toBe('http://www.w3.org/2000/svg')
  })

  it('stays out of the Tab order so keyboard focus never leaves the page field (keyboard users have the shortcut)', () => {
    const { ui } = setup()
    ui.show({ left: 0, top: 0 }, [ARABIC])
    const trigger = root().querySelector<HTMLButtonElement>('button.trigger')!
    trigger.click()
    const focusable = [trigger, ...root().querySelectorAll<HTMLButtonElement>('.menu button')]
    expect(focusable.map((el) => el.tabIndex)).toEqual(focusable.map(() => -1))
  })

  it('exposes a labelled group of buttons, not a menu that would promise arrow-key navigation', () => {
    const { ui } = setup()
    ui.show({ left: 0, top: 0 }, [ARABIC])
    const trigger = root().querySelector<HTMLButtonElement>('button.trigger')!
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    trigger.click()

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const group = root().querySelector('.menu')!
    expect(group.getAttribute('role')).toBe('group')
    expect(group.getAttribute('aria-label')).toBe('Fix keyboard layout')
    expect(root().querySelector('[role="menu"], [role="menuitem"]')).toBeNull()
  })

  it('keeps the page selection when pressed', () => {
    const { ui } = setup()
    ui.show({ left: 0, top: 0 }, [ARABIC])
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    root().querySelector('button.trigger')!.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('opens a menu with a preview for each language', () => {
    const { ui } = setup()
    ui.show({ left: 0, top: 0 }, [ARABIC, ENGLISH])
    root().querySelector<HTMLButtonElement>('button.trigger')!.click()

    const items = [...root().querySelectorAll('button.item')]
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toContain('العربية')
    expect(items[0].textContent).toContain('السلام عليكم')
    expect(items[1].textContent).toContain('English')
    expect(ui.isMenuOpen()).toBe(true)
  })

  it('closes the menu when the button is pressed again', () => {
    const { ui } = setup()
    ui.show({ left: 0, top: 0 }, [ARABIC])
    const trigger = root().querySelector<HTMLButtonElement>('button.trigger')!
    trigger.click()
    trigger.click()
    expect(ui.isMenuOpen()).toBe(false)
    expect(root().querySelector('.menu')).toBeNull()
  })

  it('opens the menu above the button in the lower half and toward the edge near the side', () => {
    const { ui } = setup()
    ui.show({ left: window.innerWidth - 40, top: window.innerHeight - 40 }, [ARABIC])
    root().querySelector<HTMLButtonElement>('button.trigger')!.click()
    const menu = root().querySelector('.menu')!
    expect(menu.classList.contains('above')).toBe(true)
    expect(menu.classList.contains('end')).toBe(true)
  })

  it('reports the picked option', () => {
    const { ui, onPick } = setup()
    ui.show({ left: 0, top: 0 }, [ARABIC, ENGLISH])
    root().querySelector<HTMLButtonElement>('button.trigger')!.click()
    root().querySelectorAll<HTMLButtonElement>('button.item')[1].click()
    expect(onPick).toHaveBeenCalledWith(ENGLISH)
  })

  it('opens settings from the menu', () => {
    const { ui, onOpenSettings } = setup()
    ui.show({ left: 0, top: 0 }, [ARABIC])
    root().querySelector<HTMLButtonElement>('button.trigger')!.click()
    root().querySelector<HTMLButtonElement>('button.settings')!.click()
    expect(onOpenSettings).toHaveBeenCalledOnce()
  })

  it('never renders page text as HTML', () => {
    const { ui } = setup()
    ui.show({ left: 0, top: 0 }, [{ ...ARABIC, preview: '<img src=x onerror=alert(1)>' }])
    root().querySelector<HTMLButtonElement>('button.trigger')!.click()
    expect(root().querySelector('img')).toBeNull()
  })

  it('replaces the previous button and can be hidden', () => {
    const { ui } = setup()
    ui.show({ left: 0, top: 0 }, [ARABIC])
    ui.show({ left: 10, top: 10 }, [ARABIC])
    expect(document.querySelectorAll(`#${SELECTION_UI_HOST_ID}`)).toHaveLength(1)

    ui.hide()
    expect(document.getElementById(SELECTION_UI_HOST_ID)).toBeNull()
    expect(ui.isMenuOpen()).toBe(false)
  })

  it('recognizes events that happen inside its own UI', () => {
    const { ui } = setup()
    ui.show({ left: 0, top: 0 }, [ARABIC])
    expect(ui.owns(document.getElementById(SELECTION_UI_HOST_ID))).toBe(true)
    expect(ui.owns(document.body)).toBe(false)
  })
})
