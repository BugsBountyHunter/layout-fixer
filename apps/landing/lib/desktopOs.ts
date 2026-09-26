export type DesktopOs = 'mac' | 'windows' | 'linux'

interface NavigatorLike {
  readonly platform: string
  readonly userAgent: string
  readonly maxTouchPoints?: number
  readonly userAgentData?: { readonly platform: string; readonly mobile?: boolean }
}

/** The visitor's desktop system, or null on phones and tablets (the app doesn't run there). */
export function detectDesktopOs(nav: NavigatorLike): DesktopOs | null {
  if (nav.userAgentData?.mobile || /Android|iPhone|iPad|iPod/i.test(nav.userAgent)) return null
  const platform = nav.userAgentData?.platform ?? nav.platform
  // iPadOS reports "MacIntel" with touch support.
  if (/mac/i.test(platform)) return (nav.maxTouchPoints ?? 0) > 1 ? null : 'mac'
  if (/win/i.test(platform)) return 'windows'
  if (/linux|x11/i.test(platform) || /Linux|X11/.test(nav.userAgent)) return 'linux'
  return null
}
