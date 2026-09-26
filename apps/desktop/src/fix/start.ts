import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { isMacPlatform } from '../platform/os'
import { loadSettings, resolveLayout } from '../platform/settings'
import { settingsStore } from '../platform/store'
import { tauriBridge } from './bridge'
import { createFixHandler } from './engine'

const FIX_EVENT = 'fix-selection'
const IS_MAC = isMacPlatform(navigator.userAgent)

/** Runs in the Settings page, which stays loaded (hidden) while the app is in the tray. */
export function startFixEngine(): void {
  const handle = createFixHandler({
    bridge: tauriBridge,
    resolveLayout: async () => resolveLayout(await loadSettings(await settingsStore()), IS_MAC),
    showMessage: (message) => {
      invoke('show_hud', { message }).catch((error: unknown) => console.error('[layout-fixer] HUD failed:', error))
    },
    onAccessibilityDenied: () => {
      invoke('request_accessibility').catch((error: unknown) =>
        console.error('[layout-fixer] Could not open Accessibility settings:', error),
      )
    },
  })
  listen(FIX_EVENT, () => void handle()).catch((error: unknown) =>
    console.error('[layout-fixer] Could not listen for the shortcut:', error),
  )
}
