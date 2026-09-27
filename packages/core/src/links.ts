/** Public links shown in the About / Support sections of every Layout Fixer app. Plain data, no browser APIs. */

export const AUTHOR = {
  name: 'Ahmed Saber',
  url: 'https://github.com/BugsBountyHunter',
} as const

export const WEBSITE_URL = 'https://layoutfixer.dev'
export const REPO_URL = 'https://github.com/BugsBountyHunter/layout-fixer'
export const STORE_URL = 'https://chromewebstore.google.com/detail/cikmlhdhgneblnmkkmiolciffcgbgljj'

export const LINKS = {
  author: AUTHOR.url,
  website: WEBSITE_URL,
  repo: REPO_URL,
  /** GitHub has no "star" deep link; the repo page carries the Star button. */
  star: REPO_URL,
  contributing: `${REPO_URL}/blob/main/CONTRIBUTING.md`,
  reportBug: `${REPO_URL}/issues/new?template=bug_report.yml`,
  requestLanguage: `${REPO_URL}/issues/new?template=feature_request.yml`,
  review: `${STORE_URL}/reviews`,
  donate: 'https://paypal.me/A7medSR96',
} as const

export type LinkId = keyof typeof LINKS
