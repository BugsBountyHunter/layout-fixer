import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const npmDependencies: Record<string, string> = JSON.parse(read('../package.json')).dependencies
const npmLock = JSON.parse(read('../../../package-lock.json')).packages
const cargoLock = read('../src-tauri/Cargo.lock')

const minor = (version: string) => version.split('.').slice(0, 2).join('.')

// The npm package a workspace resolves to: its own nested copy first, then the hoisted one.
const npmVersion = (name: string): string | undefined =>
  (npmLock[`apps/desktop/node_modules/${name}`] ?? npmLock[`node_modules/${name}`])?.version

// `\r?` because Windows checkouts have CRLF line endings.
const crateVersions = (name: string): string[] =>
  [...cargoLock.matchAll(/^name = "(.+)"\r?\nversion = "(.+)"$/gm)]
    .filter(([, crate]) => crate === name)
    .map(([, , version]) => version)

// @tauri-apps/api pairs with the `tauri` crate, @tauri-apps/plugin-x with `tauri-plugin-x`.
const crateFor = (npmName: string) =>
  npmName === '@tauri-apps/api' ? 'tauri' : npmName.replace('@tauri-apps/plugin-', 'tauri-plugin-')

const tauriPackages = Object.keys(npmDependencies).filter(
  (name) => name === '@tauri-apps/api' || name.startsWith('@tauri-apps/plugin-'),
)

// A plugin's JS side invokes commands on its Rust side, so Tauri expects both on the same major.minor: a newer npm
// package can call a command the older crate lacks, which only fails at runtime. `tauri build` doesn't catch it, and
// Dependabot updates the two ecosystems in separate PRs.
describe('Tauri npm packages and Rust crates', () => {
  it('finds the Tauri packages to compare', () => {
    expect(tauriPackages).toContain('@tauri-apps/api')
    expect(tauriPackages.length).toBeGreaterThan(1)
  })

  it.each(tauriPackages)('%s matches its Rust crate on major.minor', (npmName) => {
    const crate = crateFor(npmName)
    const npm = npmVersion(npmName)
    const rust = crateVersions(crate)
    expect(npm, `${npmName} is missing from package-lock.json`).toBeDefined()
    expect(rust, `${crate} is missing from Cargo.lock`).toHaveLength(1)
    expect(`${crate} ${minor(rust[0])}`).toBe(`${crate} ${minor(npm as string)}`)
  })
})
