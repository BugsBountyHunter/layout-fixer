import Link from 'next/link'
import { GITHUB_URL, LICENSE_URL, LINKS, PRIVACY_URL } from '@/lib/config'
import { type Dictionary, type Locale, localePath, otherLocale } from '@/lib/i18n'
import styles from './Footer.module.css'
import { Icon } from './Support'

export function Footer({ t, locale }: { t: Dictionary; locale: Locale }) {
  const other = otherLocale(locale)
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.credit}>
          <span>© 2026 {t.brand}</span>
          <span aria-hidden="true"> · </span>
          <span data-testid="made-with-love">
            {t.footer.madeWith}{' '}
            <span className={styles.heart} role="img" aria-label={t.footer.love}>
              <Icon name="heart" size={14} />
            </span>{' '}
            {t.footer.by} <a href={LINKS.author}>{t.footer.author}</a>
          </span>
        </p>
        <ul className={styles.links}>
          <li>
            <a href={GITHUB_URL}>{t.footer.github}</a>
          </li>
          <li>
            <a href={PRIVACY_URL}>{t.footer.privacy}</a>
          </li>
          <li>
            <a href={LICENSE_URL}>{t.footer.license}</a>
          </li>
          <li>
            <a href={LINKS.donate}>{t.footer.donate}</a>
          </li>
          <li>
            <Link href={localePath(other)} hrefLang={other} lang={other} prefetch={false} data-testid="language-link">
              {t.nav.switchLanguage}
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}
