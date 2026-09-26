import { t } from '../../platform/i18n'
import { type ArabicLayoutChoice, resolveLayout, type Settings } from '../../platform/settings'
import { isMacPlatform } from '../../platform/shortcut'
import { LayoutPicker } from './LayoutPicker'
import { Section } from './Section'

interface Props {
  readonly settings: Settings
  readonly onChange: (arabicLayout: ArabicLayoutChoice) => void
}

export function ArabicLayoutSection({ settings, onChange }: Props) {
  const autoLayout = resolveLayout({ ...settings, arabicLayout: 'auto' }, isMacPlatform(navigator))
  return (
    <Section id="layout" title={t('layoutSectionTitle')} hint={t('layoutSectionHint')}>
      <LayoutPicker value={settings.arabicLayout} autoLayout={autoLayout} onChange={onChange} />
    </Section>
  )
}
