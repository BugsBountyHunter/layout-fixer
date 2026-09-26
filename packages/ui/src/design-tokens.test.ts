import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = import.meta.dirname
const HEX_COLOR = /#[0-9a-f]{3,8}\b/gi

const sources = readdirSync(SRC)
  .filter((name) => !name.includes('.test.'))
  .map((name) => ({ name, text: readFileSync(join(SRC, name), 'utf8') }))

describe('shared design tokens', () => {
  it('defines colors only in tokens.css', () => {
    const offenders = sources
      .filter(({ name }) => name !== 'tokens.css')
      .flatMap(({ name, text }) => (text.match(HEX_COLOR) ?? []).map((hex) => `${name}: ${hex}`))
    expect(offenders).toEqual([])
  })

  it('uses system fonts, never bundled ones', () => {
    const offenders = sources.filter(({ text }) => /@font-face|Plex/.test(text)).map(({ name }) => name)
    expect(offenders).toEqual([])
  })

  it('loads the tokens from the page theme', () => {
    const theme = sources.find(({ name }) => name === 'theme.css')
    expect(theme?.text).toMatch(/@import ['"]\.\/tokens\.css['"]/)
  })

  it('defines the accent and a dark scheme', () => {
    const tokens = sources.find(({ name }) => name === 'tokens.css')?.text
    expect(tokens).toContain('--lf-accent: #0071e3')
    expect(tokens).toContain('prefers-color-scheme: dark')
  })
})
