import { LINKS } from '@layout-fixer/core/links'
import { type AboutLink, AboutSection } from '@layout-fixer/ui/AboutSection'
import { BugIcon, GitHubIcon, GlobeIcon, HeartIcon, StarIcon } from '@layout-fixer/ui/icons'
import { t } from '../../platform/i18n'

/** Only the Chrome Web Store listing exists so far; the Firefox build has nowhere to send ratings. */
const HAS_STORE_LISTING = import.meta.env.MODE !== 'firefox'

export function aboutLinks(hasStoreListing: boolean): AboutLink[] {
  const links: AboutLink[] = [
    { id: 'bug', label: t('aboutReportBug'), href: LINKS.reportBug, icon: <BugIcon /> },
    { id: 'language', label: t('aboutRequestLanguage'), href: LINKS.requestLanguage, icon: <GlobeIcon /> },
    { id: 'contribute', label: t('aboutContribute'), href: LINKS.repo, icon: <GitHubIcon /> },
  ]
  const rate: AboutLink = { id: 'rate', label: t('aboutRate'), href: LINKS.review, icon: <StarIcon /> }
  return hasStoreListing ? [rate, ...links] : links
}

export function About() {
  return (
    <AboutSection
      strings={{
        title: t('aboutTitle'),
        share: t('aboutShare'),
        copyLink: t('aboutCopyLink'),
        copied: t('aboutCopied'),
        copyFailed: t('aboutCopyFailed'),
        madeWith: t('aboutMadeWith'),
        love: t('aboutLove'),
        by: t('aboutBy'),
        author: t('aboutAuthor'),
        newTab: t('aboutNewTab'),
      }}
      links={aboutLinks(HAS_STORE_LISTING)}
      donate={{ id: 'donate', label: t('aboutDonate'), href: LINKS.donate, icon: <HeartIcon /> }}
      shareUrl={LINKS.website}
      authorUrl={LINKS.author}
    />
  )
}
