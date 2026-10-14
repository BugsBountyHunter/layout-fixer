import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { Backdrop } from '../components/Backdrop'
import { Logo } from '../components/Logo'
import { color } from '../lib/theme'

export const Title: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <Backdrop glowY="40%">
      <div
        style={{
          position: 'absolute',
          top: 250,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          scale: interpolate(frame, [0, 22], [0.7, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          }),
        }}
      >
        <Logo size={200} />
      </div>
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          top: 520,
          width: '100%',
          textAlign: 'center',
          fontSize: 104,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          opacity: interpolate(frame, [12, 30], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [12, 30], ['0px 30px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Layout Fixer 1.3
      </Interactive.Div>
      <Interactive.Div
        name="Subtitle"
        style={{
          position: 'absolute',
          top: 670,
          width: '100%',
          textAlign: 'center',
          fontSize: 60,
          color: color.accent,
          opacity: interpolate(frame, [26, 44], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        What’s new
      </Interactive.Div>
    </Backdrop>
  )
}
