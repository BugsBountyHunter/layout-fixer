'use client'

import { useSyncExternalStore } from 'react'
import { DESKTOP_DOWNLOADS, DESKTOP_RELEASE_URL } from '@/lib/config'
import { type DesktopOs, detectDesktopOs } from '@/lib/desktopOs'
import type { Dictionary } from '@/lib/i18n'
import styles from './DesktopDownload.module.css'

const noSubscribe = () => () => {}

/** Null during the server render and hydration, so every button starts equal and none flickers. */
function useDesktopOs(): DesktopOs | null {
  return useSyncExternalStore(
    noSubscribe,
    () => detectDesktopOs(navigator),
    () => null,
  )
}

const ORDER: readonly DesktopOs[] = ['mac', 'windows', 'linux']

export function DesktopDownload({ t }: { t: Dictionary }) {
  const os = useDesktopOs()
  // The visitor's own system first and highlighted.
  const order = os ? [os, ...ORDER.filter((other) => other !== os)] : ORDER

  return (
    <section id="desktop" className="section" aria-labelledby="desktop-title" data-testid="desktop-section">
      <div className={`container narrow ${styles.desktop}`}>
        <span className={styles.chip}>{t.desktop.eyebrow}</span>
        <h2 id="desktop-title" className={`section-title ${styles.title}`}>
          {t.desktop.title}
        </h2>
        <p className="lead">{t.desktop.body}</p>
        <div className={styles.buttons}>
          {order.map((system) => (
            <a
              key={system}
              className={`button ${system === os ? 'button-primary' : 'button-secondary'}`}
              href={DESKTOP_DOWNLOADS[system]}
              data-testid={`download-${system}`}
            >
              {t.desktop[system]}
            </a>
          ))}
        </div>
        <p className={styles.note}>
          {t.desktop.note} · <a href={DESKTOP_DOWNLOADS.linuxDeb}>{t.desktop.linuxDeb}</a> ·{' '}
          <a href={DESKTOP_RELEASE_URL}>{t.desktop.allReleases}</a>
        </p>
        <details className={styles.firstLaunch}>
          <summary>{t.desktop.firstLaunchTitle}</summary>
          <ul>
            <li>{t.desktop.firstLaunchMac}</li>
            <li>{t.desktop.firstLaunchWindows}</li>
            <li>{t.desktop.firstLaunchLinux}</li>
          </ul>
        </details>
      </div>
    </section>
  )
}
