import type React from 'react'
import { Easing, interpolate, useCurrentFrame } from 'remotion'
import { color } from '../lib/theme'
import { Keycap } from './Keycap'

const KEYS = [
  { label: 'Alt', units: 1.6 },
  { label: 'Shift', units: 2 },
  { label: 'F', units: 1 },
] as const

const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) } as const

/** Alt + Shift + F, each key sliding in from `enter`, all pressed together at `pressAt`. */
export const ShortcutKeys: React.FC<{ readonly enter: number; readonly pressAt: number; readonly size: number }> = ({
  enter,
  pressAt,
  size,
}) => {
  const frame = useCurrentFrame()
  const press = interpolate(frame, [pressAt, pressAt + 4, pressAt + 14], [0, 1, 0], ease)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: size * 0.2 }}>
      {KEYS.map((key, i) => {
        const at = enter + i * 6
        return (
          <div
            key={key.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: size * 0.2,
              opacity: interpolate(frame, [at, at + 12], [0, 1], ease),
              translate: `0px ${interpolate(frame, [at, at + 12], [30, 0], ease)}px`,
            }}
          >
            {i > 0 ? <span style={{ fontSize: size * 0.5, color: color.tertiary }}>+</span> : null}
            <Keycap en={key.label} units={key.units} press={press} size={size} />
          </div>
        )
      })}
    </div>
  )
}
