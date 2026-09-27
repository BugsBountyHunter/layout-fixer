import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ABOUT_URLS } from './aboutLinks'

interface Capability {
  readonly permissions: readonly (string | { identifier: string; allow?: { url: string }[] })[]
}

const capability: Capability = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../src-tauri/capabilities/default.json'), 'utf8'),
)

describe('About links', () => {
  it('lets the Settings window open exactly the About URLs, nothing else', () => {
    const opener = capability.permissions.find(
      (permission) => typeof permission !== 'string' && permission.identifier === 'opener:allow-open-url',
    )
    const allowed = typeof opener === 'string' ? [] : (opener?.allow ?? []).map((scope) => scope.url)
    expect(allowed.sort()).toEqual(Object.values(ABOUT_URLS).sort())
  })

  it('does not grant the broad opener defaults', () => {
    expect(capability.permissions).not.toContain('opener:default')
  })
})
