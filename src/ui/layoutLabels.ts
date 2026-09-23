import type { ArabicLayoutId } from '../core/layouts'
import type { MessageKey } from '../platform/i18n'

export const LAYOUT_NAME: Readonly<Record<ArabicLayoutId, MessageKey>> = {
  'ar-pc': 'layoutPc',
  'ar-mac': 'layoutMac',
}
