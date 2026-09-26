import { describe, expect, it } from 'vitest'
import { menuOptions } from './menu-options'

describe('menuOptions', () => {
  it('offers Arabic for text typed on the English layout', () => {
    expect(menuOptions('hgsghl ugd;l', 'ar-pc')).toEqual([
      { direction: 'en→ar', language: 'ar', name: 'العربية', chip: 'ع', preview: 'السلام عليكم' },
    ])
  })

  it('offers English for text typed on the Arabic layout', () => {
    expect(menuOptions('اثممخ', 'ar-pc')).toEqual([
      { direction: 'ar→en', language: 'en', name: 'English', chip: 'EN', preview: 'hello' },
    ])
  })

  it('offers the detected direction first when both would change the text', () => {
    const options = menuOptions('hgsghl عل', 'ar-pc')
    expect(options.map((option) => option.language)).toEqual(['ar', 'en'])
  })

  it('uses the chosen Arabic layout for previews', () => {
    expect(menuOptions('lnpfh', 'ar-mac')[0].preview).toBe('مرحبا')
    expect(menuOptions('lnpfh', 'ar-pc')[0].preview).toBe('مىحبا')
  })

  it('offers nothing when no option would change the text', () => {
    expect(menuOptions('123 456', 'ar-pc')).toEqual([])
    expect(menuOptions('😀', 'ar-pc')).toEqual([])
  })
})
