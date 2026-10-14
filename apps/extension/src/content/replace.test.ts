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
    'converts the whole value of an <input type="%s"> when it is all mistyped and nothing is selected',
    async (type) => {
      const input = mount<HTMLInputElement>(`<input type="${type}" value="hgsghl ugd;l">`)
      input.setSelectionRange(12, 12)

      await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced', language: 'ar' })
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

    await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced', language: 'ar' })
    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'السلام')
    expect(input.value.slice(input.selectionStart!, input.selectionEnd!)).toBe('السلام')
    expect(onInput).not.toHaveBeenCalled()
  })

  it('selects the mistyped word before inserting when nothing was selected', async () => {
    const input = mount<HTMLInputElement>('<input value="hgsghl">')
    input.setSelectionRange(6, 6)
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

describe('fixActiveElement — nothing selected in a field', () => {
  it('fixes only the mistyped words before the caret and selects the result', async () => {
    const input = mount<HTMLInputElement>('<input value="hgsghl meeting at 5 hgsghl ugd;l">')
    input.setSelectionRange(31, 31)

    await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced', language: 'ar' })
    expect(input.value).toBe('hgsghl meeting at 5 السلام عليكم')
    expect([input.selectionStart, input.selectionEnd]).toEqual([20, 32])
  })

  it('takes the whole word when the caret is inside it', async () => {
    const input = mount<HTMLInputElement>('<input value="ok hgsghl ugd;l">')
    input.setSelectionRange(5, 5)

    await fixActiveElement()
    expect(input.value).toBe('ok السلام ugd;l')
  })

  it('does not take the next word when the caret is at its start', async () => {
    const textarea = mount<HTMLTextAreaElement>('<textarea>اثممخ\nصخقمي</textarea>')
    textarea.setSelectionRange(0, 0)

    await fixActiveElement()
    expect(textarea.value).toBe('hello\nworld')
  })

  it('works on the line before the caret in a textarea', async () => {
    const textarea = mount<HTMLTextAreaElement>('<textarea>Hi team\nhgsghl ugd;l\nthanks</textarea>')
    textarea.setSelectionRange(20, 20)

    await fixActiveElement()
    expect(textarea.value).toBe('Hi team\nالسلام عليكم\nthanks')
  })

  it('falls back to the whole field when no mistyped words end before the caret', async () => {
    const input = mount<HTMLInputElement>('<input value="hello world">')
    input.setSelectionRange(11, 11)

    await fixActiveElement()
    expect(input.value).toBe('اثممخ صخقمي')
  })
})

describe('fixActiveElement — mixed text', () => {
  it('fixes only the mistyped words of the field', async () => {
    const input = mount<HTMLInputElement>('<input type="text" value="meeting at 5 hgsghl ugd;l">')
    await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced', language: 'ar' })
    expect(input.value).toBe('meeting at 5 السلام عليكم')
  })
})

describe('fixActiveElement — target language', () => {
  it('reports English when Arabic-layout text was fixed', async () => {
    mount<HTMLInputElement>('<input type="text" value="اثممخ">')
    await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced', language: 'en' })
  })

  it('follows the words that were fixed, not the majority of the text', async () => {
    const input = mount<HTMLInputElement>('<input type="text" value="see you at the office اثممخ">')
    await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced', language: 'en' })
    expect(input.value).toBe('see you at the office hello')
  })

  it('follows an explicit direction', async () => {
    mount<HTMLInputElement>('<input type="text" value="hello">')
    await expect(fixActiveElement({ direction: 'ar→en' })).resolves.toEqual({ status: 'replaced', language: 'en' })
  })
})

describe('fixActiveElement — contenteditable editors (Gmail, WhatsApp Web, Slack)', () => {
  it('inserts through execCommand so the editor keeps undo history', async () => {
    const editor = mount<HTMLDivElement>('<div contenteditable="true">hgsghl</div>')
    selectText(editor)
    const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true)

    await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced', language: 'ar' })
    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'السلام')
  })

  it('falls back to copying when the editor rejects execCommand', async () => {
    const editor = mount<HTMLDivElement>('<div contenteditable="true">hgsghl</div>')
    selectText(editor)
    vi.spyOn(document, 'execCommand').mockReturnValue(false)

    await expect(fixActiveElement()).resolves.toEqual({ status: 'copied', text: 'السلام' })
    expect(clipboard.writeText).toHaveBeenCalledWith('السلام')
  })

  it('reports empty when the caret is in an editor with no mistyped words before it', async () => {
    const editor = mount<HTMLDivElement>('<div contenteditable="true">see you soon</div>')
    window.getSelection()!.collapse(editor.firstChild!, 12)
    await expect(fixActiveElement()).resolves.toEqual({ status: 'empty' })
  })

  it('fixes the mistyped words before the caret in an editor', async () => {
    const editor = mount<HTMLDivElement>('<div contenteditable="true">meeting hgsghl</div>')
    window.getSelection()!.collapse(editor.firstChild!, 14)
    Object.defineProperty(Selection.prototype, 'modify', {
      configurable: true,
      value(this: Selection) {
        this.setBaseAndExtent(this.anchorNode!, this.anchorOffset, this.focusNode!, this.focusOffset - 1)
      },
    })
    const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true)

    await expect(fixActiveElement()).resolves.toEqual({ status: 'replaced', language: 'ar' })
    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'السلام')
    Reflect.deleteProperty(Selection.prototype, 'modify')
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
