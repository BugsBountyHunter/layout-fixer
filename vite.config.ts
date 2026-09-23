import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { stripWebAccessibleResources } from './build/strip-web-accessible-resources.ts'
import { type BrowserTarget, buildManifest } from './src/manifest.ts'

export default defineConfig(({ mode }) => {
  const target: BrowserTarget = mode === 'firefox' ? 'firefox' : 'chrome'
  const outDir = mode === 'e2e' ? 'dist/e2e' : `dist/${target}`
  const manifest = buildManifest(target)
  // Playwright can't press extension shortcuts or answer permission prompts, so the e2e build
  // is granted site access up front instead of relying on activeTab and optional permissions.
  const e2eManifest = mode === 'e2e' ? { ...manifest, host_permissions: ['<all_urls>'] } : manifest

  return {
    plugins: [
      react(),
      crx({ manifest: e2eManifest, browser: target }),
      stripWebAccessibleResources(['src/content/content-script.entry.js', 'src/content/selection-button.entry.js']),
    ],
    build: { outDir, emptyOutDir: true },
    test: {
      include: ['src/**/*.test.ts', 'build/**/*.test.ts'],
      // On-page UI imports the design tokens with `?inline`; keep them real in tests instead of "".
      css: { include: [/tokens\.css/] },
      coverage: {
        provider: 'v8',
        include: [
          'src/core/**',
          'src/content/**',
          'src/background/handlers.ts',
          'src/background/selection-script.ts',
          'src/platform/settings.ts',
          'src/platform/shortcut.ts',
          'src/platform/i18n.ts',
          'src/manifest.ts',
        ],
        exclude: ['**/fixtures/**'],
        thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
      },
    },
  }
})
