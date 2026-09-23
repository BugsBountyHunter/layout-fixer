// Renders Chrome Web Store images from the real extension (dist/e2e build):
// five 1280×800 screenshots, the 440×280 promo tile and the 1400×560 marquee.
//
//   npm run build:e2e && node scripts/store-screenshots.mjs --locale en
//
// The extension UI follows the browser language and Chromium on macOS ignores --lang, so the
// published images are rendered on Linux, which also shows Windows-style shortcut labels:
//   npm run store:screenshots   (Docker; renders en and ar)
import { mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const locale = process.argv.includes('--locale') ? process.argv[process.argv.indexOf('--locale') + 1] : 'en'
const EXTENSION = fileURLToPath(new URL('../dist/e2e', import.meta.url))
const OUT = fileURLToPath(new URL(`../docs/store/screenshots/${locale}/`, import.meta.url))
const ORIGIN = 'http://127.0.0.1:4173'
const RTL = locale === 'ar'

const COPY = {
  en: {
    selection: ['Typed in the wrong language?', 'Select the text, click the icon, done.'],
    shortcut: ['Or press Alt+Shift+F', 'Fixed in place — Ctrl+Z undoes it.'],
    popup: ['Paste and fix', 'The popup converts as you type.'],
    settings: ['Your keyboard, your way', 'PC or Mac Arabic layout, detected automatically.'],
    privacy: ['Private by design', 'Everything happens on your device. Nothing is collected.'],
    tagline: 'Arabic–English keyboard fix',
    chatName: 'Sara',
    chatReply: 'See you tomorrow!',
    author: 'Ahmed',
    compose: 'Message',
  },
  ar: {
    selection: ['كتبت واللغة خطأ؟', 'حدد النص، انقر الأيقونة، وانتهى.'],
    shortcut: ['أو اضغط Alt+Shift+F', 'يُصحَّح في مكانه — ويمكنك التراجع.'],
    popup: ['الصق وصحّح', 'تتحول الكتابة فورًا داخل النافذة.'],
    settings: ['يناسب لوحة مفاتيحك', 'تخطيط PC أو Mac، يُكتشف تلقائيًا.'],
    privacy: ['خصوصيتك أولًا', 'كل شيء يحدث على جهازك. لا جمع لأي بيانات.'],
    tagline: 'تصحيح لغة الكيبورد بين العربي والإنجليزي',
    chatName: 'سارة',
    chatReply: 'نراك غدًا!',
    author: 'أحمد',
    compose: 'رسالة',
  },
}[locale]

const FONT = `system-ui, -apple-system, 'SF Pro Text', 'SF Arabic', 'Segoe UI', 'Noto Sans Arabic', sans-serif`

/** Headlines use embedded Plex Arabic so every OS renders the same weights in both scripts. */
const PLEX = new URL('../node_modules/@fontsource/ibm-plex-sans-arabic/files/', import.meta.url)
const HEADLINE_FONT_FACES = ['latin', 'arabic']
  .flatMap((subset) =>
    [400, 700].map((weight) => {
      const data = readFileSync(new URL(`ibm-plex-sans-arabic-${subset}-${weight}-normal.woff2`, PLEX)).toString(
        'base64',
      )
      return `@font-face{font-family:Headline;font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2')}`
    }),
  )
  .join('')
const HEADLINE = `Headline, ${FONT}`

/** A neutral, unbranded messaging page — store images must not imitate real products. */
function chatPage() {
  return `<!doctype html><meta charset="utf-8"><body dir="${RTL ? 'rtl' : 'ltr'}" style="margin:0;font:17px/1.5 ${FONT};background:#f5f5f7;color:#1d1d1f">
  <div style="max-width:620px;margin:40px auto;background:#fff;border-radius:16px;padding:28px 32px;box-shadow:0 1px 3px #0001">
    <p style="margin:0 0 6px;color:#6e6e73;font-size:13px">${COPY.chatName}</p>
    <p style="margin:0 0 22px">${COPY.chatReply}</p>
    <p style="margin:0 0 6px;color:#6e6e73;font-size:13px">${COPY.author}</p>
    <p style="margin:0" id="typed"><span id="gibberish">hgsghl ugd;l ;dt phg;?</span></p>
  </div></body>`
}

function composePage(value) {
  return `<!doctype html><meta charset="utf-8"><body dir="${RTL ? 'rtl' : 'ltr'}" style="margin:0;font:17px/1.5 ${FONT};background:#f5f5f7">
  <div style="max-width:340px;margin:32px auto;background:#fff;border-radius:16px;padding:20px;box-shadow:0 1px 3px #0001">
    <p style="margin:0 0 10px;color:#6e6e73;font-size:13px">${COPY.compose}</p>
    <textarea id="field" dir="auto" style="box-sizing:border-box;width:100%;height:96px;padding:12px 14px;border:1px solid #d2d2d7;border-radius:10px;font:inherit;resize:none">${value}</textarea>
  </div></body>`
}

const ARROW = `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#86868b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none${RTL ? ';transform:scaleX(-1)' : ''}"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`

/** Store frame: headline + supporting line above captured UI, scaled up from 2× captures to stay sharp. */
function frame({ title, subtitle, images, scale = 1.5, dark = false, fade = false }) {
  const bg = dark ? '#1c1c1e' : '#f5f5f7'
  const fg = dark ? '#f5f5f7' : '#1d1d1f'
  const sub = dark ? '#a1a1a6' : '#6e6e73'
  const shots = images
    .map(({ src, width }) => {
      const mask = fade ? ';mask-image:linear-gradient(to bottom,#000 78%,transparent)' : ''
      const shadow = fade ? '' : ';box-shadow:0 0 0 1px #0000000d,0 20px 50px #0000002e'
      return `<img src="${src}" style="width:${Math.round(width * scale)}px;border-radius:14px${shadow}${mask}">`
    })
    .join(images.length > 1 ? ARROW : '')
  return `<!doctype html><meta charset="utf-8"><style>${HEADLINE_FONT_FACES}</style><body dir="${RTL ? 'rtl' : 'ltr'}" style="margin:0;width:1280px;height:800px;overflow:hidden;background:${bg};font-family:${HEADLINE};display:flex;flex-direction:column;align-items:center">
    <h1 style="margin:64px 0 8px;font-size:48px;font-weight:700;letter-spacing:${RTL ? 0 : '-0.02em'};color:${fg}">${title}</h1>
    <p style="margin:0 0 40px;font-size:22px;color:${sub}">${subtitle}</p>
    <div style="display:flex;gap:28px;align-items:center">${shots}</div></body>`
}

async function capture(page, clip) {
  const src = `data:image/png;base64,${(await page.screenshot({ clip })).toString('base64')}`
  return { src, width: clip.width, height: clip.height }
}

async function render(page, html, path, size = { width: 1280, height: 800 }) {
  await page.goto('about:blank')
  await page.setViewportSize(size)
  await page.setContent(html)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150)
  await page.screenshot({ path })
}

