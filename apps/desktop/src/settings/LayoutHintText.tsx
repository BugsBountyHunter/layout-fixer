import { useMessages } from '../i18n/react'
import type { SwitchLanguage } from '../platform/layoutHints'
import { desktopOs } from '../platform/os'

const OS = desktopOs(navigator.userAgent)

/** Under the switch toggle: which language can't be switched to, and where to add its keyboard. */
export function MissingLayoutsNote({ missing }: { readonly missing: readonly SwitchLanguage[] }) {
  const m = useMessages()
  if (missing.length === 0) return null
  const where = { mac: m.keyboardSettingsMac, windows: m.keyboardSettingsWindows, linux: m.keyboardSettingsLinux }[OS]
  return (
    <p className="footnote notice-text" role="note" data-testid="missing-layouts">
      {missing
        .map((language) => (language === 'ar' ? m.switchLayoutMissingAr : m.switchLayoutMissingEn)(where))
        .join(' ')}
    </p>
  )
}
