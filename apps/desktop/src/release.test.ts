import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const config = JSON.parse(read('../src-tauri/tauri.conf.json'))

describe('release configuration', () => {
  it('verifies updates with the committed public key', () => {
    expect(config.plugins.updater.pubkey).toBe(read('../src-tauri/updater.pub').trim())
    expect(atob(config.plugins.updater.pubkey)).toMatch(/^untrusted comment: minisign public key/)
  })

  it('reads updates only from the rolling desktop-latest release over HTTPS', () => {
    expect(config.plugins.updater.endpoints).toEqual([
      'https://github.com/BugsBountyHunter/layout-fixer/releases/download/desktop-latest/latest.json',
    ])
  })

  it('keeps every version field in step for the release workflow', () => {
    const packageVersion = JSON.parse(read('../package.json')).version
    const cargoVersion = /^version = "(.+)"$/m.exec(read('../src-tauri/Cargo.toml'))?.[1]
    expect(config.version).toBe(packageVersion)
    expect(cargoVersion).toBe(packageVersion)
    expect(read('../CHANGELOG.md')).toContain(`## [${packageVersion}]`)
  })

  it('builds updater artifacts only in the release workflow, which has the key', () => {
    expect(config.bundle.createUpdaterArtifacts).toBe(false)
  })
})
