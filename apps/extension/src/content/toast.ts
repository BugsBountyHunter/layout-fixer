import TOKENS from '@layout-fixer/ui/tokens.css?inline'

export const TOAST_HOST_ID = 'layout-fixer-toast'

const DEFAULT_DURATION_MS = 4000
const MAX_PREVIEW_LENGTH = 280

export interface ToastOptions {
  readonly message: string
  readonly text?: string
  readonly durationMs?: number
}

const STYLES = `${TOKENS}
  :host { all: initial; }
  .toast {
    position: fixed; inset-inline: 0; bottom: 24px; margin-inline: auto;
    width: max-content; max-width: min(420px, calc(100vw - 32px));
    box-sizing: border-box; padding: 10px 16px; border-radius: var(--lf-radius-lg);
    background: var(--lf-material); color: var(--lf-label);
    -webkit-backdrop-filter: var(--lf-material-filter); backdrop-filter: var(--lf-material-filter);
    box-shadow: var(--lf-shadow-float);
    font: var(--lf-text-callout)/1.45 var(--lf-font);
    -webkit-font-smoothing: antialiased;
    z-index: var(--lf-z-page-overlay); animation: enter var(--lf-duration-base) var(--lf-ease);
  }
  .message { color: var(--lf-label-on-material); font-size: var(--lf-text-footnote); }
  .text {
    margin-top: 2px; font-size: var(--lf-text-title3); font-weight: var(--lf-weight-semibold);
    white-space: pre-wrap; overflow-wrap: anywhere; user-select: text;
  }
  @keyframes enter { from { opacity: 0; transform: translateY(6px) scale(0.98); } }
`

let active: { host: HTMLElement; timer: ReturnType<typeof setTimeout> } | undefined

export function showToast({ message, text, durationMs = DEFAULT_DURATION_MS }: ToastOptions): void {
  dismissToast()

  const host = document.createElement('div')
  host.id = TOAST_HOST_ID
  const root = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = STYLES

  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')

  const messageEl = document.createElement('div')
  messageEl.className = 'message'
  messageEl.textContent = message
  toast.append(messageEl)

  if (text) {
    const textEl = document.createElement('div')
    textEl.className = 'text'
    textEl.dir = 'auto'
    textEl.textContent = text.length > MAX_PREVIEW_LENGTH ? `${text.slice(0, MAX_PREVIEW_LENGTH)}…` : text
    toast.append(textEl)
  }

  root.append(style, toast)
  document.documentElement.append(host)
  active = { host, timer: setTimeout(dismissToast, durationMs) }
}

export function dismissToast(): void {
  if (!active) return
  clearTimeout(active.timer)
  active.host.remove()
  active = undefined
}
