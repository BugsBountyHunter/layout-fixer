import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

interface WebAccessibleResource {
  readonly resources: readonly string[]
  readonly [key: string]: unknown
}

interface ManifestLike {
  readonly web_accessible_resources?: readonly WebAccessibleResource[]
  readonly [key: string]: unknown
}

/**
 * Files listed as web-accessible can be fetched by any website at a fixed URL, which lets pages
 * detect that the extension is installed. Self-contained (IIFE) page scripts are injected by the
 * browser and never loaded by pages, so CRXJS's entries for them are dropped.
 */
export function withoutWebAccessibleResources<T extends ManifestLike>(
  manifest: T,
  injectedScripts: readonly string[],
): T {
  if (!manifest.web_accessible_resources) return manifest
  const remaining = manifest.web_accessible_resources
    .map((entry) => ({ ...entry, resources: entry.resources.filter((file) => !injectedScripts.includes(file)) }))
    .filter((entry) => entry.resources.length > 0)
  const { web_accessible_resources: _dropped, ...rest } = manifest
  return (remaining.length > 0 ? { ...rest, web_accessible_resources: remaining } : rest) as T
}

/** CRXJS writes manifest.json last, so the file is patched on disk once the whole build is done. */
export function stripWebAccessibleResources(injectedScripts: readonly string[]): Plugin {
  let outDir = ''
  return {
    name: 'layout-fixer:strip-web-accessible-resources',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir)
    },
    closeBundle() {
      const path = join(outDir, 'manifest.json')
      const manifest = JSON.parse(readFileSync(path, 'utf8')) as ManifestLike
      writeFileSync(path, JSON.stringify(withoutWebAccessibleResources(manifest, injectedScripts), null, 2))
    },
  }
}
