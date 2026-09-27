import { LINKS } from '@layout-fixer/core/links'
import { describe, expect, it } from 'vitest'
import { aboutLinks } from './About'

describe('About links', () => {
  it('asks for a rating first where a store listing exists', () => {
    const links = aboutLinks(true)
    expect(links.map((link) => link.id)).toEqual(['rate', 'bug', 'language', 'contribute'])
    expect(links[0]?.href).toBe(LINKS.review)
  })

  it('leaves out the rating where there is no listing yet', () => {
    expect(aboutLinks(false).map((link) => link.id)).toEqual(['bug', 'language', 'contribute'])
  })
})
