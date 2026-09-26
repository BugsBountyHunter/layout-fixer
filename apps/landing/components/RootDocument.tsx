import type { ReactNode } from 'react'
import '@layout-fixer/ui/tokens.css'
import '@/app/globals.css'
import { direction, getDictionary, type Locale } from '@/lib/i18n'

/** The <html> document both root layouts (and the 404 page) share; only the locale differs. */
export function RootDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={locale} dir={direction(locale)}>
      <body>
        <a className="skip-link" href="#main">
          {getDictionary(locale).skipLink}
        </a>
        {children}
      </body>
    </html>
  )
}
