import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { Backdrop } from '../components/Backdrop'
import { color } from '../lib/theme'

const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) } as const

const COLUMNS = [
  {
    title: 'Browsers',
    items: ['Chrome · Edge', 'Brave · Opera', 'Firefox', 'Firefox on Android'],
  },
  {
    title: 'Desktop app',
    items: ['macOS', 'Windows', 'Linux (X11)', 'Every app, one key'],
  },
  {
    title: 'Four ways to fix',
    items: ['Alt + Shift + F', 'Right-click menu', 'Selection button', 'Paste in the popup'],
  },
] as const

export const Everywhere: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <Backdrop glowY="20%">
      <Interactive.Div
        name="Headline"
        style={{
          position: 'absolute',
          top: 110,
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
        Wherever you type.
      </Interactive.Div>
      <div style={{ position: 'absolute', top: 330, left: 120, right: 120, display: 'flex', gap: 40 }}>
        {COLUMNS.map((column, c) => {
          const start = 12 + c * 14
          return (
            <div
              key={column.title}
              style={{
                flex: 1,
                padding: 48,
                borderRadius: 40,
                background: color.surface,
                border: `1px solid ${color.line}`,
                opacity: interpolate(frame, [start, start + 18], [0, 1], ease),
                translate: `0px ${interpolate(frame, [start, start + 18], [60, 0], ease)}px`,
              }}
            >
              <div style={{ fontSize: 52, fontWeight: 700, marginBottom: 28, color: color.accent }}>{column.title}</div>
              {column.items.map((item, i) => {
                const at = start + 20 + i * 7
                return (
                  <div
                    key={item}
                    style={{
                      fontSize: 44,
                      paddingBlock: 20,
                      borderTop: `1px solid ${color.line}`,
                      opacity: interpolate(frame, [at, at + 12], [0, 1], ease),
                      translate: `${interpolate(frame, [at, at + 12], [-24, 0], ease)}px 0px`,
                    }}
                  >
                    {item}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </Backdrop>
  )
}
