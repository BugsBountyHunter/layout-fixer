import { lettersScript, type Script } from '../scripts'

export interface Chunk {
  readonly text: string
  /** The script of the chunk's letters; null for whitespace and chunks without letters. */
  readonly script: Script | null
  /** Links, addresses and anything with digits are never retyped. */
  readonly protected: boolean
}

const PROTECTED = /\d|@|:\/\/|^www\./i

/** Splits text into words and the whitespace between them; joining the chunks gives the text back. */
export function splitChunks(text: string): readonly Chunk[] {
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((part) =>
      /^\s/.test(part)
        ? { text: part, script: null, protected: false }
        : { text: part, script: lettersScript(part), protected: PROTECTED.test(part) },
    )
}
