/** The `session_info` answer from Rust. */
interface SessionInfo {
  readonly wayland: boolean
  /** The shortcut fixes text in this Wayland session as it is (KDE Plasma). */
  readonly fixesOnWayland: boolean
}

function isSessionInfo(raw: unknown): raw is SessionInfo {
  if (typeof raw !== 'object' || raw === null) return false
  const info = raw as Record<string, unknown>
  return typeof info.wayland === 'boolean' && typeof info.fixesOnWayland === 'boolean'
}

/**
 * A Wayland session where nothing lets the shortcut fix text, so Settings says to use X11. GNOME
 * (the extension, shown in its own section) and KDE Plasma don't count.
 */
export function blocksFixing(raw: unknown): boolean {
  return isSessionInfo(raw) && raw.wayland && !raw.fixesOnWayland
}
