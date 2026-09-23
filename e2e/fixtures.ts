import { fileURLToPath } from 'node:url'
import { type BrowserContext, test as base, chromium, expect, type Page, type Worker } from '@playwright/test'

const EXTENSION_PATH = fileURLToPath(new URL('../dist/e2e', import.meta.url))
export const FIXTURE_ORIGIN = 'http://127.0.0.1:4173'

interface Fixtures {
  /** Browser UI language; extension i18n follows it, not the page locale. */
  uiLanguage: string
  context: BrowserContext
  serviceWorker: Worker
  extensionId: string
  /** Opens an HTML fixture on a real http origin so the content script can be injected. */
  openFixture: (body: string) => Promise<Page>
  /** Runs the same code path as the keyboard shortcut on the active tab. */
  fixLayout: () => Promise<void>
  /** Writes settings straight to extension storage, as the options page would. */
  setSettings: (settings: Record<string, unknown>) => Promise<void>
  /** Turns the selection button on and waits until the background has registered its script. */
  enableSelectionButton: () => Promise<void>
}

export const test = base.extend<Fixtures>({
  setSettings: async ({ serviceWorker }, use) => {
    await use((settings) => serviceWorker.evaluate((value) => chrome.storage.sync.set({ settings: value }), settings))
  },

  enableSelectionButton: async ({ serviceWorker, setSettings }, use) => {
    await use(async () => {
      await setSettings({ arabicLayout: 'ar-pc', showToasts: true, selectionButton: true })
      await expect
        .poll(() => serviceWorker.evaluate(async () => (await chrome.scripting.getRegisteredContentScripts()).length))
        .toBe(1)
    })
  },

  uiLanguage: ['en-US', { option: true }],

  context: async ({ uiLanguage }, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      locale: uiLanguage,
      permissions: ['clipboard-read', 'clipboard-write'],
      args: [
        `--lang=${uiLanguage}`,
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    })
    await use(context)
    await context.close()
  },

  serviceWorker: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
    await use(worker)
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host)
  },

  openFixture: async ({ context }, use) => {
    await use(async (body) => {
      const path = `/fixture-${Math.random().toString(36).slice(2)}.html`
      await context.route(`${FIXTURE_ORIGIN}${path}`, (route) =>
        route.fulfill({ contentType: 'text/html', body: `<!doctype html><meta charset="utf-8"><body>${body}</body>` }),
      )
      const page = context.pages()[0] ?? (await context.newPage())
      await page.goto(`${FIXTURE_ORIGIN}${path}`)
      await page.bringToFront()
      return page
    })
  },

  fixLayout: async ({ serviceWorker }, use) => {
    await use(() =>
      serviceWorker.evaluate(async () => {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
        const hook = (globalThis as unknown as { __layoutFixer: { fixLayoutInTab: (id: number) => Promise<void> } })
          .__layoutFixer
        await hook.fixLayoutInTab(tab.id!)
      }),
    )
  },
})

/** Chromium on macOS ignores --lang (it reads AppleLanguages), so UI-language tests only run on Linux/Windows. */
export const CAN_SET_UI_LANGUAGE = process.platform !== 'darwin'

export { expect }
