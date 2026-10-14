import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { Backdrop } from '../components/Backdrop'
import { Check } from '../components/Check'
import { ShortcutKeys } from '../components/ShortcutKeys'
import { fix } from '../lib/text'
import { color } from '../lib/theme'

const BEFORE = 'Hi Sara, ;dt phg;?'
const AFTER = fix(BEFORE, { layout: 'ar-pc' }).text
// fix() keeps correct words character for character, so the first difference is where the mistyped run starts.
const SPLIT = Array.from(BEFORE).findIndex((char, i) => char !== AFTER[i])
const KEPT = BEFORE.slice(0, SPLIT)
const MISTYPED = BEFORE.slice(SPLIT)
const FIXED = AFTER.slice(SPLIT)
const PRESS_AT = 84

const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) } as const

export const MixedText: React.FC = () => {
  const frame = useCurrentFrame()
  const fixed = frame >= PRESS_AT + 14
  const selection = interpolate(frame, [14, 40], [0, 100], ease)

  return (
    <Backdrop glowY="55%">
      <Interactive.Div
        name="Headline"
        style={{
          position: 'absolute',
          top: 110,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontSize: 92,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          opacity: interpolate(frame, [0, 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Only the wrong words change.
      </Interactive.Div>
      <Interactive.Div
        name="Field"
        style={{
          position: 'absolute',
          top: 400,
          left: 80,
          width: 920,
          height: 190,
          borderRadius: 36,
          background: color.surface,
          border: `2px solid ${fixed ? color.accent : color.line}`,
          display: 'flex',
          alignItems: 'center',
          paddingInline: 52,
          fontSize: 68,
          perspective: 1000,
          overflow: 'hidden',
        }}
      >
        <div
          dir="ltr"
          style={{
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'pre',
            backgroundImage: fixed ? 'none' : 'linear-gradient(rgba(10, 132, 255, 0.4), rgba(10, 132, 255, 0.4))',
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${selection}% 100%`,
            borderRadius: 8,
          }}
        >
          <span style={{ color: fixed ? color.success : color.label }}>{KEPT}</span>
          {fixed ? (
            <span
              dir="rtl"
              style={{
                display: 'inline-block',
                fontWeight: 600,
                color: color.accent,
                rotate: `x ${interpolate(frame, [PRESS_AT + 14, PRESS_AT + 30], [-90, 0], ease)}deg`,
              }}
            >
              {FIXED}
            </span>
          ) : (
            <span
              style={{
                display: 'inline-block',
                rotate: `x ${interpolate(frame, [PRESS_AT + 2, PRESS_AT + 14], [0, 90], ease)}deg`,
                textDecoration: frame > 44 ? `wavy underline ${color.danger}` : 'none',
                textDecorationThickness: 4,
                textUnderlineOffset: 16,
              }}
            >
              {MISTYPED}
            </span>
          )}
        </div>
      </Interactive.Div>
      <div style={{ position: 'absolute', top: 660, width: '100%' }}>
        <ShortcutKeys enter={50} pressAt={PRESS_AT} size={96} />
      </div>
      <Interactive.Div
        name="Kept note"
        style={{
          position: 'absolute',
          top: 860,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          fontSize: 48,
          color: color.secondary,
          opacity: interpolate(frame, [PRESS_AT + 36, PRESS_AT + 54], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Check size={52} stroke={color.success} />
        Your English stays as it is.
      </Interactive.Div>
    </Backdrop>
  )
}
