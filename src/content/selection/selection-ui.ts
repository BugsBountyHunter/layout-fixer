import type { MenuOption } from './menu-options'
import { BUTTON_SIZE, ICON_SVG, SETTINGS_SVG, STYLES } from './selection-ui.styles'

export const SELECTION_UI_HOST_ID = 'layout-fixer-selection'

const MENU_WIDTH = 340

interface Position {
  readonly left: number
  readonly top: number
}

export interface SelectionUiOptions {
  readonly dir: 'ltr' | 'rtl'
  readonly labels: { readonly button: string; readonly settings: string }
  readonly onPick: (option: MenuOption) => void
  readonly onOpenSettings: () => void
}

export interface SelectionUi {
  readonly show: (position: Position, options: readonly MenuOption[]) => void
  readonly hide: () => void
  readonly isMenuOpen: () => boolean
  readonly owns: (node: EventTarget | null) => boolean
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  el.className = className
  if (text !== undefined) el.textContent = text
  return el
}

function svg(markup: string): Node {
  return document.importNode(new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement, true)
}

/**
 * A button that never takes focus: pressing it must not blur the page field or clear the
 * selection it is about to fix, and Tab must keep moving through the page. Keyboard users
 * fix text with the shortcut instead.
 */
function pointerButton(className: string, onClick: () => void): HTMLButtonElement {
  const button = element('button', className)
  button.type = 'button'
  button.tabIndex = -1
  button.addEventListener('mousedown', (event) => event.preventDefault())
  button.addEventListener('pointerdown', (event) => event.preventDefault())
  button.addEventListener('click', onClick)
  return button
}

function optionButton(option: MenuOption, onPick: (option: MenuOption) => void): HTMLButtonElement {
  const item = pointerButton('item', () => onPick(option))
  item.lang = option.language
  const preview = element('span', 'preview', option.preview)
  preview.dir = 'auto'
  item.append(element('span', 'chip', option.chip), element('span', 'name', option.name), preview)
  return item
}

function buildMenu(options: readonly MenuOption[], position: Position, ui: SelectionUiOptions): HTMLElement {
  const group = element('div', 'menu')
  group.setAttribute('role', 'group')
  group.setAttribute('aria-label', ui.labels.button)
  group.dir = ui.dir
  if (position.top > window.innerHeight / 2) group.classList.add('above')
  const nearEnd = ui.dir === 'rtl' ? position.left < MENU_WIDTH : position.left + MENU_WIDTH > window.innerWidth
  if (nearEnd) group.classList.add('end')

  const settings = pointerButton('settings', ui.onOpenSettings)
  settings.append(svg(SETTINGS_SVG), document.createTextNode(ui.labels.settings))

  group.append(
    element('div', 'title', ui.labels.button),
    ...options.map((option) => optionButton(option, ui.onPick)),
    settings,
  )
  return group
}

export function createSelectionUi(ui: SelectionUiOptions): SelectionUi {
  let host: HTMLElement | null = null
  let menu: HTMLElement | null = null

  function hide(): void {
    host?.remove()
    host = null
    menu = null
  }

  function show(position: Position, options: readonly MenuOption[]): void {
    hide()
    host = document.createElement('div')
    host.id = SELECTION_UI_HOST_ID
    const root = host.attachShadow({ mode: 'open' })
    const style = element('style', '', STYLES)
    const container = element('div', 'container')
    container.style.left = `${position.left}px`
    container.style.top = `${position.top}px`

    const trigger = pointerButton('trigger', () => {
      menu?.remove()
      menu = menu ? null : container.appendChild(buildMenu(options, position, ui))
      trigger.setAttribute('aria-expanded', String(menu !== null))
    })
    trigger.setAttribute('aria-label', ui.labels.button)
    trigger.setAttribute('aria-expanded', 'false')
    trigger.title = ui.labels.button
    trigger.append(svg(ICON_SVG))

    container.append(trigger)
    root.append(style, container)
    document.documentElement.append(host)
  }

  return {
    show,
    hide,
    isMenuOpen: () => menu !== null,
    owns: (node) => host !== null && node === host,
  }
}

export { BUTTON_SIZE }
