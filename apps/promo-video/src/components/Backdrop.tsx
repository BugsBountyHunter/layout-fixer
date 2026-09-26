import type React from 'react'
import { AbsoluteFill } from 'remotion'
import { sans } from '../lib/fonts'
import { color } from '../lib/theme'

/** Black stage with a soft accent glow; every scene sits on it so cuts feel continuous. */
export const Backdrop: React.FC<{ readonly children: React.ReactNode; readonly glowY?: string }> = ({
  children,
  glowY = '30%',
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: color.bg,
      backgroundImage: `radial-gradient(ellipse 60% 45% at 50% ${glowY}, rgba(10, 132, 255, 0.16), transparent 70%)`,
      fontFamily: sans,
      color: color.label,
    }}
  >
    {children}
  </AbsoluteFill>
)
