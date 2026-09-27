import type { ReactNode } from 'react'
import { LINKS } from '@/lib/config'
import type { Dictionary } from '@/lib/i18n'
import { ShareButton } from './ShareButton'
import styles from './Support.module.css'

const ICONS = {
  star: <path d="m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6Z" />,
  bug: (
    <>
      <rect x="5" y="5" width="6" height="8.5" rx="3" />
      <path d="M8 5V3.5M6.5 3.5l-1-1.5M9.5 3.5l1-1.5M2.5 8.5H5M11 8.5h2.5M3 12.5l2-1M13 12.5l-2-1M3 5l2 1.2M13 5l-2 1.2" />
    </>
  ),
  globe: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12M8 2c1.7 1.8 2.5 3.8 2.5 6S9.7 12.2 8 14c-1.7-1.8-2.5-3.8-2.5-6S6.3 3.8 8 2Z" />
    </>
  ),
  code: <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />,
  share: <path d="M8 10V1.5M5 4.5l3-3 3 3M5.5 7h-2v7h9V7h-2" />,
  heart: <path d="M8 13.5S2 10 2 5.8a3.1 3.1 0 0 1 6-1.4 3.1 3.1 0 0 1 6 1.4C14 10 8 13.5 8 13.5Z" />,
  chevron: <path d="m6 3.5 4.5 4.5L6 12.5" />,
  /** The GitHub mark (Octicons, MIT), filled. */
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
    />
  ),
} as const

type IconName = keyof typeof ICONS

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

interface Action {
  readonly id: string
  readonly icon: IconName
  readonly href: string
  readonly title: string
  readonly detail?: string
}

function LinkRow({ action, newTab }: { action: Action; newTab: string }): ReactNode {
  return (
    <li>
      <a
        className={styles.row}
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={`support-${action.id}`}
      >
        <Icon name={action.icon} className={styles.icon} />
        <span className={styles.text}>
          <span className={styles.title}>{action.title}</span>
          {action.detail && <span className={styles.detail}>{action.detail}</span>}
        </span>
        <Icon name="chevron" size={16} className={styles.chevron} />
        <span className="visually-hidden"> ({newTab})</span>
      </a>
    </li>
  )
}

export function Support({ t }: { t: Dictionary }) {
  const s = t.support
  const actions: Action[] = [
    { id: 'rate', icon: 'star', href: LINKS.review, ...s.rate },
    { id: 'star', icon: 'github', href: LINKS.star, ...s.star },
    { id: 'bug', icon: 'bug', href: LINKS.reportBug, ...s.bug },
    { id: 'language', icon: 'globe', href: LINKS.requestLanguage, ...s.language },
    { id: 'contribute', icon: 'code', href: LINKS.contributing, ...s.contribute },
  ]
  return (
    <section id="support" className="section" aria-labelledby="support-title">
      <div className="container">
        <div className={styles.header}>
          <h2 id="support-title" className="section-title">
            {s.title}
          </h2>
          <p className="lead">{s.subtitle}</p>
        </div>
        <div className={styles.layout}>
          <ul className={styles.group}>
            {actions.map((action) => (
              <LinkRow key={action.id} action={action} newTab={s.newTab} />
            ))}
            <li className={styles.row}>
              <Icon name="share" className={styles.icon} />
              <span className={styles.text}>
                <span className={styles.title}>{s.share}</span>
              </span>
              <ShareButton
                url={LINKS.website}
                title={t.brand}
                text={s.shareText}
                label={s.shareButton}
                copiedLabel={s.copied}
              />
            </li>
          </ul>
          <div className={styles.donate}>
            <Icon name="heart" size={28} className={styles.heart} />
            <h3>{s.donateTitle}</h3>
            <p className="muted">{s.donateBody}</p>
            <a
              className="button button-primary"
              href={LINKS.donate}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="donate-link"
            >
              {s.donateButton}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