async function openFixture(context, page, html) {
  const url = `${ORIGIN}/${Math.random().toString(36).slice(2)}.html`
  await context.route(url, (route) => route.fulfill({ contentType: 'text/html', body: html }))
  await page.goto(url)
}

async function selectionShot(context, page) {
  await page.setViewportSize({ width: 700, height: 280 })
  await openFixture(context, page, chatPage())
  const box = await page.locator('#gibberish').boundingBox()
  await page.mouse.move(box.x + 1, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 6 })
  await page.mouse.up()
  await page.locator('#layout-fixer-selection button.trigger').click()
  await page.waitForTimeout(300)
  return capture(page, { x: 0, y: 0, width: 700, height: 280 })
}

async function shortcutShots(context, page, background) {
  await background.evaluate(() =>
    chrome.storage.sync.set({ settings: { selectionButton: false, arabicLayout: 'ar-pc' } }),
  )
  await page.setViewportSize({ width: 420, height: 230 })
  await openFixture(context, page, composePage('hgsghl ugd;l ;dt phg;?'))
  const before = await capture(page, { x: 0, y: 0, width: 420, height: 230 })
  await page.locator('#field').focus()
  await background.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    await globalThis.__layoutFixer.fixLayoutInTab(tab.id)
  })
  await page.waitForTimeout(400)
  await page.locator('#field').evaluate((el) => el.blur())
  return [before, await capture(page, { x: 0, y: 0, width: 420, height: 230 })]
}

