import { describe, expect, it } from 'vitest'
import { resolveSiteUrl } from '@/lib/config'

describe('resolveSiteUrl', () => {
  it('prefers the explicit site URL', () => {
    const env = { NEXT_PUBLIC_SITE_URL: 'https://layoutfixer.app', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' }
    expect(resolveSiteUrl(env)).toBe('https://layoutfixer.app')
  })

  it("uses Vercel's production domain when no site URL is set", () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'layout-fixer-abc.vercel.app' })).toBe(
      'https://layout-fixer-abc.vercel.app',
    )
  })

  it('falls back to the default outside Vercel', () => {
    expect(resolveSiteUrl({})).toBe('https://layoutfixer.dev')
  })

  it('drops a trailing slash so paths can be appended', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://layoutfixer.app/' })).toBe('https://layoutfixer.app')
  })
})
