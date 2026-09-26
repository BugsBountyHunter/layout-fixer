import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { Backdrop } from '../components/Backdrop'
import { Check } from '../components/Check'
import { Keycap } from '../components/Keycap'
import { convertBetween } from '../lib/text'
import { color } from '../lib/theme'

const BEFORE = 'hgsghl ugd;l ;dt phg;?'
const AFTER = convertBetween(BEFORE, 'en-us', 'ar-pc')
const PRESS_AT = 82
const KEYS = [
  { label: 'Alt', units: 1.6, enter: 50 },
  { label: 'Shift', units: 2, enter: 58 },
  { label: 'F', units: 1, enter: 66 },
] as const

const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) } as const

const Word: React.FC<{ readonly text: string; readonly on: number }> = ({ text, on }) => (
  <span style={{ color: on ? color.label : color.tertiary, marginInline: 22 }}>{text}</span>
)

export const FixScene: React.FC = () => {
  const frame = useCurrentFrame()
  const selection = interpolate(frame, [12, 42], [0, 100], ease)
  const press = interpolate(frame, [PRESS_AT, PRESS_AT + 4, PRESS_AT + 14], [0, 1, 0], ease)
  const flipOut = interpolate(frame, [PRESS_AT + 6, PRESS_AT + 18], [0, 90], ease)
  const flipIn = interpolate(frame, [PRESS_AT + 16, PRESS_AT + 34], [-90, 0], ease)
  const fixed = frame >= PRESS_AT + 16

  return (
    <Backdrop glowY="60%">
      <div
        style={{
          position: 'absolute',
          top: 130,
          width: '100%',
          textAlign: 'center',
          fontSize: 110,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        <Word text="Select." on={frame >= 10 ? 1 : 0} />
        <Word text="Press." on={frame >= 50 ? 1 : 0} />
        <Word text="Fixed." on={fixed ? 1 : 0} />
      </div>
      <Interactive.Div
        name="Field"
        style={{
          position: 'absolute',
          left: 260,
          top: 380,
          width: 1400,
          height: 220,
          borderRadius: 40,
          background: color.surface,
          border: `2px solid ${fixed ? color.accent : color.line}`,
          display: 'flex',
          alignItems: 'center',
          paddingInline: 64,
          perspective: 1200,
          overflow: 'hidden',
        }}
      >
        {fixed ? (
          <div dir="rtl" style={{ width: '100%', fontSize: 92, fontWeight: 600, rotate: `x ${flipIn}deg` }}>
            {AFTER}
          </div>
        ) : (
          <div
            dir="ltr"
            style={{
              fontSize: 84,
              rotate: `x ${flipOut}deg`,
              backgroundImage: 'linear-gradient(rgba(10, 132, 255, 0.45), rgba(10, 132, 255, 0.45))',
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${selection}% 100%`,
              borderRadius: 8,
            }}
          >
            {BEFORE}
          </div>
        )}
      </Interactive.Div>
      <div
        style={{ position: 'absolute', top: 690, width: '100%', display: 'flex', justifyContent: 'center', gap: 28 }}
      >
        {KEYS.map((key, i) => (
          <div
            key={key.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              opacity: interpolate(frame, [key.enter, key.enter + 12], [0, 1], ease),
              translate: `0px ${interpolate(frame, [key.enter, key.enter + 12], [40, 0], ease)}px`,
            }}
          >
            {i > 0 ? <span style={{ fontSize: 60, color: color.tertiary }}>+</span> : null}
            <Keycap en={key.label} units={key.units} press={press} size={120} />
          </div>
        ))}
      </div>
      <Interactive.Div
        name="Undo note"
        style={{
          position: 'absolute',
          bottom: 110,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18,
          fontSize: 52,
          color: color.secondary,
          opacity: interpolate(frame, [135, 155], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Check size={56} stroke={color.success} />
        Replaced in place — Ctrl+Z undoes it.
      </Interactive.Div>
    </Backdrop>
  )
}
