import { getDictionary, type Locale } from '@/lib/i18n'
import { DesktopDownload } from './DesktopDownload'
import { Demo } from './demo/Demo'
import { Faq } from './Faq'
import { Features } from './Features'
import { Footer } from './Footer'
import { Header } from './Header'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { Privacy } from './Privacy'
import { PromoVideo } from './PromoVideo'

export function LandingPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)
  return (
    <>
      <Header t={t} locale={locale} />
      <main id="main">
        <Hero t={t} demo={<Demo labels={t.demo} />} />
        <PromoVideo t={t} />
        <HowItWorks t={t} />
        <Features t={t} />
        <Privacy t={t} />
        <DesktopDownload t={t} />
        <Faq t={t} />
      </main>
      <Footer t={t} locale={locale} />
    </>
  )
}
