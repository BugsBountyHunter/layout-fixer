import { defaultLayout } from '@layout-fixer/core/layouts'
import { isMacPlatform } from '../platform/os'
import { AccessibilitySection } from './AccessibilitySection'
import { LayoutChoices } from './LayoutChoices'
import { ShortcutSection } from './ShortcutSection'
import { STRINGS } from './strings'
import { useAccessibility, useShortcutInfo } from './useNative'
import { useSettings } from './useSettings'

const IS_MAC = isMacPlatform(navigator.userAgent)

export function Settings() {
  const { settings, failed, update } = useSettings()
  const shortcut = useShortcutInfo()
  const accessibility = useAccessibility(IS_MAC)

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

      {IS_MAC && <AccessibilitySection trusted={accessibility.trusted} onRequest={accessibility.request} />}

      <ShortcutSection info={shortcut} isMac={IS_MAC} />

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
