export interface LanguageModel {
  /** The letters the model knows, in table order. */
  readonly alphabet: string
  /** (letters + 1)² scaled log-probabilities; index 0 is the word boundary. */
  readonly bigrams: readonly number[]
  /** Common words too short for the bigrams to judge reliably. */
  readonly shortWords: readonly string[]
}
