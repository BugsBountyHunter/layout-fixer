import { describe, expect, it } from 'vitest'
import { withoutWebAccessibleResources } from './strip-web-accessible-resources'

describe('withoutWebAccessibleResources', () => {
  it('removes resources that were only listed for self-contained page scripts', () => {
    const manifest = {
      name: 'x',
      web_accessible_resources: [{ matches: ['https://*/*'], resources: ['src/content/a.entry.js'] }],
    }
    expect(withoutWebAccessibleResources(manifest, ['src/content/a.entry.js'])).toEqual({ name: 'x' })
  })

  it('keeps any other resource, so a future feature that needs one still works', () => {
    const manifest = {
      web_accessible_resources: [{ matches: ['https://*/*'], resources: ['src/content/a.entry.js', 'img/logo.png'] }],
    }
    expect(withoutWebAccessibleResources(manifest, ['src/content/a.entry.js'])).toEqual({
      web_accessible_resources: [{ matches: ['https://*/*'], resources: ['img/logo.png'] }],
    })
  })

  it('does not mutate the input and handles manifests without the field', () => {
    const entry = { matches: ['https://*/*'], resources: ['a.js'] }
    withoutWebAccessibleResources({ web_accessible_resources: [entry] }, ['a.js'])
    expect(entry.resources).toEqual(['a.js'])
    expect(withoutWebAccessibleResources({ name: 'x' }, ['a.js'])).toEqual({ name: 'x' })
  })
})
