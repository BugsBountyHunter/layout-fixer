import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { Backdrop } from '../components/Backdrop'
import { Caret } from '../components/Caret'
import { charCount, takeChars } from '../lib/text'
import { color } from '../lib/theme'

const TYPED = 'hgsghl ugd;l ;dt phg;?'
const TYPE_START = 20
const FRAMES_PER_CHAR = 3.4

export const Hook: React.FC = () => {
  const frame = useCurrentFrame()
  const shown = takeChars(TYPED, (frame - TYPE_START) / FRAMES_PER_CHAR)
  const done = shown.length === TYPED.length && charCount(shown) > 0

  return (
    <Backdrop glowY="75%">
      <Interactive.Div
        name="Headline"
        style={{
          position: 'absolute',
          top: 140,
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
          translate: interpolate(frame, [0, 18], ['0px 30px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        You meant to type Arabic.
      </Interactive.Div>
      <Interactive.Div
        name="Subline"
        style={{
          position: 'absolute',
          top: 300,
          width: '100%',
          textAlign: 'center',
          fontSize: 60,
          color: color.secondary,
          opacity: interpolate(frame, [100, 118], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        The keyboard was still on English.
      </Interactive.Div>
      <Interactive.Div
        name="Composer"
        style={{
          position: 'absolute',
          left: 260,
          top: 520,
          width: 1400,
          padding: '56px 64px',
          borderRadius: 40,
          background: color.surface,
          border: `1px solid ${color.line}`,
          boxShadow: '0 40px 120px rgba(0, 0, 0, 0.6)',
          opacity: interpolate(frame, [4, 22], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [4, 22], [0.94, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          }),
        }}
      >
        <div style={{ fontSize: 36, color: color.secondary, marginBottom: 24 }}>Message</div>
        <div
          dir="ltr"
          style={{
            fontSize: 84,
            minHeight: 110,
            textDecoration: done && frame > 100 ? `wavy underline ${color.danger}` : 'none',
            textDecorationThickness: 4,
            textUnderlineOffset: 18,
          }}
        >
          {shown}
          <Caret height={90} solid={!done} />
        </div>
      </Interactive.Div>
    </Backdrop>
  )
}
