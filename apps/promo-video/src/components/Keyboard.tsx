import type React from 'react'
import { AR_PC } from '../../../../packages/core/src/layouts/ar-pc'
import { EN_US } from '../../../../packages/core/src/layouts/en-us'
import type { KeyCode } from '../../../../packages/core/src/layouts/keys'
import { GAP, Keycap } from './Keycap'

type Cell = KeyCode | { readonly label: string; readonly units: number; readonly code?: string }

// ANSI rows. Printable keys read their legends straight from the layout data in packages/core.
const ROWS: readonly (readonly Cell[])[] = [
  [
    'Backquote',
    'Digit1',
    'Digit2',
    'Digit3',
    'Digit4',
    'Digit5',
    'Digit6',
    'Digit7',
    'Digit8',
    'Digit9',
    'Digit0',
    'Minus',
    'Equal',
    { label: '⌫', units: 2 },
  ],
  [
    { label: 'tab', units: 1.5 },
    'KeyQ',
    'KeyW',
    'KeyE',
    'KeyR',
    'KeyT',
    'KeyY',
    'KeyU',
    'KeyI',
    'KeyO',
    'KeyP',
    'BracketLeft',
    'BracketRight',
    'Backslash',
  ],
  [
    { label: 'caps', units: 1.8 },
    'KeyA',
    'KeyS',
    'KeyD',
    'KeyF',
    'KeyG',
    'KeyH',
    'KeyJ',
    'KeyK',
    'KeyL',
    'Semicolon',
    'Quote',
    { label: 'return', units: 2.3 },
  ],
  [
    { label: 'shift', units: 2.35 },
    'KeyZ',
    'KeyX',
    'KeyC',
    'KeyV',
    'KeyB',
    'KeyN',
    'KeyM',
    'Comma',
    'Period',
    'Slash',
    { label: 'shift', units: 2.85 },
  ],
  [
    { label: 'ctrl', units: 1.5 },
    { label: 'alt', units: 1.5, code: 'AltLeft' },
    { label: '', units: 7.3, code: 'Space' },
    { label: 'alt', units: 1.5 },
    { label: 'ctrl', units: 1.5 },
  ],
]

/** The physical key that types `char` on the US layout (unshifted), or `Space`. */
export const keyForChar = (char: string): string | undefined => {
  if (char === ' ') return 'Space'
  const entries = Object.entries(EN_US.keys) as [KeyCode, readonly [string | null, string | null]][]
  return entries.find(([, [base, shift]]) => base === char || shift === char)?.[0]
}

type Props = {
  readonly pressed?: Readonly<Record<string, number>>
  readonly glow?: Readonly<Record<string, number>>
  readonly size?: number
  readonly showArabic?: boolean
}

export const Keyboard: React.FC<Props> = ({ pressed = {}, glow = {}, size, showArabic = true }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
    {ROWS.map((row, r) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: rows are a fixed, never-reordered list
      <div key={r} style={{ display: 'flex', gap: GAP }}>
        {row.map((cell, c) => {
          const code = typeof cell === 'string' ? cell : (cell.code ?? `${cell.label}-${r}-${c}`)
          const en = typeof cell === 'string' ? (EN_US.keys[cell]?.[0] ?? '') : cell.label
          const arBase = typeof cell === 'string' && showArabic ? AR_PC.keys[cell]?.[0] : undefined
          const ar = arBase && arBase !== en ? arBase : undefined
          return (
            <Keycap
              key={code}
              en={en.toUpperCase()}
              ar={ar}
              units={typeof cell === 'string' ? 1 : cell.units}
              press={pressed[code] ?? 0}
              glow={glow[code] ?? 0}
              size={size}
            />
          )
        })}
      </div>
    ))}
  </div>
)
