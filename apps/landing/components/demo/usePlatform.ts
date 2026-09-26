import { useSyncExternalStore } from 'react'
import { isMacPlatform } from '@/lib/platform'

const MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const noSubscribe = () => () => {}

function subscribeMotion(onChange: () => void): () => void {
  const query = window.matchMedia(MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** False during the server render and hydration; true once the component runs in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  )
}

/** Apple platforms get ⌥⇧F and the macOS Arabic layout; the server render assumes PC. */
export function useIsMac(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => isMacPlatform(navigator),
    () => false,
  )
}

/** False on the server and when the visitor asks for reduced motion. */
export function useCanAnimate(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => !window.matchMedia(MOTION_QUERY).matches,
    () => false,
  )
}
