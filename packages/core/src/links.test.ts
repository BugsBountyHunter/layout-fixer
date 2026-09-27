import { describe, expect, it } from 'vitest'
import { AUTHOR, LINKS, REPO_URL } from './links'

describe('links', () => {
  it('only uses https URLs', () => {
    for (const url of Object.values(LINKS)) expect(new URL(url).protocol).toBe('https:')
  })

  it('opens the issue forms that exist in .github/ISSUE_TEMPLATE', () => {
    expect(LINKS.reportBug).toBe(`${REPO_URL}/issues/new?template=bug_report.yml`)
    expect(LINKS.requestLanguage).toBe(`${REPO_URL}/issues/new?template=feature_request.yml`)
  })

  it('credits the author', () => {
    expect(AUTHOR.name).toBe('Ahmed Saber')
    expect(LINKS.author).toBe(AUTHOR.url)
  })

  it('points donations at PayPal', () => {
    expect(new URL(LINKS.donate).hostname).toBe('paypal.me')
  })
})
