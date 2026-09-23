import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { STYLES as SELECTION_STYLES } from '../content/selection/selection-ui.styles'

const SRC = join(import.meta.dirname, '..')
const TOKENS = 'ui/tokens.css'
const HEX_COLOR = /#[0-9a-f]{3,8}\b/gi

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

const sources = files(SRC).map((path) => ({ path: relative(SRC, path), text: readFileSync(path, 'utf8') }))

/** Every file that carries styling: stylesheets and the shadow-root style strings. */
const styleSources = sources.filter(
  ({ path }) =>
    path !== TOKENS && (path.endsWith('.css') || path.endsWith('.styles.ts') || path === 'content/toast.ts'),
)

describe('design tokens', () => {
  it('defines colors only in tokens.css', () => {
    const offenders = styleSources.flatMap(({ path, text }) =>
      (text.match(HEX_COLOR) ?? []).map((hex) => `${path}: ${hex}`),
    )
    expect(offenders).toEqual([])
  })

  it('uses system fonts, never bundled ones', () => {
    const offenders = sources.filter(({ path, text }) => !path.endsWith('.test.ts') && /@font-face|Plex/.test(text))
    expect(offenders.map(({ path }) => path)).toEqual([])
  })

  it('is loaded by the shared page theme', () => {
    const theme = sources.find(({ path }) => path === 'ui/theme.css')
    expect(theme?.text).toMatch(/@import ['"]\.\/tokens\.css['"]/)
  })

  it('keeps on-page styles on the shared tokens', () => {
    for (const path of ['content/selection/selection-ui.styles.ts', 'content/toast.ts']) {
      const text = sources.find((source) => source.path === path)?.text
      expect(text, path).toContain('tokens.css?inline')
    }
  })

  it('ships the token definitions inside the selection menu shadow root', () => {
    expect(SELECTION_STYLES).toContain('--lf-accent: #0071e3')
    expect(SELECTION_STYLES).toContain('prefers-color-scheme: dark')
  })
})
