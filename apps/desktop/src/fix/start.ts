import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { messagesFor, resolveLanguage } from '../i18n'
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
    context: async () => {
      const settings = await loadSettings(await settingsStore())
      return {
        layout: resolveLayout(settings, IS_MAC),
        messages: messagesFor(resolveLanguage(settings.language, navigator.languages)),
        showMessages: settings.showMessages,
      }
    },
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
