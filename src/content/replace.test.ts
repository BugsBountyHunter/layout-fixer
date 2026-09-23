// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fixActiveElement } from './replace'

function mount<T extends HTMLElement>(html: string): T {
  document.body.innerHTML = html
  const el = document.body.firstElementChild as T
  el.focus()
  return el
}

function selectText(node: Node): void {
  const range = document.createRange()
  range.selectNodeContents(node)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
}

const clipboard = { writeText: vi.fn<(text: string) => Promise<void>>() }

beforeEach(() => {
  clipboard.writeText.mockReset().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true })
  // happy-dom doesn't implement execCommand; every supported browser does.
  Object.defineProperty(document, 'execCommand', { value: () => false, configurable: true, writable: true })
})

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
  vi.restoreAllMocks()
})

describe('fixActiveElement — <input> and <textarea>', () => {
  it.each(['text', 'search', 'url', 'tel'])(
    'converts the whole value of an <input type="%s"> when nothing is selected',
    async (type) => {
      const input = mount<HTMLInputElement>(`<input type="${type}" value="hgsghl ugd;l">`)
      input.setSelectionRange(3, 3)

      await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced' })
      expect(input.value).toBe('السلام عليكم')
    },
  )

  it('converts only the selected part and keeps it selected', async () => {
    const input = mount<HTMLInputElement>('<input value="ok hgsghl">')
    input.setSelectionRange(3, 9)

    await fixActiveElement()
    expect(input.value).toBe('ok السلام')
    expect(input.value.slice(input.selectionStart!, input.selectionEnd!)).toBe('السلام')
  })

  it('converts a <textarea> across lines', async () => {
    const textarea = mount<HTMLTextAreaElement>('<textarea>hgsghl\nugd;l</textarea>')

    await fixActiveElement()
    expect(textarea.value).toBe('السلام\nعليكم')
  })

  it('inserts through execCommand over the target range so the browser records undo', async () => {
    const input = mount<HTMLInputElement>('<input value="ok hgsghl">')
    input.setSelectionRange(3, 9)
    const execCommand = vi.spyOn(document, 'execCommand').mockImplementation(() => {
      expect([input.selectionStart, input.selectionEnd]).toEqual([3, 9])
      input.setRangeText('السلام', 3, 9, 'end')
      return true
    })
    const onInput = vi.fn()
    input.addEventListener('input', onInput)

    await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced' })
    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'السلام')
    expect(input.value.slice(input.selectionStart!, input.selectionEnd!)).toBe('السلام')
    expect(onInput).not.toHaveBeenCalled()
  })

  it('selects the whole value before inserting when nothing was selected', async () => {
    const input = mount<HTMLInputElement>('<input value="hgsghl">')
    input.setSelectionRange(2, 2)
    let rangeAtInsert: [number | null, number | null] = [null, null]
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      rangeAtInsert = [input.selectionStart, input.selectionEnd]
      return true
    })

    await fixActiveElement()
    expect(rangeAtInsert).toEqual([0, 6])
  })

  it('falls back to setRangeText + an input event when execCommand is unavailable', async () => {
    const input = mount<HTMLInputElement>('<input value="hgsghl">')
    const onInput = vi.fn()
    input.addEventListener('input', onInput)

    await fixActiveElement()
    expect(input.value).toBe('السلام')
    expect(onInput).toHaveBeenCalledOnce()
  })

  it('dispatches a bubbling input event so React/Vue/Angular state updates', async () => {
    mount<HTMLInputElement>('<input value="اثممخ">')
    const onInput = vi.fn()
    document.body.addEventListener('input', onInput)

    await fixActiveElement()
    expect(onInput).toHaveBeenCalledOnce()
  })

  it('reports empty for an empty field', async () => {
    mount<HTMLInputElement>('<input value="">')
    await expect(fixActiveElement()).resolves.toEqual({ status: 'empty' })
  })

  it('never touches password fields', async () => {
    const input = mount<HTMLInputElement>('<input type="password" value="hgsghl">')
    await expect(fixActiveElement()).resolves.toEqual({ status: 'empty' })
    expect(input.value).toBe('hgsghl')
  })

  it('does not edit read-only fields; copies the fixed text instead', async () => {
    const input = mount<HTMLInputElement>('<input readonly value="hgsghl">')

    await expect(fixActiveElement()).resolves.toEqual({ status: 'copied', text: 'السلام' })
    expect(input.value).toBe('hgsghl')
  })
})

