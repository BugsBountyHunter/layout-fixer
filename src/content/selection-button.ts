import type { ArabicLayoutId } from '../core/layouts'
import { t, uiDirection } from '../platform/i18n'
import { loadSettings, resolveLayout, type Settings, watchSettings } from '../platform/settings'
import { isMacPlatform } from '../platform/shortcut'
import { OPEN_OPTIONS_MESSAGE } from '../shared/constants'
import { notify } from './notify'
import { fixActiveElement } from './replace'
import { menuOptions } from './selection/menu-options'
import { placeButton } from './selection/placement'
import { readSelection, type SelectionInfo } from './selection/read-selection'
import { BUTTON_SIZE, createSelectionUi, type SelectionUi } from './selection/selection-ui'

const UPDATE_DELAY_MS = 200
const STARTED = Symbol.for('layout-fixer.selection-button')

interface State {
  settings: Settings
  pointerDown: boolean
  lastPointer: { x: number; y: number } | null
  timer: ReturnType<typeof setTimeout> | undefined
  shownText: string | null
  /** A selection the user already fixed or dismissed; the button stays away until it changes. */
  dismissedText: string | null
}

type Listener = readonly [EventTarget, string, EventListener, AddEventListenerOptions]

/** Selection rect first; inputs have none, so use where the pointer was released, then the element. */
function anchorBox({ rect, anchor }: SelectionInfo, lastPointer: State['lastPointer']) {
  if (rect && (rect.width > 0 || rect.height > 0)) return rect
  if (lastPointer) return { left: lastPointer.x, right: lastPointer.x, top: lastPointer.y, bottom: lastPointer.y }
  return anchor?.getBoundingClientRect() ?? null
}

function update(state: State, ui: SelectionUi, layout: ArabicLayoutId): void {
  if (!state.settings.selectionButton || state.pointerDown || ui.isMenuOpen()) return
  const selection = readSelection()
  if (!selection || selection.text !== state.dismissedText) state.dismissedText = null
  const options = selection && selection.text !== state.dismissedText ? menuOptions(selection.text, layout) : []
  const box = selection && anchorBox(selection, state.lastPointer)
  if (!selection || !box || options.length === 0) {
    ui.hide()
    return
  }
  state.shownText = selection.text
  const viewport = { width: window.innerWidth, height: window.innerHeight }
  ui.show(placeButton(box, viewport, BUTTON_SIZE, uiDirection()), options)
}

function isEscape(event: Event): boolean {
  return (event as KeyboardEvent).key === 'Escape'
}

function pageListeners(state: State, ui: SelectionUi, schedule: () => void): Listener[] {
  const onPointerDown = (event: Event) => {
    if (ui.owns(event.target)) return
    state.pointerDown = true
    state.dismissedText = null
    ui.hide()
  }
  const onPointerUp = (event: Event) => {
    const { clientX, clientY } = event as PointerEvent
    state.pointerDown = false
    state.lastPointer = { x: clientX, y: clientY }
    schedule()
  }
  const onKeyDown = (event: Event) => {
    if (!isEscape(event)) return
    state.dismissedText = state.shownText
    ui.hide()
  }
  const hide = () => ui.hide()

  return [
    [document, 'selectionchange', () => !ui.isMenuOpen() && schedule(), {}],
    [document, 'select', schedule, { capture: true }],
    [document, 'pointerdown', onPointerDown, { capture: true }],
    [document, 'pointerup', onPointerUp, { capture: true }],
    [document, 'keyup', (event) => !isEscape(event) && schedule(), {}],
    [document, 'keydown', onKeyDown, {}],
    [window, 'scroll', hide, { capture: true, passive: true }],
    [window, 'resize', hide, { passive: true }],
  ]
}

function listen(listeners: readonly Listener[]): () => void {
  for (const [target, type, listener, options] of listeners) target.addEventListener(type, listener, options)
  return () => {
    for (const [target, type, listener, options] of listeners) target.removeEventListener(type, listener, options)
  }
}

export async function startSelectionButton(): Promise<() => void> {
  const state: State = {
    settings: await loadSettings(),
    pointerDown: false,
    lastPointer: null,
    timer: undefined,
    shownText: null,
    dismissedText: null,
  }
  const layout = () => resolveLayout(state.settings, isMacPlatform(navigator))

  const ui = createSelectionUi({
    dir: uiDirection(),
    labels: { button: t('menuFix'), settings: t('openSettings') },
    onPick: async (option) => {
      state.dismissedText = state.shownText
      ui.hide()
      notify(await fixActiveElement({ layout: layout(), direction: option.direction }), state.settings)
    },
    onOpenSettings: () => {
      ui.hide()
      void chrome.runtime.sendMessage({ type: OPEN_OPTIONS_MESSAGE })
    },
  })

  const schedule = () => {
    clearTimeout(state.timer)
    state.timer = setTimeout(() => update(state, ui, layout()), UPDATE_DELAY_MS)
  }
  const unlisten = listen(pageListeners(state, ui, schedule))
  const stopWatching = watchSettings((next) => {
    state.settings = next
    if (!next.selectionButton) ui.hide()
  })

  return () => {
    clearTimeout(state.timer)
    stopWatching()
    unlisten()
    ui.hide()
  }
}

/**
 * A frame can receive the script twice — from registration and from the injection into
 * already-open tabs — so a page-global marker keeps one instance per frame.
 */
export function onExecute(): void {
  const scope = globalThis as { [STARTED]?: boolean }
  if (scope[STARTED]) return
  scope[STARTED] = true
  void startSelectionButton()
}
