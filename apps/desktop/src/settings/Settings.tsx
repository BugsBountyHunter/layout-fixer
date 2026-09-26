import { defaultLayout } from '@layout-fixer/core/layouts'
import { useMessages } from '../i18n/react'
import { isMacPlatform } from '../platform/os'
import type { Updater } from '../update/useUpdater'
import { AccessibilitySection } from './AccessibilitySection'
import { GeneralSection } from './GeneralSection'
import { LayoutChoices } from './LayoutChoices'
import { ShortcutSection } from './ShortcutSection'
import { UpdatesSection } from './UpdatesSection'
import { useAccessibility, useShortcutInfo, useWaylandSession } from './useNative'
import type { SettingsState } from './useSettings'
import { WaylandNotice } from './WaylandNotice'

const IS_MAC = isMacPlatform(navigator.userAgent)

export function Settings({ state, updater }: { readonly state: SettingsState; readonly updater: Updater }) {
  const m = useMessages()
  const { settings, failed, update } = state
  const [shortcut, setShortcut] = useShortcutInfo()
  const accessibility = useAccessibility(IS_MAC)
  const wayland = useWaylandSession()

  return (
    <main className="settings">
      <header className="settings-header">
        <h1>{m.appName}</h1>
        <p>{m.subtitle}</p>
      </header>

      {failed && (
        <p className="notice" role="alert">
          {m.loadError}
        </p>
      )}
      {wayland && <WaylandNotice />}
      {IS_MAC && <AccessibilitySection trusted={accessibility.trusted} onRequest={accessibility.request} />}

      <ShortcutSection
        info={shortcut}
        isMac={IS_MAC}
        onChanged={(info) => {
          setShortcut(info)
          update({ shortcut: info.accelerator })
        }}
      />

      <GeneralSection settings={settings} update={update} />

      <section className="section" aria-labelledby="layout-title">
        <h2 id="layout-title">{m.layoutSection}</h2>
        <div className="group">
          <LayoutChoices
            value={settings.arabicLayout}
            autoLayout={defaultLayout(IS_MAC)}
            onChange={(arabicLayout) => update({ arabicLayout })}
          />
        </div>
      </section>

      <UpdatesSection
        automatic={settings.checkUpdates}
        onAutomaticChange={(checkUpdates) => update({ checkUpdates })}
        updater={updater}
      />

      <section className="section" aria-labelledby="privacy-title">
        <h2 id="privacy-title">{m.privacyTitle}</h2>
        <p className="footnote">{m.privacyBody}</p>
      </section>
    </main>
  )
}
