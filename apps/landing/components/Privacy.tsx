import { PRIVACY_URL } from '@/lib/config'
import type { Dictionary } from '@/lib/i18n'
import styles from './Privacy.module.css'

export function Privacy({ t }: { t: Dictionary }) {
  return (
    <section className="section section-grouped" aria-labelledby="privacy-title">
      <div className={`container narrow ${styles.privacy}`}>
        <svg className={styles.icon} viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z"
          />
        </svg>
        <h2 id="privacy-title" className={`section-title ${styles.title}`}>
          {t.privacy.title}
        </h2>
        <p className={`lead ${styles.body}`}>{t.privacy.body}</p>
        <a href={PRIVACY_URL}>{t.privacy.link}</a>
      </div>
    </section>
  )
}
