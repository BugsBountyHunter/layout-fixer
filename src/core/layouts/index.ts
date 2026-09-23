import { AR_MAC } from './ar-mac'
import { AR_PC } from './ar-pc'
import { EN_US } from './en-us'
import type { KeyboardLayout } from './types'

export type { KeyCode } from './keys'
export type { KeyboardLayout, KeyOutput } from './types'

export const LAYOUTS = Object.freeze({
  'en-us': EN_US,
  'ar-pc': AR_PC,
  'ar-mac': AR_MAC,
}) satisfies Readonly<Record<string, KeyboardLayout>>

export type LayoutId = keyof typeof LAYOUTS

export const LAYOUT_IDS = Object.keys(LAYOUTS) as readonly LayoutId[]

/** Values come from storage and must be validated before use. */
export function isLayoutId(value: unknown): value is LayoutId {
  return typeof value === 'string' && Object.hasOwn(LAYOUTS, value)
}

export type ArabicLayoutId = Extract<LayoutId, 'ar-pc' | 'ar-mac'>

export function defaultLayout(isMac: boolean): ArabicLayoutId {
  return isMac ? 'ar-mac' : 'ar-pc'
}
