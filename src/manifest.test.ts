import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { type BrowserTarget, buildManifest } from './manifest'

const TARGETS: BrowserTarget[] = ['chrome', 'firefox']
const LOCALES = ['en', 'ar'] as const

function loadMessages(locale: string): Record<string, { message: string }> {
  return JSON.parse(readFileSync(new URL(`../public/_locales/${locale}/messages.json`, import.meta.url), 'utf8'))
}

function messageKeysIn(value: unknown): string[] {
  return [...JSON.stringify(value).matchAll(/__MSG_(\w+)__/g)].map((match) => match[1])
}

describe.each(TARGETS)('buildManifest(%s)', (target) => {
  const manifest = buildManifest(target)

  it('is Manifest V3', () => {
    expect(manifest.manifest_version).toBe(3)
  })

  it('requests only the minimal permissions and no host access', () => {
    expect(manifest.permissions).toEqual(['contextMenus', 'activeTab', 'scripting', 'storage'])
    expect(manifest).not.toHaveProperty('host_permissions')
    expect(manifest).not.toHaveProperty('content_scripts')
  })

  it('declares the Alt+Shift+F command', () => {
    expect(manifest.commands?.['fix-layout']?.suggested_key?.default).toBe('Alt+Shift+F')
  })

  it('asks for site access only as an optional permission, for the opt-in selection button', () => {
    expect(manifest.optional_host_permissions).toEqual(['<all_urls>'])
  })

  it('opens the settings page in a full tab (the only mode Firefox for Android supports)', () => {
    expect(manifest.options_ui).toEqual({ page: 'src/options/index.html', open_in_tab: true })
  })

  it('declares every icon size the stores and toolbars need', () => {
    expect(Object.keys(manifest.icons ?? {})).toEqual(['16', '32', '48', '128'])
  })

  it.each(LOCALES)('has every __MSG_*__ key translated in "%s"', (locale) => {
    const messages = loadMessages(locale)
    for (const key of messageKeysIn(manifest)) {
      expect(messages[key]?.message, `${locale}: ${key}`).toBeTruthy()
    }
  })
})

describe('browser-specific manifest fields', () => {
  it('Chromium uses a service worker and a minimum version', () => {
    const manifest = buildManifest('chrome')
    expect(manifest.background).toEqual({ service_worker: 'src/background/service-worker.ts', type: 'module' })
    expect(manifest).toHaveProperty('minimum_chrome_version')
    expect(manifest).not.toHaveProperty('browser_specific_settings')
  })

  it('Firefox uses background scripts, a gecko id and declares no data collection', () => {
    const manifest = buildManifest('firefox')
    expect(manifest.background).toEqual({ scripts: ['src/background/service-worker.ts'], type: 'module' })
    expect(manifest).toMatchObject({
      browser_specific_settings: {
        gecko: { id: expect.stringMatching(/^[\w.-]+@[\w.-]+$/), data_collection_permissions: { required: ['none'] } },
        gecko_android: {},
      },
    })
  })
})

describe('locales', () => {
  it('Arabic and English define exactly the same keys', () => {
    expect(Object.keys(loadMessages('ar')).sort()).toEqual(Object.keys(loadMessages('en')).sort())
  })
})
