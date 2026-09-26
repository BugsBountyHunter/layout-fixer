import type React from 'react'
import { color } from '../lib/theme'

/** The app icon: ع on an accent squircle — the letter the U key types on Arabic PC. */
export const Logo: React.FC<{ readonly size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.225,
      background: color.accentFill,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontSize: size * 0.62,
      fontWeight: 600,
      lineHeight: 1,
      paddingBottom: size * 0.08,
    }}
  >
    ع
  </div>
)
