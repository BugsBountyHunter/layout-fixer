import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Tauri loads the dev server on a fixed port (see src-tauri/tauri.conf.json) and shows Rust errors in the terminal.
const DEV_PORT = 1420

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: DEV_PORT, strictPort: true, watch: { ignored: ['**/src-tauri/**'] } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: { input: { settings: 'index.html', hud: 'hud.html' } },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/platform/**', 'src/fix/**'],
      // Startup glue that only runs inside Tauri; covered by the manual checklist.
      exclude: ['src/platform/store.ts', 'src/fix/start.ts', 'src/**/*.test.ts'],
      thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
    },
  },
})
