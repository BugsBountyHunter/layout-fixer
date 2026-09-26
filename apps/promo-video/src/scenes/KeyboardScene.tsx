import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { Backdrop } from '../components/Backdrop'
import { Keyboard, keyForChar } from '../components/Keyboard'
import { mono } from '../lib/fonts'
import { charCount, convertBetween, takeChars } from '../lib/text'
import { color } from '../lib/theme'

const WORD = 'hgsghl ugd;l'
const TYPE_START = 55
const STEP = 13

const keyStates = (frame: number): { pressed: Record<string, number>; glow: Record<string, number> } => {
  const pressed: Record<string, number> = {}
  const glow: Record<string, number> = {}
  Array.from(WORD).forEach((char, i) => {
    const code = keyForChar(char)
    if (!code) return
    const t = frame - (TYPE_START + i * STEP)
    const press = interpolate(t, [0, 3, 10], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    pressed[code] = Math.max(pressed[code] ?? 0, press)
    if (t > 0) glow[code] = 1
  })
  return { pressed, glow }
}

const OutputBox: React.FC<{ readonly label: string; readonly text: string; readonly rtl?: boolean }> = ({
  label,
  text,
  rtl,
}) => (
  <div
    style={{
      width: 620,
      height: 130,
      borderRadius: 28,
      background: color.surface,
      border: `1px solid ${color.line}`,
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      paddingInline: 36,
    }}
  >
    <div style={{ fontSize: 28, fontWeight: 600, color: color.tertiary, width: 60 }}>{label}</div>
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      style={{ flex: 1, fontSize: 70, fontWeight: rtl ? 600 : 400, color: rtl ? color.accent : color.label }}
    >
      {text}
    </div>
  </div>
)

export const KeyboardScene: React.FC = () => {
  const frame = useCurrentFrame()
  const typed = takeChars(WORD, (frame - TYPE_START) / STEP + 1)
  const { pressed, glow } = keyStates(frame)

  return (
    <Backdrop glowY="70%">
      <Interactive.Div
        name="Headline"
        style={{
          position: 'absolute',
          top: 60,
          width: '100%',
          textAlign: 'center',
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          opacity: interpolate(frame, [0, 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Same keys. Different layout.
      </Interactive.Div>
      <Interactive.Div
        name="Output"
        style={{
          position: 'absolute',
          top: 215,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 40,
          opacity: interpolate(frame, [30, 50], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <OutputBox label="EN" text={typed} />
        <div style={{ fontSize: 60, color: color.tertiary }}>→</div>
        <OutputBox label="AR" text={charCount(typed) ? convertBetween(typed, 'en-us', 'ar-pc') : ''} rtl />
      </Interactive.Div>
      <div
        style={{
          position: 'absolute',
          top: 390,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          perspective: 2200,
        }}
      >
        <Interactive.Div
          name="Keyboard"
          style={{
            padding: 28,
            borderRadius: 36,
            background: '#111113',
            border: `1px solid ${color.line}`,
            rotate: interpolate(frame, [0, 40], ['x 45deg', 'x 14deg'], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            opacity: interpolate(frame, [0, 25], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <Keyboard pressed={pressed} glow={glow} size={82} />
        </Interactive.Div>
      </div>
      <Interactive.Div
        name="Code"
        style={{
          position: 'absolute',
          bottom: 60,
          width: '100%',
          textAlign: 'center',
          fontFamily: mono,
          fontSize: 40,
          color: color.secondary,
          opacity: interpolate(frame, [225, 245], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <span style={{ color: color.accent }}>convertBetween</span>(text,{' '}
        <span style={{ color: color.label }}>'en-us'</span>, <span style={{ color: color.label }}>'ar-pc'</span>)
      </Interactive.Div>
    </Backdrop>
  )
}
