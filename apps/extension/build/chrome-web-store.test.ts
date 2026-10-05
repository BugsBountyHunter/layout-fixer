import { describe, expect, it } from 'vitest'
import { type PublishOptions, publishToChromeWebStore } from './chrome-web-store'

const ITEM = 'publishers/pub/items/ext'
const UPLOAD_URL = `https://chromewebstore.googleapis.com/upload/v2/${ITEM}:upload`
const STATUS_URL = `https://chromewebstore.googleapis.com/v2/${ITEM}:fetchStatus`
const PUBLISH_URL = `https://chromewebstore.googleapis.com/v2/${ITEM}:publish`

interface Call {
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
}

/** A fake fetch that answers each URL with the next queued response and records every call. */
function fakeStore(responses: Record<string, Array<{ status?: number; json: unknown }>>) {
  const calls: Call[] = []
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    calls.push({
      url,
      method: init?.method ?? 'GET',
      headers: { ...(init?.headers as Record<string, string>) },
      body: init?.body,
    })
    const next = responses[url]?.shift()
    if (!next) throw new Error(`unexpected request to ${url}`)
    return new Response(JSON.stringify(next.json), { status: next.status ?? 200 })
  }
  return { calls, fetch: fetch as typeof globalThis.fetch }
}

function options(fetch: typeof globalThis.fetch, overrides: Partial<PublishOptions> = {}): PublishOptions {
  return {
    accessToken: 'token',
    publisherId: 'pub',
    extensionId: 'ext',
    zip: new Uint8Array([1, 2, 3]),
    expectedVersion: '1.2.1',
    fetch,
    sleep: async () => {},
    log: () => {},
    ...overrides,
  }
}

describe('publishToChromeWebStore', () => {
  it('uploads the zip, then submits the item for review', async () => {
    const store = fakeStore({
      [UPLOAD_URL]: [{ json: { uploadState: 'SUCCEEDED', crxVersion: '1.2.1' } }],
      [PUBLISH_URL]: [{ json: { state: 'PENDING_REVIEW' } }],
    })

    await expect(publishToChromeWebStore(options(store.fetch))).resolves.toEqual({ state: 'PENDING_REVIEW' })

    expect(store.calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      `POST ${UPLOAD_URL}`,
      `POST ${PUBLISH_URL}`,
    ])
    expect(store.calls[0].headers.Authorization).toBe('Bearer token')
    expect(store.calls[0].body).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('waits for an upload that is still being processed', async () => {
    const store = fakeStore({
      [UPLOAD_URL]: [{ json: { uploadState: 'IN_PROGRESS' } }],
      [STATUS_URL]: [
        { json: { lastAsyncUploadState: 'IN_PROGRESS' } },
        { json: { lastAsyncUploadState: 'SUCCEEDED' } },
      ],
      [PUBLISH_URL]: [{ json: { state: 'PENDING_REVIEW' } }],
    })

    await expect(publishToChromeWebStore(options(store.fetch))).resolves.toEqual({ state: 'PENDING_REVIEW' })
    expect(store.calls.filter((call) => call.url === STATUS_URL)).toHaveLength(2)
  })

  it('gives up when the upload is still processing after the last check', async () => {
    const store = fakeStore({
      [UPLOAD_URL]: [{ json: { uploadState: 'IN_PROGRESS' } }],
      [STATUS_URL]: [
        { json: { lastAsyncUploadState: 'IN_PROGRESS' } },
        { json: { lastAsyncUploadState: 'IN_PROGRESS' } },
      ],
    })

    await expect(publishToChromeWebStore(options(store.fetch, { pollAttempts: 2 }))).rejects.toThrow('still processing')
    expect(store.calls.some((call) => call.url === PUBLISH_URL)).toBe(false)
  })

  it('stops before publishing when the upload fails', async () => {
    const store = fakeStore({ [UPLOAD_URL]: [{ json: { uploadState: 'FAILED' } }] })

    await expect(publishToChromeWebStore(options(store.fetch))).rejects.toThrow('upload FAILED')
    expect(store.calls).toHaveLength(1)
  })

  it('stops when the store reads a different version from the zip', async () => {
    const store = fakeStore({ [UPLOAD_URL]: [{ json: { uploadState: 'SUCCEEDED', crxVersion: '1.2.0' } }] })

    await expect(publishToChromeWebStore(options(store.fetch))).rejects.toThrow('expected 1.2.1, got 1.2.0')
  })

  it('reports the HTTP status and the API error message', async () => {
    const store = fakeStore({
      [UPLOAD_URL]: [{ status: 403, json: { error: { message: 'The caller does not have permission' } } }],
    })

    await expect(publishToChromeWebStore(options(store.fetch))).rejects.toThrow(
      'upload: HTTP 403: The caller does not have permission',
    )
  })

  it('waits between checks with a real timer by default', async () => {
    const store = fakeStore({
      [UPLOAD_URL]: [{ json: { uploadState: 'IN_PROGRESS' } }],
      [STATUS_URL]: [{ json: { lastAsyncUploadState: 'NOT_FOUND' } }],
    })

    await expect(
      publishToChromeWebStore(options(store.fetch, { sleep: undefined, pollIntervalMs: 0 })),
    ).rejects.toThrow('upload NOT_FOUND')
  })

  it('reports an error response that is not JSON', async () => {
    const fetch = (async () => new Response('Bad gateway', { status: 502 })) as typeof globalThis.fetch

    await expect(publishToChromeWebStore(options(fetch))).rejects.toThrow('upload: HTTP 502: no details')
  })

  it('logs publish warnings without failing', async () => {
    const lines: string[] = []
    const store = fakeStore({
      [UPLOAD_URL]: [{ json: { uploadState: 'SUCCEEDED', crxVersion: '1.2.1' } }],
      [PUBLISH_URL]: [{ json: { state: 'PENDING_REVIEW', warningInfo: { warnings: ['slow review'] } } }],
    })

    await publishToChromeWebStore(options(store.fetch, { log: (line) => lines.push(line) }))
    expect(lines.join('\n')).toContain('slow review')
  })
})
