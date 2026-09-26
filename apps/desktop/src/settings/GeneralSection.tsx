import { SwitchRow } from '@layout-fixer/ui/SwitchRow'
import { LANGUAGE_CHOICES, LANGUAGE_NAMES, type LanguageChoice } from '../i18n'
import { useMessages } from '../i18n/react'
import type { DesktopSettings } from '../platform/settings'
import { useLaunchAtLogin } from './useNative'

interface Props {
  readonly settings: DesktopSettings
  readonly update: (patch: Partial<DesktopSettings>) => void
}

export function GeneralSection({ settings, update }: Props) {
  const m = useMessages()
  const [launchAtLogin, setLaunchAtLogin] = useLaunchAtLogin()

  return (
    <section className="section" aria-labelledby="general-title">
      <h2 id="general-title">{m.generalSection}</h2>
      <div className="group">
        {launchAtLogin !== null && (
          <SwitchRow label={m.launchAtLogin} checked={launchAtLogin} onChange={setLaunchAtLogin} />
        )}
        <SwitchRow
          label={m.showMessages}
          checked={settings.showMessages}
          onChange={(showMessages) => update({ showMessages })}
        />
        <label className="row">
          <span className="row-label">{m.language}</span>
          <select
            value={settings.language}
            onChange={(event) => update({ language: event.target.value as LanguageChoice })}
          >
            {LANGUAGE_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {choice === 'auto' ? m.languageAuto : LANGUAGE_NAMES[choice]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="footnote">{m.showMessagesHint}</p>
    </section>
  )
}
