import type React from 'react'
import { useCurrentFrame } from 'remotion'
import { color } from '../lib/theme'

export const Caret: React.FC<{ readonly height: number; readonly solid?: boolean }> = ({ height, solid }) => {
  const frame = useCurrentFrame()
  const on = solid || Math.floor(frame / 16) % 2 === 0
  return (
    <span
      style={{
        display: 'inline-block',
        width: 4,
        height,
        marginInline: 4,
        verticalAlign: 'middle',
        background: color.accent,
        opacity: on ? 1 : 0,
        borderRadius: 2,
      }}
    />
  )
}
