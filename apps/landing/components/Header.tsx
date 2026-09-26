import Image from 'next/image'
import Link from 'next/link'
import { STORE_URL } from '@/lib/config'
import { type Dictionary, type Locale, localePath, otherLocale } from '@/lib/i18n'
import styles from './Header.module.css'

export function Header({ t, locale }: { t: Dictionary; locale: Locale }) {
  const other = otherLocale(locale)
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link className={styles.brand} href={localePath(locale)} prefetch={false}>
          <Image src="/icon-128.png" width={28} height={28} alt="" />
          <span className={styles.brandName}>{t.brand}</span>
        </Link>
        <nav className={styles.actions}>
          <Link
            className={styles.languageLink}
            href={localePath(other)}
            hrefLang={other}
            lang={other}
            prefetch={false}
            data-testid="language-link"
          >
            {t.nav.switchLanguage}
          </Link>
          <a className="button button-secondary button-small" href={STORE_URL} data-testid="store-link">
            {t.nav.addToChrome}
          </a>
        </nav>
      </div>
    </header>
  )
}
