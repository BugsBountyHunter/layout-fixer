import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // The workspace packages ship TypeScript source; the monorepo root holds the lockfile.
  transpilePackages: ['@layout-fixer/core', '@layout-fixer/ui'],
  turbopack: { root: fileURLToPath(new URL('../..', import.meta.url)) },
  // Two root layouts (en, ar) and no top-level layout: the 404 page must be a full document of its own.
  experimental: { globalNotFound: true },
}

export default nextConfig
