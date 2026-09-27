import type { ArabicLayoutId } from '@layout-fixer/core/layouts'
import { SWITCH_LAYOUT_MESSAGE } from '../shared/constants'

/** The native messaging host installed by Layout Fixer for desktop (1.3 and later). */
export const DESKTOP_HOST = 'io.github.bugsbountyhunter.layoutfixer'
export const NATIVE_MESSAGING: chrome.permissions.Permissions = { permissions: ['nativeMessaging'] }

export interface LayoutSwitchRequest {
  readonly language: 'ar' | 'en'
  readonly layout: ArabicLayoutId
}

/** `runtime.sendNativeMessage` only exists once the optional permission is granted, and never on Android. */
export interface NativeRuntime {
  readonly sendNativeMessage?: (host: string, message: object) => Promise<unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Page scripts are the sender, so the message is re-validated before it reaches the desktop app. */
export function parseLayoutSwitchMessage(message: unknown): LayoutSwitchRequest | null {
  if (!isRecord(message) || message.type !== SWITCH_LAYOUT_MESSAGE) return null
  const { language, layout } = message
  if ((language !== 'ar' && language !== 'en') || (layout !== 'ar-pc' && layout !== 'ar-mac')) return null
  return { language, layout }
}

/** The text is already fixed, so a missing or failing desktop app is only logged. */
export async function sendLayoutSwitch(runtime: NativeRuntime, request: LayoutSwitchRequest): Promise<void> {
  if (!runtime.sendNativeMessage) return
  try {
    await runtime.sendNativeMessage(DESKTOP_HOST, { type: 'switch-layout', ...request })
  } catch (error) {
    console.warn('[layout-fixer] Could not switch the keyboard layout:', error)
  }
}

export type DesktopStatus = { readonly kind: 'connected'; readonly version: string } | { readonly kind: 'missing' }

export async function pingDesktop(runtime: NativeRuntime): Promise<DesktopStatus> {
  if (!runtime.sendNativeMessage) return { kind: 'missing' }
  try {
    const answer = await runtime.sendNativeMessage(DESKTOP_HOST, { type: 'ping' })
    if (isRecord(answer) && answer.ok === true && typeof answer.version === 'string') {
      return { kind: 'connected', version: answer.version }
    }
  } catch {
    // Not installed, too old to have the host, or the manifest points at a moved app.
  }
  return { kind: 'missing' }
}

/** Desktop browsers only: Android has no native messaging and no desktop app. */
export function supportsDesktopApp(userAgent: string): boolean {
  return !/Android/i.test(userAgent)
}
