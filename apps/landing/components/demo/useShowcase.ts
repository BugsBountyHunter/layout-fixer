import { useEffect, useState } from 'react'
import type { Sample } from '@/lib/demo/samples'
import { useCanAnimate } from './usePlatform'

export type Phase = 'typing' | 'pressed' | 'fixed'

export interface Showcase {
  readonly animate: boolean
  readonly paused: boolean
  readonly togglePaused: () => void
  readonly phase: Phase
  readonly sample: Sample
  readonly shown: string
}

const TYPE_MS = 70
const PRESS_MS = 700
const HOLD_MS = 2200

/** Types each sample, "presses" the shortcut, shows the fix, then moves on. Starts on the first sample, fixed. */
export function useShowcase(samples: readonly Sample[]): Showcase {
  const animate = useCanAnimate()
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('fixed')
  const [typedLength, setTypedLength] = useState(samples[0].typed.length)
  // Looping motion needs a way to stop it (WCAG 2.2.2), not only the OS reduced-motion setting.
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!animate || paused) return
    const done = typedLength >= samples[index].typed.length
    const steps: Readonly<Record<Phase, readonly [number, () => void]>> = {
      typing: done ? [PRESS_MS, () => setPhase('pressed')] : [TYPE_MS, () => setTypedLength((n) => n + 1)],
      pressed: [PRESS_MS, () => setPhase('fixed')],
      fixed: [
        HOLD_MS,
        () => {
          setIndex((current) => (current + 1) % samples.length)
          setTypedLength(0)
          setPhase('typing')
        },
      ],
    }
    const [delay, next] = steps[phase]
    const timer = setTimeout(next, delay)
    return () => clearTimeout(timer)
  }, [animate, paused, index, phase, typedLength, samples])

  const sample = samples[index]
  const shown = !animate || phase === 'fixed' ? sample.fixed : sample.typed.slice(0, typedLength)
  return {
    animate,
    paused,
    togglePaused: () => setPaused((value) => !value),
    phase: animate ? phase : 'fixed',
    sample,
    shown,
  }
}
