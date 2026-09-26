import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { AR_PC } from '../../../../packages/core/src/layouts/ar-pc'
import { Backdrop } from '../components/Backdrop'
import { Keycap } from '../components/Keycap'
import { Logo } from '../components/Logo'
import { color } from '../lib/theme'

const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) } as const
const SIZE = 300

export const Outro: React.FC = () => {
  const frame = useCurrentFrame()
  const press = interpolate(frame, [40, 44, 54], [0, 1, 0], ease)
  const morph = interpolate(frame, [52, 80], [0, 1], ease)

  return (
    <Backdrop glowY="40%">
      <div
        style={{
          position: 'absolute',
          left: 960 - SIZE / 2,
          top: 390 - SIZE / 2,
          width: SIZE,
          height: SIZE,
          translate: `0px ${interpolate(frame, [90, 115], [0, -80], ease)}px`,
          scale: interpolate(frame, [0, 22], [0.6, 1], ease),
          opacity: interpolate(frame, [0, 14], [0, 1], ease),
        }}
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - morph }}>
          <Keycap en="U" ar={AR_PC.keys.KeyU?.[0] ?? undefined} press={press} size={SIZE} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: morph, scale: 0.85 + morph * 0.15 }}>
          <Logo size={SIZE} />
        </div>
      </div>
      <Interactive.Div
        name="Key hint"
        style={{
          position: 'absolute',
          top: 610,
          width: '100%',
          textAlign: 'center',
          fontSize: 52,
          color: color.secondary,
          opacity: interpolate(frame, [16, 30, 78, 90], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        On Arabic PC, the U key types ع.
      </Interactive.Div>
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          top: 560,
          width: '100%',
          textAlign: 'center',
          fontSize: 140,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          opacity: interpolate(frame, [96, 116], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [96, 116], ['0px 40px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Layout Fixer
      </Interactive.Div>
      <Interactive.Div
        name="Tagline"
        style={{
          position: 'absolute',
          top: 730,
          width: '100%',
          textAlign: 'center',
          fontSize: 58,
          color: color.secondary,
          opacity: interpolate(frame, [110, 128], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div>Wrong layout? One keystroke.</div>
        <div dir="rtl" style={{ marginTop: 12 }}>
          لوحة المفاتيح خاطئة؟ ضغطة واحدة تصلحها.
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="Footer"
        style={{
          position: 'absolute',
          bottom: 80,
          width: '100%',
          textAlign: 'center',
          fontSize: 44,
          color: color.accent,
          opacity: interpolate(frame, [124, 142], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Free on the Chrome Web Store · Open source, MIT
      </Interactive.Div>
    </Backdrop>
  )
}
