import { devices, expect, test } from '@playwright/test'
import { DESKTOP_DOWNLOADS } from '../../lib/config'

const STORE_URL = 'https://chromewebstore.google.com/detail/cikmlhdhgneblnmkkmiolciffcgbgljj'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://layoutfixer.dev').replace(/\/$/, '')
const PAGES = [
  { path: '/', lang: 'en', dir: 'ltr', other: '/ar/' },
  { path: '/ar/', lang: 'ar', dir: 'rtl', other: '/' },
] as const

for (const page of PAGES) {
  test.describe(page.lang, () => {
    test('sets language and direction', async ({ page: p }) => {
      await p.goto(page.path)
      await expect(p.locator('html')).toHaveAttribute('lang', page.lang)
      await expect(p.locator('html')).toHaveAttribute('dir', page.dir)
      await expect(p.locator('h1')).toBeVisible()
    })

    test('links to the other language', async ({ page: p }) => {
      await p.goto(page.path)
      await expect(p.getByTestId('language-link').first()).toHaveAttribute('href', page.other)
    })

    test('every Add to Chrome link goes to the store', async ({ page: p }) => {
      await p.goto(page.path)
      const links = p.getByTestId('store-link')
      expect(await links.count()).toBeGreaterThanOrEqual(2)
      for (const link of await links.all()) await expect(link).toHaveAttribute('href', STORE_URL)
    })

    test('shows the promo video without autoplaying it', async ({ page: p, request }) => {
      await p.goto(page.path)
      const video = p.getByTestId('promo-video')
      await expect(video).toBeVisible()
      await expect(video).toHaveAttribute('controls', '')
      await expect(video).toHaveAttribute('preload', 'none')
      await expect(video).not.toHaveAttribute('autoplay')
      for (const attribute of ['src', 'poster']) {
        const url = await video.getAttribute(attribute)
        expect(url).toBeTruthy()
        expect((await request.get(url as string)).status()).toBe(200)
      }
    })

    test('offers the desktop downloads', async ({ page: p }) => {
      await p.goto(page.path)
      const section = p.getByTestId('desktop-section')
      await expect(section).toBeVisible()
      for (const [os, url] of Object.entries({
        mac: DESKTOP_DOWNLOADS.mac,
        windows: DESKTOP_DOWNLOADS.windows,
        linux: DESKTOP_DOWNLOADS.linux,
      })) {
        await expect(section.getByTestId(`download-${os}`)).toHaveAttribute('href', url)
      }
      await section.getByText(page.path === '/' ? 'Opening it for the first time' : 'عند فتحه أول مرة').click()
      await expect(section.getByText(/Open Anyway|الفتح على أي حال/)).toBeVisible()
    })

    test('makes no requests to other origins and none fail', async ({ page: p }) => {
      const foreign: string[] = []
      const failed: string[] = []
      p.on('request', (request) => {
        if (new URL(request.url()).origin !== 'http://localhost:4322') foreign.push(request.url())
      })
      p.on('response', (response) => {
        if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`)
      })
      await p.goto(page.path)
      await p.mouse.wheel(0, 10_000)
      await p.waitForLoadState('networkidle')
      expect(foreign).toEqual([])
      expect(failed).toEqual([])
    })

    test('has no horizontal scroll at phone width', async ({ page: p }) => {
      await p.setViewportSize({ width: 375, height: 812 })
      await p.goto(page.path)
      const { overflow, offenders } = await p.evaluate(() => {
        const width = document.documentElement.clientWidth
        // Name the elements that stick out, so a failure says what to fix (fonts differ between CI and a Mac).
        const offenders = Array.from(document.querySelectorAll('body *'))
          .filter((element) => {
            const box = element.getBoundingClientRect()
            return box.width > 0 && (box.right > width + 0.5 || box.left < -0.5)
          })
          .slice(0, 10)
          .map((element) => {
            const box = element.getBoundingClientRect()
            const name = `${element.tagName.toLowerCase()}.${Array.from(element.classList).join('.')}`
            return `${name} [${Math.round(box.left)}, ${Math.round(box.right)}] ${element.textContent?.trim().slice(0, 40)}`
          })
        return { overflow: document.documentElement.scrollWidth - width, offenders }
      })
      expect(overflow, offenders.join('\n')).toBeLessThanOrEqual(0)
    })

    test('keeps the header on one row at phone width', async ({ page: p }) => {
      await p.setViewportSize({ width: 375, height: 812 })
      await p.goto(page.path)
      const box = await p.locator('header').boundingBox()
      expect(box?.height).toBeLessThanOrEqual(60)
    })

    test('has share metadata', async ({ page: p }) => {
      await p.goto(page.path)
      await expect(p.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_URL}${page.path}`)
      await expect(p.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-(en|ar)\.png$/)
      await expect(p.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1)
    })
  })
}

test('the FAQ opens without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const p = await context.newPage()
  await p.goto('/')
  const first = p.locator('details').first()
  await first.locator('summary').click()
  await expect(first).toHaveAttribute('open', '')
  await context.close()
})

test('touch targets are at least 44px on touch screens', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['Pixel 7'] })
  const p = await context.newPage()
  await p.goto('/ar/')
  const targets = [
    p.locator('header').getByTestId('store-link'),
    p.locator('header').getByTestId('language-link'),
    p.locator('section[aria-labelledby="faq-title"] summary').first(),
    p.getByTestId('desktop-section').locator('summary'),
    p.locator('footer a').first(),
  ]
  for (const target of targets) {
    const box = await target.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  }
  await context.close()
})

test('publishes a sitemap listing both languages', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.ok()).toBe(true)
  const xml = await response.text()
  expect(xml).toContain(`<loc>${SITE_URL}/</loc>`)
  expect(xml).toContain(`<loc>${SITE_URL}/ar/</loc>`)
})

test('serves a 404 page for unknown paths', async ({ page }) => {
  const response = await page.goto('/does-not-exist/')
  expect(response?.status()).toBe(404)
  await expect(page.locator('h1')).toBeVisible()
})

test('FAQ questions are announced without the +/− sign', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('section[aria-labelledby="faq-title"] summary').first()).toHaveAccessibleName(
    'Does it read what I type?',
  )
})

test('the 404 page links its own icon', async ({ page }) => {
  await page.goto('/does-not-exist/')
  await expect(page.locator('link[rel="icon"]')).toHaveCount(1)
})
