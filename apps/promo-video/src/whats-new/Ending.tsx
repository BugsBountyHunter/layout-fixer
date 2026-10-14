import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { Backdrop } from '../components/Backdrop'
import { Logo } from '../components/Logo'
import { color } from '../lib/theme'

export const Ending: React.FC = () => {
  const frame = useCurrentFrame()
  return (
    <Backdrop glowY="35%">
      <div
        style={{
          position: 'absolute',
          top: 170,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        <Logo size={170} />
      </div>
      <Interactive.Div
        name="Desktop"
        style={{
          position: 'absolute',
          top: 410,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontSize: 76,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          opacity: interpolate(frame, [8, 26], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [8, 26], ['0px 24px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Desktop app updated too
      </Interactive.Div>
      <Interactive.Div
        name="Platforms"
        style={{
          position: 'absolute',
          top: 520,
          width: '100%',
          textAlign: 'center',
          fontSize: 46,
          lineHeight: 1.3,
          color: color.secondary,
          opacity: interpolate(frame, [20, 38], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {/* Only the mixed-text fix reached the desktop app; it still needs a selection. */}
        <div>Mixed-text fixing on</div>
        <div>macOS · Windows · Linux</div>
      </Interactive.Div>
      <Interactive.Div
        name="Website"
        style={{
          position: 'absolute',
          top: 700,
          width: '100%',
          textAlign: 'center',
          fontSize: 84,
          fontWeight: 600,
          color: color.accent,
          opacity: interpolate(frame, [46, 64], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        layoutfixer.dev
      </Interactive.Div>
      <Interactive.Div
        name="Footer"
        style={{
          position: 'absolute',
          top: 830,
          width: '100%',
          textAlign: 'center',
          fontSize: 46,
          color: color.secondary,
          opacity: interpolate(frame, [58, 76], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Free · Open source · Private
      </Interactive.Div>
    </Backdrop>
  )
}
