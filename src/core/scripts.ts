export type Script = 'Latn' | 'Arab' | 'Cyrl'

const LETTERS: Readonly<Record<Script, RegExp>> = {
  Latn: /[A-Za-z]/g,
  Arab: /[ء-يٱ-ۓ]/g,
  Cyrl: /[Ѐ-ӿ]/g,
}

/** The script with the most letters; Latin when there are none or on a tie with Latin. */
export function detectScript(text: string): Script {
  let best: Script = 'Latn'
  let bestCount = text.match(LETTERS.Latn)?.length ?? 0
  for (const script of Object.keys(LETTERS) as Script[]) {
    const count = text.match(LETTERS[script])?.length ?? 0
    if (count > bestCount) {
      best = script
      bestCount = count
    }
  }
  return best
}
