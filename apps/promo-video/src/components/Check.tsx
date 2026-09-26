import type React from 'react'

export const Check: React.FC<{ readonly size: number; readonly stroke: string }> = ({ size, stroke }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke={stroke} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
