/** WKWebView on macOS reports "Macintosh"; WebView2 and WebKitGTK never do. */
export function isMacPlatform(userAgent: string): boolean {
  return /Macintosh|Mac OS X/.test(userAgent)
}

export type DesktopOs = 'mac' | 'windows' | 'linux'

/** WebView2 reports "Windows NT"; everything else that isn't macOS is WebKitGTK on Linux. */
export function desktopOs(userAgent: string): DesktopOs {
  if (isMacPlatform(userAgent)) return 'mac'
  return /Windows/.test(userAgent) ? 'windows' : 'linux'
}
