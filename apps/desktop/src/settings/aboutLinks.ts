import { LINKS } from '@layout-fixer/core/links'

/** Every URL the About section can open. src-tauri/capabilities/default.json must allow exactly these. */
export const ABOUT_URLS = {
  reportBug: LINKS.reportBug,
  requestLanguage: LINKS.requestLanguage,
  contribute: LINKS.repo,
  donate: LINKS.donate,
  author: LINKS.author,
} as const
