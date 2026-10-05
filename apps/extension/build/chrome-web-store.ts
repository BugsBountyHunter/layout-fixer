// Chrome Web Store API v2: upload a package to an existing item, then submit it for review.
// https://developer.chrome.com/docs/webstore/using-api

const API = 'https://chromewebstore.googleapis.com'

export interface PublishOptions {
  accessToken: string
  publisherId: string
  extensionId: string
  zip: Uint8Array<ArrayBuffer>
  /** Version the uploaded manifest must carry; guards against uploading the wrong zip. */
  expectedVersion: string
  fetch?: typeof globalThis.fetch
  sleep?: (ms: number) => Promise<void>
  log?: (line: string) => void
  pollAttempts?: number
  pollIntervalMs?: number
}

export interface PublishResult {
  state: string
}

interface UploadResponse {
  uploadState?: string
  crxVersion?: string
}

interface StatusResponse {
  lastAsyncUploadState?: string
}

interface PublishResponse {
  state?: string
  warningInfo?: unknown
}

export async function publishToChromeWebStore(options: PublishOptions): Promise<PublishResult> {
  const { fetch = globalThis.fetch, log = console.log } = options
  const item = `publishers/${options.publisherId}/items/${options.extensionId}`
  const call = async <T>(step: string, url: string, init: RequestInit): Promise<T> => {
    const response = await fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${options.accessToken}` },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(`${step}: HTTP ${response.status}: ${body?.error?.message ?? 'no details'}`)
    return body as T
  }

  log(`Uploading ${options.expectedVersion} to ${item}`)
  const upload = await call<UploadResponse>('upload', `${API}/upload/v2/${item}:upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/zip' },
    body: options.zip,
  })
  if (upload.uploadState === 'IN_PROGRESS') {
    await waitForUpload(options, () => call<StatusResponse>('fetchStatus', `${API}/v2/${item}:fetchStatus`, {}))
  } else if (upload.uploadState !== 'SUCCEEDED') {
    throw new Error(`upload ${upload.uploadState ?? 'returned no state'}`)
  }
  if (upload.crxVersion && upload.crxVersion !== options.expectedVersion) {
    throw new Error(`uploaded package version: expected ${options.expectedVersion}, got ${upload.crxVersion}`)
  }

  log('Upload accepted; submitting for review')
  const published = await call<PublishResponse>('publish', `${API}/v2/${item}:publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (published.warningInfo) log(`Warnings: ${JSON.stringify(published.warningInfo)}`)
  log(`Submitted: ${published.state ?? 'unknown state'}`)
  return { state: published.state ?? 'unknown' }
}

async function waitForUpload(options: PublishOptions, fetchStatus: () => Promise<StatusResponse>): Promise<void> {
  const { sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), pollAttempts = 30 } = options
  for (let attempt = 0; attempt < pollAttempts; attempt++) {
    await sleep(options.pollIntervalMs ?? 10_000)
    const { lastAsyncUploadState: state } = await fetchStatus()
    if (state === 'SUCCEEDED') return
    if (state !== 'IN_PROGRESS') throw new Error(`upload ${state ?? 'returned no state'}`)
  }
  throw new Error(`upload still processing after ${pollAttempts} checks`)
}