describe('fixActiveElement — contenteditable editors (Gmail, WhatsApp Web, Slack)', () => {
  it('inserts through execCommand so the editor keeps undo history', async () => {
    const editor = mount<HTMLDivElement>('<div contenteditable="true">hgsghl</div>')
    selectText(editor)
    const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true)

    await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced' })
    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'السلام')
  })

  it('falls back to copying when the editor rejects execCommand', async () => {
    const editor = mount<HTMLDivElement>('<div contenteditable="true">hgsghl</div>')
    selectText(editor)
    vi.spyOn(document, 'execCommand').mockReturnValue(false)

    await expect(fixActiveElement()).resolves.toEqual({ status: 'copied', text: 'السلام' })
    expect(clipboard.writeText).toHaveBeenCalledWith('السلام')
  })

  it('reports empty when the caret is in an editor with no selection', async () => {
    mount<HTMLDivElement>('<div contenteditable="true">hgsghl</div>')
    await expect(fixActiveElement()).resolves.toEqual({ status: 'empty' })
  })
})

describe('fixActiveElement — read-only page text (e.g. a message someone sent)', () => {
  it('copies the fixed text to the clipboard', async () => {
    const paragraph = mount<HTMLParagraphElement>('<p>اثممخ صخقمي</p>')
    selectText(paragraph)

    await expect(fixActiveElement()).resolves.toEqual({ status: 'copied', text: 'hello world' })
    expect(clipboard.writeText).toHaveBeenCalledWith('hello world')
    expect(paragraph.textContent).toBe('اثممخ صخقمي')
  })

  it('still shows the fixed text when the clipboard is blocked', async () => {
    clipboard.writeText.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
    vi.spyOn(document, 'execCommand').mockReturnValue(false)
    selectText(mount('<p>hgsghl</p>'))

    await expect(fixActiveElement()).resolves.toEqual({ status: 'shown', text: 'السلام' })
  })

  it('reports empty when nothing is selected', async () => {
    mount('<p>hgsghl</p>')
    await expect(fixActiveElement()).resolves.toEqual({ status: 'empty' })
  })
})

describe('fixActiveElement — disabled fields', () => {
  it('copies instead of editing a disabled field', async () => {
    const input = mount<HTMLInputElement>('<input disabled value="hgsghl">')
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(input)

    await expect(fixActiveElement()).resolves.toEqual({ status: 'copied', text: 'السلام' })
    expect(input.value).toBe('hgsghl')
  })
})

describe('fixActiveElement — keyboard layout', () => {
  it('uses the PC Arabic layout by default', async () => {
    const input = mount<HTMLInputElement>('<input value="lvpfh">')
    await fixActiveElement()
    expect(input.value).toBe('مرحبا')
  })

  it('uses the layout it is given', async () => {
    const input = mount<HTMLInputElement>('<input value="lnpfh">')
    await fixActiveElement({ layout: 'ar-mac' })
    expect(input.value).toBe('مرحبا')
  })

  it('applies the layout to copied read-only text too', async () => {
    selectText(mount('<p>lnpfh</p>'))
    await expect(fixActiveElement({ layout: 'ar-mac' })).resolves.toEqual({ status: 'copied', text: 'مرحبا' })
  })
})

describe('fixActiveElement — forced direction', () => {
  it('converts in the direction it is given, even against the detected script', async () => {
    const input = mount<HTMLInputElement>('<input value="hgsghl عل">')
    await fixActiveElement({ direction: 'ar→en' })
    expect(input.value).toBe('hgsghl ug')
  })
})
