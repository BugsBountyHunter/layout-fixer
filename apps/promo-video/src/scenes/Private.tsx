import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { LAYOUT_IDS } from '../../../../packages/core/src/layouts'
import { KEY_CODES } from '../../../../packages/core/src/layouts/keys'
import { Backdrop } from '../components/Backdrop'
import { color } from '../lib/theme'

const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) } as const

// Counts read from the code, so the video can't drift from the repo.
const STATS = [
  { value: 0, label: 'network calls' },
  { value: 0, label: 'sites read until you opt in' },
  { value: KEY_CODES.length, label: 'physical keys mapped' },
  { value: LAYOUT_IDS.length, label: 'layouts from real OS data' },
] as const

export const Private: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <Backdrop glowY="40%">
      <Interactive.Div
        name="Headline"
        style={{
          position: 'absolute',
          top: 150,
          width: '100%',
          textAlign: 'center',
          fontSize: 110,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          opacity: interpolate(frame, [0, 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Private by design.
      </Interactive.Div>
      <div style={{ position: 'absolute', top: 400, left: 120, right: 120, display: 'flex', gap: 36 }}>
        {STATS.map((stat, i) => {
          const start = 14 + i * 10
          const shown = Math.round(interpolate(frame, [start, start + 40], [0, stat.value], ease))
          return (
            <div
              key={stat.label}
              style={{
                flex: 1,
                height: 380,
                padding: 44,
                borderRadius: 40,
                background: color.surface,
                border: `1px solid ${color.line}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: interpolate(frame, [start, start + 16], [0, 1], ease),
                scale: interpolate(frame, [start, start + 16], [0.9, 1], ease),
              }}
            >
              <div
                style={{ fontSize: 180, fontWeight: 700, lineHeight: 1, color: i < 2 ? color.success : color.accent }}
              >
                {shown}
              </div>
              <div style={{ fontSize: 44, lineHeight: 1.2, color: color.secondary }}>{stat.label}</div>
            </div>
          )
        })}
      </div>
    </Backdrop>
  )
}
