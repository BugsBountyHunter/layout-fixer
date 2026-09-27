import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../platform/settings'
import { SWITCH_LAYOUT_MESSAGE } from '../shared/constants'
import { requestLayoutSwitch } from './switch-layout'

const sendMessage = vi.fn(async () => undefined)
vi.stubGlobal('chrome', { runtime: { sendMessage } })

afterEach(() => {
  sendMessage.mockClear()
})

const ON = { ...DEFAULT_SETTINGS, switchKeyboardLayout: true }

describe('requestLayoutSwitch', () => {
  it('asks the background to switch after an in-place fix', () => {
    requestLayoutSwitch({ status: 'replaced', language: 'ar' }, ON, 'ar-mac')
    expect(sendMessage).toHaveBeenCalledWith({ type: SWITCH_LAYOUT_MESSAGE, language: 'ar', layout: 'ar-mac' })
  })

  it('does nothing when the setting is off', () => {
    requestLayoutSwitch({ status: 'replaced', language: 'ar' }, DEFAULT_SETTINGS, 'ar-pc')
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it.each([{ status: 'copied', text: 'x' }, { status: 'shown', text: 'x' }, { status: 'empty' }] as const)(
    'does nothing when the text was not replaced ($status)',
    (result) => {
      requestLayoutSwitch(result, ON, 'ar-pc')
      expect(sendMessage).not.toHaveBeenCalled()
    },
  )

  it('never throws when the background is unavailable', () => {
    sendMessage.mockRejectedValueOnce(new Error('Extension context invalidated.'))
    expect(() => requestLayoutSwitch({ status: 'replaced', language: 'en' }, ON, 'ar-pc')).not.toThrow()
  })
})
