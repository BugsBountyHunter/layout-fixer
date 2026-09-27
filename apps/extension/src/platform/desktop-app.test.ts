import { describe, expect, it, vi } from 'vitest'
import { SWITCH_LAYOUT_MESSAGE } from '../shared/constants'
import {
  DESKTOP_HOST,
  parseLayoutSwitchMessage,
  pingDesktop,
  sendLayoutSwitch,
  supportsDesktopApp,
} from './desktop-app'

describe('parseLayoutSwitchMessage', () => {
  it('accepts a request from the page script', () => {
    expect(parseLayoutSwitchMessage({ type: SWITCH_LAYOUT_MESSAGE, language: 'ar', layout: 'ar-mac' })).toEqual({
      language: 'ar',
      layout: 'ar-mac',
    })
  })

  it.each([
    null,
    'switch',
    { type: 'other', language: 'ar', layout: 'ar-pc' },
    { type: SWITCH_LAYOUT_MESSAGE, language: 'ru', layout: 'ar-pc' },
    { type: SWITCH_LAYOUT_MESSAGE, language: 'ar', layout: 'en-us' },
  ])('ignores %j', (message) => {
    expect(parseLayoutSwitchMessage(message)).toBeNull()
  })
})

describe('sendLayoutSwitch', () => {
  it('asks the desktop app to switch', async () => {
    const sendNativeMessage = vi.fn(async () => ({ ok: true, result: 'switched' }))
    await sendLayoutSwitch({ sendNativeMessage }, { language: 'en', layout: 'ar-pc' })
    expect(sendNativeMessage).toHaveBeenCalledWith(DESKTOP_HOST, {
      type: 'switch-layout',
      language: 'en',
      layout: 'ar-pc',
    })
  })

  it('does nothing without the permission (the API is absent)', async () => {
    await expect(sendLayoutSwitch({}, { language: 'ar', layout: 'ar-pc' })).resolves.toBeUndefined()
  })

  it('only warns when the desktop app is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const sendNativeMessage = vi.fn(async () => Promise.reject(new Error('Specified native messaging host not found.')))
    await expect(sendLayoutSwitch({ sendNativeMessage }, { language: 'ar', layout: 'ar-pc' })).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it.each(['wayland', 'unsupported', 'system'])('warns with the code when the desktop app answers %s', async (code) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const sendNativeMessage = vi.fn(async () => ({ ok: false, version: '1.3.1', error: code }))
    await expect(sendLayoutSwitch({ sendNativeMessage }, { language: 'ar', layout: 'ar-pc' })).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith('[layout-fixer] The desktop app could not switch the keyboard layout:', code)
    warn.mockRestore()
  })

  it('warns when the answer is not from a known desktop app', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const sendNativeMessage = vi.fn(async () => 'hello')
    await sendLayoutSwitch({ sendNativeMessage }, { language: 'ar', layout: 'ar-pc' })
    expect(warn).toHaveBeenCalledWith('[layout-fixer] The desktop app could not switch the keyboard layout:', 'unknown')
    warn.mockRestore()
  })

  it('stays quiet when the switch succeeds', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const sendNativeMessage = vi.fn(async () => ({ ok: true, version: '1.3.1', result: 'not-installed' }))
    await sendLayoutSwitch({ sendNativeMessage }, { language: 'ar', layout: 'ar-pc' })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('pingDesktop', () => {
  it('reports the connected version', async () => {
    const sendNativeMessage = vi.fn(async () => ({ ok: true, version: '1.3.0' }))
    await expect(pingDesktop({ sendNativeMessage })).resolves.toEqual({ kind: 'connected', version: '1.3.0' })
    expect(sendNativeMessage).toHaveBeenCalledWith(DESKTOP_HOST, { type: 'ping' })
  })

  it.each([
    ['the API is absent', {}],
    ['the host is not installed', { sendNativeMessage: async () => Promise.reject(new Error('not found')) }],
    ['the answer is unexpected', { sendNativeMessage: async () => ({ ok: 'yes' }) }],
  ])('reports missing when %s', async (_case, runtime) => {
    await expect(pingDesktop(runtime)).resolves.toEqual({ kind: 'missing' })
  })
})

describe('supportsDesktopApp', () => {
  it.each([
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/140.0', true],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0', true],
    ['Mozilla/5.0 (Android 15; Mobile; rv:142.0) Gecko/142.0 Firefox/142.0', false],
  ])('%s → %s', (ua, supported) => {
    expect(supportsDesktopApp(ua)).toBe(supported)
  })
})
