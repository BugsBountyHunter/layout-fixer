// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { readSelection } from './read-selection'

function mount<T extends HTMLElement>(html: string): T {
  document.body.innerHTML = html
  const el = document.body.firstElementChild as T
  el.focus()
  return el
}

function selectText(node: Node): void {
  const range = document.createRange()
  range.selectNodeContents(node)
  window.getSelection()!.removeAllRanges()
  window.getSelection()!.addRange(range)
}

afterEach(() => {
  document.body.innerHTML = ''
  window.getSelection()?.removeAllRanges()
})

describe('readSelection', () => {
  it('reads the selected part of an input', () => {
    const input = mount<HTMLInputElement>('<input value="ok hgsghl">')
    input.setSelectionRange(3, 9)
    expect(readSelection()).toMatchObject({ text: 'hgsghl', editable: true, anchor: input })
  })

  it('reads a textarea selection', () => {
    const textarea = mount<HTMLTextAreaElement>('<textarea>hgsghl ugd;l</textarea>')
    textarea.setSelectionRange(0, 6)
    expect(readSelection()).toMatchObject({ text: 'hgsghl', editable: true })
  })

  it('marks read-only fields as not editable', () => {
    const input = mount<HTMLInputElement>('<input readonly value="hgsghl">')
    input.setSelectionRange(0, 6)
    expect(readSelection()).toMatchObject({ editable: false })
  })

  it('ignores a caret without a selection', () => {
    const input = mount<HTMLInputElement>('<input value="hgsghl">')
    input.setSelectionRange(2, 2)
    expect(readSelection()).toBeNull()
  })

  it('never reads password fields', () => {
    mount<HTMLInputElement>('<input type="password" value="hgsghl">')
    selectText(document.body)
    expect(readSelection()).toBeNull()
  })

  it('reads selected page text as not editable, anchored to the element holding it', () => {
    const paragraph = mount('<p>hgsghl ugd;l</p>')
    selectText(paragraph)
    expect(readSelection()).toMatchObject({ text: 'hgsghl ugd;l', editable: false, anchor: paragraph })
  })

  it('reads selections inside rich editors as editable', () => {
    const editor = mount('<div contenteditable="true">hgsghl</div>')
    selectText(editor)
    expect(readSelection()).toMatchObject({ text: 'hgsghl', editable: true })
  })

  it('ignores whitespace-only selections', () => {
    selectText(mount('<p>   </p>'))
    expect(readSelection()).toBeNull()
  })

  it('ignores very long selections', () => {
    selectText(mount(`<p>${'a'.repeat(6000)}</p>`))
    expect(readSelection()).toBeNull()
  })
})
