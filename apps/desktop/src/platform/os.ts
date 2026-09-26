/** WKWebView on macOS reports "Macintosh"; WebView2 and WebKitGTK never do. */
export function isMacPlatform(userAgent: string): boolean {
  return /Macintosh|Mac OS X/.test(userAgent)
}
