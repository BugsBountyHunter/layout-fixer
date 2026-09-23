import { describe, expect, it } from 'vitest'
import { placeButton } from './placement'

const viewport = { width: 1000, height: 800 }
const SIZE = 28

describe('placeButton', () => {
  it('sits just after the end of the selection in left-to-right text', () => {
    expect(placeButton({ left: 100, top: 200, right: 300, bottom: 220 }, viewport, SIZE, 'ltr')).toEqual({
      left: 306,
      top: 224,
    })
  })

  it('sits just before the start of the selection in right-to-left text', () => {
    expect(placeButton({ left: 100, top: 200, right: 300, bottom: 220 }, viewport, SIZE, 'rtl')).toEqual({
      left: 66,
      top: 224,
    })
  })

  it('stays inside the viewport near the right and bottom edges', () => {
    expect(placeButton({ left: 900, top: 780, right: 995, bottom: 798 }, viewport, SIZE, 'ltr')).toEqual({
      left: 964,
      top: 748,
    })
  })

  it('stays inside the viewport near the left and top edges', () => {
    expect(placeButton({ left: 2, top: -40, right: 20, bottom: -20 }, viewport, SIZE, 'rtl')).toEqual({
      left: 8,
      top: 8,
    })
  })
})
