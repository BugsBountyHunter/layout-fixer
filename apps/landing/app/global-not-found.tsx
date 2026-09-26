import type { Metadata } from 'next'
import Link from 'next/link'
import { RootDocument } from '@/components/RootDocument'
import { getDictionary } from '@/lib/i18n'

const t = getDictionary('en')

export const metadata: Metadata = {
  title: `${t.notFound.title} — ${t.brand}`,
  icons: { icon: '/icon-32.png', apple: '/icon-128.png' },
}

export default function GlobalNotFound() {
  return (
    <RootDocument locale="en">
      <main id="main" className="container section">
        <h1 className="section-title">{t.notFound.title}</h1>
        <p className="lead">{t.notFound.body}</p>
        <p>
          <Link href="/" prefetch={false}>
            {t.notFound.home}
          </Link>
        </p>
      </main>
    </RootDocument>
  )
}
