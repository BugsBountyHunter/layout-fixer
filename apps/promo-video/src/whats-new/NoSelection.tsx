import type React from 'react'
import { Easing, Interactive, interpolate, useCurrentFrame } from 'remotion'
import { Backdrop } from '../components/Backdrop'
import { Caret } from '../components/Caret'
import { ShortcutKeys } from '../components/ShortcutKeys'
import { charCount, fix, mistypedTailStart, takeChars } from '../lib/text'
import { color } from '../lib/theme'

const TYPED = 'Thanks, lu hgsghlm'
const TAIL_START = mistypedTailStart(TYPED, { layout: 'ar-pc' }) ?? TYPED.length
const HEAD = TYPED.slice(0, TAIL_START)
const TAIL = TYPED.slice(TAIL_START)
const FIXED_TAIL = fix(TAIL, { layout: 'ar-pc' }).text
const TYPE_START = 18
const FRAMES_PER_CHAR = 2.6
const PRESS_AT = 108
const APPS = ['WhatsApp Web', 'Gmail', 'Slack'] as const

const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) } as const

const Composer: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const shown = takeChars(TYPED, (frame - TYPE_START) / FRAMES_PER_CHAR)
  const typing = charCount(shown) < charCount(TYPED)
  const fixed = frame >= PRESS_AT + 16
  // The tail is selected backwards from the caret, the way the extension does it.
  const reach = interpolate(frame, [PRESS_AT + 2, PRESS_AT + 12], [0, 100], ease)

  if (typing) {
    return (
      <div dir="ltr" style={{ whiteSpace: 'pre' }}>
        {shown}
        <Caret height={78} solid />
      </div>
    )
  }
  return (
    <div dir="ltr" style={{ display: 'flex', alignItems: 'center', whiteSpace: 'pre' }}>
      <span>{HEAD}</span>
      {fixed ? (
        <span
          dir="rtl"
          style={{
            display: 'inline-block',
            fontWeight: 600,
            color: color.accent,
            rotate: `x ${interpolate(frame, [PRESS_AT + 16, PRESS_AT + 32], [-90, 0], ease)}deg`,
          }}
        >
          {FIXED_TAIL}
        </span>
      ) : (
        <span
          style={{
            display: 'inline-block',
            backgroundImage: 'linear-gradient(rgba(10, 132, 255, 0.4), rgba(10, 132, 255, 0.4))',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right',
            backgroundSize: `${reach}% 100%`,
            borderRadius: 8,
            rotate: `x ${interpolate(frame, [PRESS_AT + 13, PRESS_AT + 16], [0, 90], ease)}deg`,
          }}
        >
          {TAIL}
        </span>
      )}
      <Caret height={78} />
    </div>
  )
}

export const NoSelection: React.FC = () => {
  const frame = useCurrentFrame()
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
          letterSpacing: '-0.02em',
          opacity: interpolate(frame, [0, 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        No need to select.
      </Interactive.Div>
      <Interactive.Div
        name="Subline"
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontSize: 50,
          color: color.secondary,
          opacity: interpolate(frame, [70, 88], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Keep typing, then press the shortcut.
      </Interactive.Div>
      <Interactive.Div
        name="Composer"
        style={{
          position: 'absolute',
          top: 360,
          left: 80,
          width: 920,
          padding: '36px 52px',
          borderRadius: 36,
          background: color.surface,
          border: `2px solid ${frame >= PRESS_AT + 16 ? color.accent : color.line}`,
          fontSize: 68,
          perspective: 1000,
          opacity: interpolate(frame, [4, 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div style={{ fontSize: 34, color: color.secondary, marginBottom: 14 }}>Message</div>
        <div style={{ minHeight: 92, display: 'flex', alignItems: 'center' }}>
          <Composer frame={frame} />
        </div>
      </Interactive.Div>
      <div style={{ position: 'absolute', top: 660, width: '100%' }}>
        <ShortcutKeys enter={76} pressAt={PRESS_AT} size={96} />
      </div>
      <Interactive.Div
        name="Apps"
        style={{
          position: 'absolute',
          top: 850,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18,
          fontSize: 44,
          color: color.secondary,
          opacity: interpolate(frame, [PRESS_AT + 44, PRESS_AT + 62], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Now in
        {APPS.map((app) => (
          <span
            key={app}
            style={{
              paddingBlock: 10,
              paddingInline: 24,
              borderRadius: 999,
              background: color.surfaceRaised,
              color: color.label,
            }}
          >
            {app}
          </span>
        ))}
      </Interactive.Div>
    </Backdrop>
  )
}
