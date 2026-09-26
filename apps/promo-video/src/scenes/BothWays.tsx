import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { Backdrop } from '../components/Backdrop'
import { mono } from '../lib/fonts'
import { convertBetween, detectDirection } from '../lib/text'
import { color } from '../lib/theme'

const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) } as const

const Row: React.FC<{ readonly input: string; readonly start: number }> = ({ input, start }) => {
  const frame = useCurrentFrame()
  const direction = detectDirection(input)
  const output =
    direction === 'en→ar' ? convertBetween(input, 'en-us', 'ar-pc') : convertBetween(input, 'ar-pc', 'en-us')
  const reveal = interpolate(frame, [start + 22, start + 44], [0, 100], ease)
  const text = (value: string, accent: boolean): React.ReactNode => (
    <div
      dir="auto"
      style={{
        width: 620,
        fontSize: 84,
        fontWeight: accent ? 600 : 400,
        color: accent ? color.label : color.secondary,
        textAlign: 'center',
      }}
    >
      {value}
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
        height: 200,
        borderRadius: 40,
        background: color.surface,
        border: `1px solid ${color.line}`,
        opacity: interpolate(frame, [start, start + 16], [0, 1], ease),
        translate: `0px ${interpolate(frame, [start, start + 16], [50, 0], ease)}px`,
      }}
    >
      {text(input, false)}
      <div
        style={{
          fontFamily: mono,
          fontSize: 36,
          fontWeight: 500,
          color: color.accent,
          padding: '14px 28px',
          borderRadius: 999,
          background: 'rgba(10, 132, 255, 0.14)',
          whiteSpace: 'nowrap',
          scale: interpolate(frame, [start + 12, start + 26], [0.6, 1], ease),
          opacity: interpolate(frame, [start + 12, start + 26], [0, 1], ease),
        }}
      >
        {direction === 'en→ar' ? 'en → ar' : 'ar → en'}
      </div>
      <div
        style={{
          clipPath: direction === 'en→ar' ? `inset(0 0 0 ${100 - reveal}%)` : `inset(0 ${100 - reveal}% 0 0)`,
        }}
      >
        {text(output, true)}
      </div>
    </div>
  )
}

export const BothWays: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <Backdrop glowY="55%">
      <Interactive.Div
        name="Headline"
        style={{
          position: 'absolute',
          top: 130,
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
        It knows which way to go.
      </Interactive.Div>
      <div
        style={{
          position: 'absolute',
          top: 360,
          left: 160,
          right: 160,
          display: 'flex',
          flexDirection: 'column',
          gap: 48,
        }}
      >
        <Row input="hgsghl ugd;l" start={14} />
        <Row input={convertBetween('hello world', 'en-us', 'ar-pc')} start={46} />
      </div>
    </Backdrop>
  )
}
