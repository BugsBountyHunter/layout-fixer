import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const en = `${SITE_URL}/`
  const ar = `${SITE_URL}/ar/`
  return [
    { url: en, alternates: { languages: { ar } } },
    { url: ar, alternates: { languages: { en } } },
  ]
}
