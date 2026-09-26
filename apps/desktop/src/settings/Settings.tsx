import { defaultLayout } from '@layout-fixer/core/layouts'
import { isMacPlatform } from '../platform/os'
import { LayoutChoices } from './LayoutChoices'
import { STRINGS } from './strings'
import { useSettings } from './useSettings'

const IS_MAC = isMacPlatform(navigator.userAgent)

export function Settings() {
  const { settings, failed, update } = useSettings()

  return (
    <main className="settings">
      <header className="settings-header">
        <h1>{STRINGS.title}</h1>
        <p>{STRINGS.subtitle}</p>
      </header>

      {failed && (
        <p className="notice" role="alert">
          {STRINGS.loadError}
        </p>
      )}

      <section className="section" aria-labelledby="layout-title">
        <h2 id="layout-title">{STRINGS.layoutSection}</h2>
        <div className="group">
          <LayoutChoices
            value={settings.arabicLayout}
            autoLayout={defaultLayout(IS_MAC)}
            onChange={(arabicLayout) => update({ arabicLayout })}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="privacy-title">
        <h2 id="privacy-title">{STRINGS.privacyTitle}</h2>
        <p className="footnote">{STRINGS.privacyBody}</p>
      </section>
    </main>
  )
}