async function extensionPageShot(page, id, path, size, prepare) {
  await page.setViewportSize(size)
  await page.goto(`chrome-extension://${id}/${path}`)
  if (prepare) await prepare(page)
  await page.waitForTimeout(300)
  return capture(page, { x: 0, y: 0, ...size })
}

async function tiles(page, { src: icon }) {
  const tile = (
    w,
    h,
    iconSize,
    titleSize,
  ) => `<!doctype html><meta charset="utf-8"><style>${HEADLINE_FONT_FACES}</style><body dir="${RTL ? 'rtl' : 'ltr'}" style="margin:0;width:${w}px;height:${h}px;background:#f5f5f7;font-family:${HEADLINE};display:flex;align-items:center;justify-content:center;gap:${iconSize / 3}px">
    <img src="${icon}" width="${iconSize}" height="${iconSize}" style="border-radius:${iconSize * 0.22}px">
    <div><div style="font-size:${titleSize}px;font-weight:700;color:#1d1d1f">Layout Fixer</div>
    <div style="font-size:${titleSize * 0.45}px;color:#6e6e73;margin-top:6px">${COPY.tagline}</div></div></body>`
  await render(page, tile(440, 280, 88, 34), `${OUT}promo-tile-440x280.png`, { width: 440, height: 280 })
  await render(page, tile(1400, 560, 180, 72), `${OUT}marquee-1400x560.png`, { width: 1400, height: 560 })
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    locale,
    deviceScaleFactor: 2,
    args: [`--lang=${locale}`, `--disable-extensions-except=${EXTENSION}`, `--load-extension=${EXTENSION}`],
  })
  const background = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
  const id = new URL(background.url()).host
  await background.evaluate(() =>
    chrome.storage.sync.set({ settings: { selectionButton: true, arabicLayout: 'ar-pc' } }),
  )
  await new Promise((resolve) => setTimeout(resolve, 800))
  const page = context.pages()[0] ?? (await context.newPage())

  const selection = await selectionShot(context, page)
  const [before, after] = await shortcutShots(context, page, background)
  const popup = await extensionPageShot(page, id, 'src/popup/index.html', { width: 360, height: 460 }, (p) =>
    p.locator('textarea').fill('hgsghl ugd;l ;dt phg;?'),
  )
  const settings = await extensionPageShot(page, id, 'src/options/index.html', { width: 640, height: 560 })
  await page.emulateMedia({ colorScheme: 'dark' })
  const darkPopup = await extensionPageShot(page, id, 'src/popup/index.html', { width: 360, height: 460 }, (p) =>
    p.locator('textarea').fill('اثممخ صخقمي'),
  )
  await page.emulateMedia({ colorScheme: 'light' })

  const [t1, s1] = COPY.selection
  const shots = [
    ['01-selection-button', { title: t1, subtitle: s1, images: [selection], scale: 1.45 }],
    ['02-shortcut', { title: COPY.shortcut[0], subtitle: COPY.shortcut[1], images: [before, after], scale: 1.3 }],
    ['03-popup', { title: COPY.popup[0], subtitle: COPY.popup[1], images: [popup], scale: 1.15 }],
    [
      '04-settings',
      { title: COPY.settings[0], subtitle: COPY.settings[1], images: [settings], scale: 1.05, fade: true },
    ],
    ['05-private', { title: COPY.privacy[0], subtitle: COPY.privacy[1], images: [darkPopup], scale: 1.15, dark: true }],
  ]
  // UI is captured at 2× for sharpness; store images must be exactly 1280×800, so frames render at 1×.
  const renderer = await chromium.launch({ channel: 'chromium', headless: true })
  const canvas = await renderer.newPage({ deviceScaleFactor: 1 })
  for (const [name, options] of shots) await render(canvas, frame(options), `${OUT}${name}.png`)
  await tiles(canvas, await extensionPageShot(page, id, 'icons/icon-128.png', { width: 128, height: 128 }))
  await renderer.close()
  await context.close()
  console.log(`Store images written to ${OUT}`)
}

await main()
