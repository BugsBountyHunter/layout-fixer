import { useEffect, useState } from 'react'
import { formatShortcut, isMacPlatform, shortcutSettingsUrl } from '../platform/shortcut'
import { FIX_COMMAND } from '../shared/constants'

interface FirefoxCommands {
  openShortcutSettings?: () => Promise<void>
}

export interface Platform {
  /** False on Firefox for Android, which has no keyboard commands or context menus. */
  readonly hasShortcuts: boolean
  readonly shortcutKeys: readonly string[]
  readonly openShortcutSettings: () => void
}

function openShortcutSettings(): void {
  const firefoxCommands = (globalThis as { browser?: { commands?: FirefoxCommands } }).browser?.commands
  if (firefoxCommands?.openShortcutSettings) {
    void firefoxCommands.openShortcutSettings()
    return
  }
  void chrome.tabs.create({ url: shortcutSettingsUrl(navigator.userAgent) })
}

export function usePlatform(): Platform {
  const hasShortcuts = Boolean(chrome.commands)
  const [shortcutKeys, setShortcutKeys] = useState<readonly string[]>([])

  useEffect(() => {
    if (!chrome.commands) return
    // Read the live binding: users can change or remove it in the browser's shortcut settings.
    void chrome.commands.getAll().then((commands) => {
      const shortcut = commands.find((command) => command.name === FIX_COMMAND)?.shortcut
      setShortcutKeys(formatShortcut(shortcut, isMacPlatform(navigator)))
    })
  }, [])

  return { hasShortcuts, shortcutKeys, openShortcutSettings }
}
