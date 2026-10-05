// Uploads a release zip to the Chrome Web Store and submits it for review. Run by
// .github/workflows/publish-chrome.yml (setup: docs/chrome-web-store-api.md):
//   node apps/extension/build/publish-chrome-web-store.ts <zip> <version>
// Environment: CWS_ACCESS_TOKEN, CWS_PUBLISHER_ID, CWS_EXTENSION_ID.
import { readFile } from 'node:fs/promises'
import { publishToChromeWebStore } from './chrome-web-store.ts'

const [zipPath, version] = process.argv.slice(2)
const env = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

if (!zipPath || !/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  throw new Error('usage: publish-chrome-web-store.ts <zip> <x.y.z>')
}

await publishToChromeWebStore({
  accessToken: env('CWS_ACCESS_TOKEN'),
  publisherId: env('CWS_PUBLISHER_ID'),
  extensionId: env('CWS_EXTENSION_ID'),
  zip: new Uint8Array(await readFile(zipPath)),
  expectedVersion: version,
})
