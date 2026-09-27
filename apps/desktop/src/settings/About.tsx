import { LINKS } from '@layout-fixer/core/links'
import { AboutSection } from '@layout-fixer/ui/AboutSection'
import { BugIcon, GitHubIcon, GlobeIcon, HeartIcon } from '@layout-fixer/ui/icons'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useMessages } from '../i18n/react'
import { ABOUT_URLS } from './aboutLinks'

/** Links open in the default browser; capabilities/default.json allows exactly these URLs. */
function openInBrowser(url: string) {
  openUrl(url).catch((error: unknown) => console.error('Layout Fixer: could not open', url, error))
}

export function About({ version }: { readonly version: string | null }) {
  const m = useMessages()
  return (
    <AboutSection
      strings={{
        title: m.aboutSection,
        share: m.aboutShare,
        copyLink: m.aboutCopyLink,
        copied: m.aboutCopied,
        copyFailed: m.aboutCopyFailed,
        madeWith: m.aboutMadeWith,
        love: m.aboutLove,
        by: m.aboutBy,
        author: m.aboutAuthor,
        newTab: m.aboutNewTab,
      }}
      links={[
        { id: 'bug', label: m.aboutReportBug, href: ABOUT_URLS.reportBug, icon: <BugIcon /> },
        { id: 'language', label: m.aboutRequestLanguage, href: ABOUT_URLS.requestLanguage, icon: <GlobeIcon /> },
        { id: 'contribute', label: m.aboutContribute, href: ABOUT_URLS.contribute, icon: <GitHubIcon /> },
      ]}
      donate={{ id: 'donate', label: m.aboutDonate, href: ABOUT_URLS.donate, icon: <HeartIcon /> }}
      shareUrl={LINKS.website}
      authorUrl={ABOUT_URLS.author}
      version={version ? m.appVersion(version) : undefined}
      onOpen={openInBrowser}
    />
  )
}
