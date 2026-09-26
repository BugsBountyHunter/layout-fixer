import { ShortcutKeys } from '@layout-fixer/ui/ShortcutKeys'
import { useMessages } from '../i18n/react'
import { formatAccelerator } from '../platform/accelerator'
import { isMacPlatform } from '../platform/os'
import { AccessibilitySection } from '../settings/AccessibilitySection'
import { useAccessibility, useShortcutInfo } from '../settings/useNative'

const IS_MAC = isMacPlatform(navigator.userAgent)

/** First launch: what the app does, the macOS permission, and a field to try the shortcut in. */
export function Welcome({ onDone }: { readonly onDone: () => void }) {
  const m = useMessages()
  const [shortcut] = useShortcutInfo()
  const accessibility = useAccessibility(IS_MAC)

  return (
    <main className="settings welcome">
      <header className="settings-header">
        <h1>{m.welcomeTitle}</h1>
        <p>{m.welcomeBody}</p>
      </header>

      {IS_MAC && <AccessibilitySection trusted={accessibility.trusted} onRequest={accessibility.request} />}

      <section className="section" aria-labelledby="try-title">
        <h2 id="try-title">
          {m.welcomeTry} {shortcut && <ShortcutKeys keys={formatAccelerator(shortcut.accelerator, IS_MAC)} />}
        </h2>
        <div className="group">
          <textarea
            className="try-field"
            aria-label={m.welcomeTryLabel}
            defaultValue={m.welcomeSample}
            dir="auto"
            rows={2}
            spellCheck={false}
          />
        </div>
      </section>

      <div className="welcome-actions">
        <button type="button" className="primary" onClick={onDone}>
          {m.welcomeDone}
        </button>
      </div>
    </main>
  )
}
