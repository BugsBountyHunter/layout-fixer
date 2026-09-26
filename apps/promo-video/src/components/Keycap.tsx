import type React from 'react'
import { color } from '../lib/theme'

export const UNIT = 92
export const GAP = 10

type Props = {
  readonly en: string
  readonly ar?: string
  readonly units?: number
  /** 0 = resting, 1 = fully pressed. */
  readonly press?: number
  /** 0..1 afterglow for keys already typed. */
  readonly glow?: number
  readonly size?: number
}

export const Keycap: React.FC<Props> = ({ en, ar, units = 1, press = 0, glow = 0, size = UNIT }) => {
  const lit = Math.max(press, glow * 0.35)
  return (
    <div
      style={{
        position: 'relative',
        width: units * size + (units - 1) * GAP * (size / UNIT),
        height: size,
        borderRadius: size * 0.16,
        background: `color-mix(in srgb, ${color.accentFill} ${lit * 100}%, ${color.surfaceRaised})`,
        boxShadow: `0 ${6 - press * 5}px 0 ${color.surface}, 0 0 ${press * 60}px ${color.accent}`,
        translate: `0px ${press * 5}px`,
        border: `1px solid ${color.line}`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          insetInlineStart: size * 0.14,
          top: size * 0.1,
          fontSize: size * (en.length > 1 ? 0.2 : 0.3),
          color: press > 0.5 ? color.label : color.secondary,
        }}
      >
        {en}
      </div>
      {ar ? (
        <div
          dir="rtl"
          style={{
            position: 'absolute',
            right: size * 0.14,
            bottom: size * 0.06,
            fontSize: size * 0.36,
            fontWeight: 600,
            color: press > 0.5 ? color.label : color.accent,
          }}
        >
          {ar}
        </div>
      ) : null}
    </div>
  )
}
