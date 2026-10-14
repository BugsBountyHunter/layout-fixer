import { MODELS, SCALE } from './model'
import type { LanguageModel } from './types'

export type ModelLanguage = keyof typeof MODELS

/** Natural-log probability of a transition the model can't represent: a letter from another alphabet. */
const UNKNOWN = -12

interface CompiledModel {
  readonly index: ReadonlyMap<string, number>
  readonly size: number
  readonly bigrams: readonly number[]
  readonly shortWords: ReadonlySet<string>
}

const compile = ({ alphabet, bigrams, shortWords }: LanguageModel): CompiledModel => {
  const letters = Array.from(alphabet)
  return {
    index: new Map(letters.map((letter, i) => [letter, i + 1])),
    size: letters.length + 1,
    bigrams,
    shortWords: new Set(shortWords),
  }
}

const COMPILED: Readonly<Record<ModelLanguage, CompiledModel>> = {
  en: compile(MODELS.en),
  ar: compile(MODELS.ar),
}

/** The spelling the model was trained on: lowercase English, Arabic without harakat or tatweel. */
export function normalizeWord(word: string, language: ModelLanguage): string {
  return language === 'en' ? word.toLowerCase() : word.replace(/[ً-ْـ]/g, '')
}

/** Average natural-log probability per letter transition, word boundaries included. Higher is more word-like. */
export function wordScore(word: string, language: ModelLanguage): number {
  const { index, size, bigrams } = COMPILED[language]
  const positions = Array.from(normalizeWord(word, language), (char) => index.get(char) ?? -1)
  const path = [0, ...positions, 0]
  let total = 0
  for (let i = 0; i + 1 < path.length; i++) {
    const from = path[i] as number
    const to = path[i + 1] as number
    total += from < 0 || to < 0 ? UNKNOWN : (bigrams[from * size + to] as number) / SCALE
  }
  return total / (path.length - 1)
}

export function isCommonShortWord(word: string, language: ModelLanguage): boolean {
  return COMPILED[language].shortWords.has(normalizeWord(word, language))
}
