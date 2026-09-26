import { invoke } from '@tauri-apps/api/core'
import { useEffect, useMemo } from 'react'
import { messagesFor, resolveLanguage } from '../i18n'
import { I18nProvider } from '../i18n/react'
import { Settings } from '../settings/Settings'
import { useSettings } from '../settings/useSettings'
import { useUpdater } from '../update/useUpdater'
import { Welcome } from '../welcome/Welcome'

/** The Settings window's page. It also shows the welcome on first launch. */
export function App() {
  const state = useSettings()
  const language = useMemo(
    () => resolveLanguage(state.settings.language, navigator.languages),
    [state.settings.language],
  )
  const showWelcome = state.loaded && !state.failed && !state.settings.welcomed
  const messages = useMemo(() => messagesFor(language), [language])
  const updater = useUpdater(state.loaded && state.settings.checkUpdates, messages)

  useEffect(() => {
    const m = messages
    const labels = {
      fix: m.trayFix,
      pause: m.trayPause,
      resume: m.trayResume,
      settings: m.traySettings,
      quit: m.trayQuit,
    }
    invoke('set_tray_labels', { labels }).catch((error: unknown) =>
      console.error('[layout-fixer] Could not translate the tray menu:', error),
    )
  }, [messages])

  useEffect(() => {
    if (!showWelcome) return
    invoke('show_settings').catch((error: unknown) =>
      console.error('[layout-fixer] Could not show the welcome:', error),
    )
  }, [showWelcome])

  if (!state.loaded) return null
  return (
    <I18nProvider language={language}>
      {showWelcome ? (
        <Welcome onDone={() => state.update({ welcomed: true })} />
      ) : (
        <Settings state={state} updater={updater} />
      )}
    </I18nProvider>
  )
}
