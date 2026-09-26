import type { Metadata } from 'next'
import { SITE_URL } from '../config'
import { ar } from './ar'
import { type Dictionary, en } from './en'

export type { Dictionary } from './en'
export type Locale = 'en' | 'ar'

export const LOCALES: readonly Locale[] = ['en', 'ar']

const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = { en, ar }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

/** English lives at the site root, Arabic under /ar/. */
export function localePath(locale: Locale): '/' | '/ar/' {
  return locale === 'en' ? '/' : '/ar/'
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ar' : 'en'
}

export function direction(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function pageMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale)
  const path = localePath(locale)
  return {
    metadataBase: new URL(SITE_URL),
    title: t.meta.title,
    description: t.meta.description,
    alternates: { canonical: path, languages: { en: '/', ar: '/ar/', 'x-default': '/' } },
    icons: { icon: '/icon-32.png', apple: '/icon-128.png' },
    openGraph: {
      type: 'website',
      siteName: t.brand,
      title: t.meta.title,
      description: t.meta.description,
      url: path,
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      images: [{ url: `/og-${locale}.png`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
  }
}
