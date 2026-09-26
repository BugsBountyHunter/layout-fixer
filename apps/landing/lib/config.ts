const DEFAULT_SITE_URL = 'https://layoutfixer.dev'

interface SiteEnv {
  readonly NEXT_PUBLIC_SITE_URL?: string
  readonly VERCEL_PROJECT_PRODUCTION_URL?: string
}

/**
 * Canonical URLs, share cards and the sitemap need the real domain. On Vercel the production domain is known at
 * build time, so an unset NEXT_PUBLIC_SITE_URL can't point them at a subdomain someone else owns.
 */
export function resolveSiteUrl(env: SiteEnv): string {
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined
  return (env.NEXT_PUBLIC_SITE_URL || vercel || DEFAULT_SITE_URL).replace(/\/$/, '')
}

export const SITE_URL = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
})

export const STORE_URL = 'https://chromewebstore.google.com/detail/cikmlhdhgneblnmkkmiolciffcgbgljj'
export const GITHUB_URL = 'https://github.com/BugsBountyHunter/layout-fixer'
export const PRIVACY_URL = `${GITHUB_URL}/blob/main/PRIVACY.md`
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`

/** Rolling release that always holds the newest desktop installers under stable names (see layout-fixer docs/desktop-release.md). */
export const DESKTOP_RELEASE_URL = `${GITHUB_URL}/releases/tag/desktop-latest`
const DESKTOP_DOWNLOAD_BASE = `${GITHUB_URL}/releases/download/desktop-latest`
export const DESKTOP_DOWNLOADS = {
  mac: `${DESKTOP_DOWNLOAD_BASE}/Layout-Fixer-macOS.dmg`,
  windows: `${DESKTOP_DOWNLOAD_BASE}/Layout-Fixer-Windows-setup.exe`,
  linux: `${DESKTOP_DOWNLOAD_BASE}/Layout-Fixer-Linux.AppImage`,
  linuxDeb: `${DESKTOP_DOWNLOAD_BASE}/Layout-Fixer-Linux.deb`,
} as const

/** Rendered with `npm run render` in the extension repo's apps/promo-video; the poster is frame 560 (the fix). */
export const PROMO_VIDEO = {
  src: '/video/layout-fixer.mp4',
  poster: '/video/layout-fixer-poster.jpg',
} as const
