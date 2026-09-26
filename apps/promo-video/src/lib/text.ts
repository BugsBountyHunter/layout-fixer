import { convertBetween, detectDirection } from '../../../../packages/core/src/converter'

export { convertBetween, detectDirection }

/** The first `count` code points, so Arabic and emoji never split mid-character. */
export const takeChars = (text: string, count: number): string =>
  Array.from(text)
    .slice(0, Math.max(0, Math.floor(count)))
    .join('')

export const charCount = (text: string): number => Array.from(text).length
