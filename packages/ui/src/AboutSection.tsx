import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { ExternalLinkIcon, HeartIcon, ShareIcon } from './icons'

export interface AboutLink {
  readonly id: string
  readonly label: string
  readonly href: string
  readonly icon: ReactNode
}

export interface AboutStrings {
  readonly title: string
  readonly share: string
  readonly copyLink: string
  readonly copied: string
  /** Shown with the address when the clipboard can't be written, so it can still be copied by hand. */
  readonly copyFailed: string
  readonly madeWith: string
  readonly love: string
  readonly by: string
  readonly author: string
  readonly newTab: string
}

interface Props {
  readonly strings: AboutStrings
  /** Rows above the share row (rate, report, request, contribute). */
  readonly links: readonly AboutLink[]
  /** The last row, below share. */
  readonly donate: AboutLink
  readonly shareUrl: string
  readonly authorUrl: string
  readonly version?: string
  /** Opens a link outside the page. Defaults to a normal new-tab link; the desktop app passes the system opener. */
  readonly onOpen?: (href: string) => void
  /** Defaults to the async Clipboard API. */
  readonly copy?: (text: string) => Promise<void>
}

type CopyState = 'idle' | 'copied' | 'failed'
const COPIED_MS = 2000

function defaultCopy(text: string): Promise<void> {
  if (!navigator.clipboard) return Promise.reject(new Error('Clipboard API unavailable'))
  return navigator.clipboard.writeText(text)
}

function ExternalLink({
  href,
  onOpen,
  newTab,
  className,
  children,
}: {
  readonly href: string
  readonly onOpen?: (href: string) => void
  readonly newTab: string
  readonly className?: string
  readonly children: ReactNode
}) {
  function open(event: MouseEvent<HTMLAnchorElement>) {
    if (!onOpen) return
    event.preventDefault()
    onOpen(href)
  }
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" onClick={open}>
      {children}
      <span className="visually-hidden"> ({newTab})</span>
    </a>
  )
}

function LinkRow({
  link,
  onOpen,
  newTab,
  className = 'row about-link',
}: {
  readonly link: AboutLink
  readonly onOpen?: (href: string) => void
  readonly newTab: string
  readonly className?: string
}) {
  return (
    <ExternalLink className={className} href={link.href} onOpen={onOpen} newTab={newTab}>
      <span className="about-icon">{link.icon}</span>
      <span className="row-label about-label">{link.label}</span>
      <span className="about-trailing">
        <ExternalLinkIcon size={14} />
      </span>
    </ExternalLink>
  )
}

export function AboutSection({
  strings,
  links,
  donate,
  shareUrl,
  authorUrl,
  version,
  onOpen,
  copy = defaultCopy,
}: Props) {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copyLink() {
    clearTimeout(timer.current)
    try {
      await copy(shareUrl)
      setCopyState('copied')
      timer.current = setTimeout(() => setCopyState('idle'), COPIED_MS)
    } catch (error) {
      console.warn('Layout Fixer: could not copy the link', error)
      setCopyState('failed')
    }
  }

  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <h2 id="about-title">{strings.title}</h2>
      <div className="group">
        {links.map((link) => (
          <LinkRow key={link.id} link={link} onOpen={onOpen} newTab={strings.newTab} />
        ))}
        <div className="row">
          <span className="about-icon">
            <ShareIcon />
          </span>
          <span className="row-label about-label">{strings.share}</span>
          <button type="button" onClick={() => void copyLink()} aria-live="polite">
            {copyState === 'copied' ? strings.copied : strings.copyLink}
          </button>
        </div>
        <LinkRow link={donate} onOpen={onOpen} newTab={strings.newTab} className="row about-link about-donate" />
      </div>
      {copyState === 'failed' && (
        <p className="footnote" role="status">
          {strings.copyFailed} <span dir="ltr">{shareUrl}</span>
        </p>
      )}
      <p className="footnote about-credit">
        {strings.madeWith}{' '}
        <span className="about-heart" role="img" aria-label={strings.love}>
          <HeartIcon size={12} />
        </span>{' '}
        {strings.by}{' '}
        <ExternalLink href={authorUrl} onOpen={onOpen} newTab={strings.newTab}>
          {strings.author}
        </ExternalLink>
        {version && <> · {version}</>}
      </p>
    </section>
  )
}
