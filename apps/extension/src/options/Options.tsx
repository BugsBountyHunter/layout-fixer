import { SwitchRow } from '@layout-fixer/ui/SwitchRow'
import { t } from '../platform/i18n'
import type { Settings } from '../platform/settings'
import { usePlatform } from '../ui/usePlatform'
import { useSettings } from '../ui/useSettings'
import { ArabicLayoutSection } from './components/ArabicLayoutSection'
import { LanguagePairPicker } from './components/LanguagePairPicker'
import { PageHeader } from './components/PageHeader'
import { PrivacyNote } from './components/PrivacyNote'
import { Section } from './components/Section'
import { SelectionButtonSetting } from './components/SelectionButtonSetting'
import { ShortcutSetting } from './components/ShortcutSetting'
import { useSavedFlash } from './useSavedFlash'

export function Options() {
  const platform = usePlatform()
  const { settings, loaded, update } = useSettings()
  const saved = useSavedFlash()

  async function change(patch: Partial<Settings>) {
    await update(patch)
    saved.flash()
  }

  return (
    <main className="options" aria-busy={!loaded}>
      <PageHeader saved={saved.visible} />

      <Section id="languages" title={t('languagesSectionTitle')} hint={t('languagesSectionHint')}>
        <LanguagePairPicker value={settings.languages} onChange={(languages) => void change({ languages })} />
      </Section>

      {settings.languages.includes('ar') && (
        <ArabicLayoutSection settings={settings} onChange={(arabicLayout) => void change({ arabicLayout })} />
      )}

      <Section id="selection" title={t('selectionSectionTitle')} hint={t('selectionSectionHint')}>
        <SelectionButtonSetting
          enabled={settings.selectionButton}
          onChange={(selectionButton) => change({ selectionButton })}
        />
      </Section>

      {platform.hasShortcuts && (
        <Section id="shortcut" title={t('shortcutSectionTitle')} hint={t('shortcutSectionHint')}>
          <ShortcutSetting {...platform} />
        </Section>
      )}

      <Section id="toasts" title={t('toastSectionTitle')} hint={t('toastSectionHint')}>
        <SwitchRow
          label={t('toastSectionLabel')}
          checked={settings.showToasts}
          onChange={(showToasts) => void change({ showToasts })}
        />
      </Section>

      <PrivacyNote />
    </main>
  )
}
