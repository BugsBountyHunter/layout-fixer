import type { ManifestV3Export } from '@crxjs/vite-plugin'
import packageJson from '../package.json' with { type: 'json' }
import { FIX_COMMAND } from './shared/constants.ts'

export type BrowserTarget = 'chrome' | 'firefox'

const GECKO_ID = 'layout-fixer@layoutfixer.app'
/** First releases that support `data_collection_permissions` (desktop 140 is also the current ESR). */
const FIREFOX_MIN_VERSION = '140.0'
const FIREFOX_ANDROID_MIN_VERSION = '142.0'
const CHROME_MIN_VERSION = '120'

const ICONS = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
} as const

type Manifest = Exclude<ManifestV3Export, ((...args: never[]) => unknown) | Promise<unknown>>

const SHARED: Manifest = {
  manifest_version: 3,
  name: '__MSG_extName__',
  description: '__MSG_extDescription__',
  default_locale: 'en',
  version: packageJson.version,
  icons: ICONS,
  action: {
    default_popup: 'src/popup/index.html',
    default_title: '__MSG_extName__',
    default_icon: ICONS,
  },
  // No host permissions: activeTab grants access only to the tab the user acts on.
  // storage has no install-time warning on any browser.
  permissions: ['contextMenus', 'activeTab', 'scripting', 'storage'],
  options_ui: { page: 'src/options/index.html', open_in_tab: true },
  // Requested at runtime only when the user turns on the selection button.
  optional_host_permissions: ['<all_urls>'],
  commands: {
    [FIX_COMMAND]: {
      suggested_key: { default: 'Alt+Shift+F' },
      description: '__MSG_commandFix__',
    },
  },
}

function firefoxManifest(): Manifest {
  const firefox = {
    ...SHARED,
    // Firefox runs MV3 backgrounds as event pages, not service workers.
    background: { scripts: ['src/background/service-worker.ts'], type: 'module' },
    browser_specific_settings: {
      gecko: {
        id: GECKO_ID,
        strict_min_version: FIREFOX_MIN_VERSION,
        data_collection_permissions: { required: ['none'] },
      },
      // Valid for Firefox but missing from the CRXJS types; assigning via a variable skips the excess-property check.
      gecko_android: { strict_min_version: FIREFOX_ANDROID_MIN_VERSION },
    },
  } satisfies Record<string, unknown>
  return firefox as Manifest
}

function chromeManifest(): Manifest {
  return {
    ...SHARED,
    minimum_chrome_version: CHROME_MIN_VERSION,
    background: { service_worker: 'src/background/service-worker.ts', type: 'module' },
  }
}

export function buildManifest(target: BrowserTarget): Manifest {
  return target === 'firefox' ? firefoxManifest() : chromeManifest()
}
