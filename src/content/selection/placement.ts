interface Box {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

interface Viewport {
  readonly width: number
  readonly height: number
}

const GAP_X = 6
const GAP_Y = 4
const MARGIN = 8

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Button position next to where the selection ends, flipped above when there's no room below. */
export function placeButton(
  anchor: Box,
  viewport: Viewport,
  size: number,
  dir: 'ltr' | 'rtl',
): { left: number; top: number } {
  const left = dir === 'rtl' ? anchor.left - GAP_X - size : anchor.right + GAP_X
  const below = anchor.bottom + GAP_Y
  const top = below + size + MARGIN > viewport.height ? anchor.top - GAP_Y - size : below
  return {
    left: clamp(left, MARGIN, viewport.width - size - MARGIN),
    top: clamp(top, MARGIN, viewport.height - size - MARGIN),
  }
}
