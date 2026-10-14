# Plan — Fix only the mistyped words in mixed text

**Status:** ✅ done · **Date:** 2026-10-14

## Problem

`convert()` picks one direction for the whole text from the majority script, then retypes every
character. Text that mixes correct and mistyped words gets the correct words destroyed too:

```text
meeting at 5 hgsghl ugd;l   →  ةثثفهىل شف 5 السلام عليكم   (today)
meeting at 5 hgsghl ugd;l   →  meeting at 5 السلام عليكم   (goal)
```

Competitors that only fix the wrong words (Keyboard Layout Detector) use dictionaries. We want the
same result, fully offline, without shipping a dictionary.

## Decisions (agreed 2026-10-14)

- **Detection:** a character-bigram model per language plus a short list of common short words,
  generated from [FrequencyWords](https://github.com/hermitdave/FrequencyWords) (OpenSubtitles 2018,
  CC BY-SA 4.0, attributed in `NOTICE`). Only derived statistics and a short word list are committed.
- **Same API:** `convert()` keeps its signature, so the extension, popup, selection button and desktop
  app get the fix without changes. `convertBetween()` stays literal (promo video, layout examples).
- **Fallback:** when no word is judged mistyped, `convert()` converts everything, exactly as before —
  the user asked for a fix.
- **Explicit direction** (popup switch, selection-button language): only words in that direction's
  source script are considered.
- **Untouched:** URLs, e-mail addresses and words containing digits.
- **Keyboard switching** follows the language the converted words ended up in.
- **Out of scope:** detection while typing, new languages.

A prototype on held-out FrequencyWords data caught 95–98 % of mistyped words with 0.7–2 % of real
words wrongly flagged (bigrams alone). Short words caused most errors, hence the word list and the
neighbour rule below.

## Design

`packages/core/src/`:

| File | Role |
|------|------|
| `keystrokes.ts` | `convertBetween()` moved out of `converter.ts` so `detect/` can use it without an import cycle |
| `detect/model.ts` | **Generated.** Bigram log-probabilities and common short words per language |
| `detect/score.ts` | `wordScore(word, language)`: average log-probability per transition |
| `detect/chunks.ts` | Splits text into whitespace-separated chunks, keeping the whitespace; marks protected chunks |
| `detect/judge.ts` | Per chunk: `correct`, `mistyped` (with its direction) or `unsure`; unsure chunks follow their neighbours |
| `converter.ts` | `fix(text, options) → { text, direction }`; `convert()` = `fix().text` |

Margins ended up per source script — `Latn` 0.3, `Arab` 0.5 — and English edge punctuation is limited to marks
that really end or open an English word (`[ ] \`` are Arabic letters on the PC layout). Held-out accuracy at the
time of writing: 95–97 % caught, 0.5–0.9 % false alarms, PC and Mac.

**Judging a chunk** (source script from its letters, Latin → candidate `en→ar`, Arabic → `ar→en`):
1. Read it as typed (`as-is`) and retyped on the other layout (`converted`), each with its own edge
   punctuation stripped — `;` at the end of `lk;` is the letter ك once converted, but `,` after
   `hello` is a comma.
2. Known short word on exactly one side decides.
3. Otherwise `score(converted) − score(as-is)`: above `+MARGIN` → mistyped, below `−MARGIN` → correct,
   else unsure.
4. An unsure chunk is mistyped when its nearest decided neighbour on either side is mistyped.

**Direction of the result** is the direction that converted the most letters, or the fallback direction.

`scripts/build-language-model.ts` downloads the lists, holds out every 10th of the 20 000 most common
words per language for the accuracy test (`detect/fixtures/held-out-{en,ar}.txt`), and writes
`detect/model.ts`. Run with `npm run model -w @layout-fixer/core`.

## Steps

1. Move `convertBetween()` to `keystrokes.ts` (pure refactor, tests stay green).
2. Model generator + generated model + held-out fixtures; `NOTICE`.
3. TDD `score.ts`, `chunks.ts`, `judge.ts`; accuracy test: ≥ 95 % of held-out mistyped words caught,
   ≤ 1 % of held-out real words flagged, both directions, PC and Mac layouts.
4. TDD `fix()` / `convert()` on mixed sentences; existing converter tests stay green.
5. Extension `replace.ts` and desktop `fix-flow.ts` take the language from `fix().direction`; desktop
   stops forcing the majority direction.
6. E2E: a mixed sentence in a text field keeps its correct words.
7. `CHANGELOG`, `CLAUDE.md` (§5 How it works, roadmap), `npm run check`, `npm run check:desktop`.
