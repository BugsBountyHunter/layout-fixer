import { splitChunks } from './chunks'
import { type FindOptions, findMistyped } from './judge'

/**
 * Where the run of mistyped words at the end of the text starts, or null when the text doesn't end in one. Whitespace
 * and letterless chunks between mistyped words belong to the run; the first correct or protected word ends it.
 */
export function mistypedTailStart(text: string, options: FindOptions): number | null {
  const chunks = splitChunks(text)
  const mistyped = findMistyped(chunks, options)
  let end = text.length
  let start: number | null = null
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i] as (typeof chunks)[number]
    end -= chunk.text.length
    if (mistyped[i]) start = end
    else if (chunk.script !== null || chunk.protected) break
  }
  return start
}
