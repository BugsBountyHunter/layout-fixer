// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { selectMistypedBeforeCaret, textBeforeCaret } from './caret'

const OPTIONS = { layout: 'ar-pc' } as const

function mount(html: string): HTMLElement {
  document.body.innerHTML = html
  const host = document.body.firstElementChild as HTMLElement
  host.focus()
  return host
}

function placeCaret(node: Node, offset: number): Selection {
  const selection = window.getSelection()!
  selection.collapse(node, offset)
  return selection
}

/** happy-dom has no Selection.modify; this covers backward character extension within one text node. */
function stubModify(): void {
  Object.defineProperty(Selection.prototype, 'modify', {
    configurable: true,
    value(this: Selection, alter: string, direction: string, granularity: string) {
      const node = this.focusNode
      if (alter !== 'extend' || granularity !== 'character' || !node) return
      const anchor = [this.anchorNode!, this.anchorOffset] as const
      const offset = Math.max(0, this.focusOffset + (direction === 'backward' ? -1 : 1))
      this.setBaseAndExtent(anchor[0], anchor[1], node, offset)
    },
  })
}

beforeEach(stubModify)
afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
  Reflect.deleteProperty(Selection.prototype, 'modify')
})

describe('textBeforeCaret', () => {
  it('reads the text of the caret’s block up to the caret', () => {
    const host = mount('<div contenteditable="true"><div>Hi team</div><div>ok <b>hgsghl</b> ugd;l</div></div>')
    const last = host.lastElementChild!.lastChild!
    expect(textBeforeCaret(host, placeCaret(last, 6).getRangeAt(0))).toBe('ok hgsghl ugd;l')
  })

  it('turns line breaks into newlines', () => {
    const host = mount('<div contenteditable="true">Hi team<br>hgsghl</div>')
    expect(textBeforeCaret(host, placeCaret(host.lastChild!, 6).getRangeAt(0))).toBe('Hi team\nhgsghl')
  })

  it('stops at the caret inside a text node', () => {
    const host = mount('<div contenteditable="true">hgsghl ugd;l</div>')
    expect(textBeforeCaret(host, placeCaret(host.firstChild!, 6).getRangeAt(0))).toBe('hgsghl')
  })
})

describe('selectMistypedBeforeCaret', () => {
  it('selects the mistyped words before the caret', () => {
    const host = mount('<div contenteditable="true">meeting at 5 hgsghl ugd;l</div>')
    const selection = placeCaret(host.firstChild!, 25)

    expect(selectMistypedBeforeCaret(host, selection, OPTIONS)).toBe(true)
    expect(selection.toString()).toBe('hgsghl ugd;l')
  })

  it('extends to the end of the word the caret is in', () => {
    const host = mount('<div contenteditable="true">ok hgsghl ugd;l</div>')
    const selection = placeCaret(host.firstChild!, 5)

    expect(selectMistypedBeforeCaret(host, selection, OPTIONS)).toBe(true)
    expect(selection.toString()).toBe('hgsghl')
  })

  it('does not take the next word when the caret is at its start', () => {
    const host = mount('<div contenteditable="true">hgsghl ugd;l</div>')
    const selection = placeCaret(host.firstChild!, 7)

    expect(selectMistypedBeforeCaret(host, selection, OPTIONS)).toBe(true)
    expect(selection.toString()).toBe('hgsghl ')
  })

  it('leaves the caret alone when no mistyped words end before it', () => {
    const host = mount('<div contenteditable="true">see you soon</div>')
    const selection = placeCaret(host.firstChild!, 12)

    expect(selectMistypedBeforeCaret(host, selection, OPTIONS)).toBe(false)
    expect(selection.isCollapsed).toBe(true)
    expect(selection.focusOffset).toBe(12)
  })

  it('gives up and restores the caret when the editor selects something else', () => {
    const host = mount('<div contenteditable="true">ok hgsghl</div>')
    const selection = placeCaret(host.firstChild!, 9)
    Object.defineProperty(Selection.prototype, 'modify', { configurable: true, value() {} })

    expect(selectMistypedBeforeCaret(host, selection, OPTIONS)).toBe(false)
    expect(selection.isCollapsed).toBe(true)
    expect(selection.focusOffset).toBe(9)
  })

  it('gives up when the browser cannot move the selection', () => {
    const host = mount('<div contenteditable="true">ok hgsghl</div>')
    const selection = placeCaret(host.firstChild!, 9)
    Reflect.deleteProperty(Selection.prototype, 'modify')

    expect(selectMistypedBeforeCaret(host, selection, OPTIONS)).toBe(false)
  })
})
