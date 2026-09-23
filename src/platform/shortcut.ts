interface NavigatorLike {
  readonly platform: string
  readonly userAgentData?: { readonly platform: string }
}

/** Firefox shortcut names as they map to macOS keys ("Ctrl" is Command on macOS). */
const MAC_SYMBOLS: Readonly<Record<string, string>> = {
  Alt: '⌥',
  Shift: '⇧',
  Ctrl: '⌘',
  Command: '⌘',
  MacCtrl: '⌃',
}

export function isMacPlatform(nav: NavigatorLike): boolean {
  const platform = nav.userAgentData?.platform ?? nav.platform
  return /mac|iphone|ipad/i.test(platform)
}

/**
 * Split a `commands` shortcut into display keys. Chrome on macOS already returns
 * symbols without separators ("⇧⌥F"); Firefox always returns "Alt+Shift+F".
 */
export function formatShortcut(shortcut: string | undefined, isMac: boolean): string[] {
  if (!shortcut) return []
  if (!shortcut.includes('+')) return Array.from(shortcut)

  const keys = shortcut.split('+')
  return isMac ? keys.map((key) => MAC_SYMBOLS[key] ?? key) : keys
}

/** Chromium forks keep their own scheme for internal pages. */
export function shortcutSettingsUrl(userAgent: string): string {
  if (userAgent.includes(' Edg/')) return 'edge://extensions/shortcuts'
  if (userAgent.includes(' OPR/')) return 'opera://extensions/shortcuts'
  return 'chrome://extensions/shortcuts'
}
