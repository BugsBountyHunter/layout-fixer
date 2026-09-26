import type { ReactNode } from 'react'
import { STORE_URL } from '@/lib/config'
import type { Dictionary } from '@/lib/i18n'
import styles from './Hero.module.css'

export function Hero({ t, demo }: { t: Dictionary; demo: ReactNode }) {
  return (
    <section className={`container ${styles.hero}`}>
      <div>
        <h1 className={styles.title}>
          {t.hero.title} <span className={styles.accent}>{t.hero.titleAccent}</span>
        </h1>
        <p className={`lead ${styles.lead}`}>{t.hero.subtitle}</p>
        <div className={styles.actions}>
          <a className="button button-primary button-large" href={STORE_URL} data-testid="store-link">
            {t.hero.cta}
          </a>
          <p className="muted small">{t.hero.comingSoon}</p>
        </div>
      </div>
      {demo}
    </section>
  )
}
