import { expect, test } from './fixtures'

test.describe('privacy', () => {
  test('websites cannot detect the extension by loading its files', async ({
    openFixture,
    serviceWorker,
    extensionId,
  }) => {
    const { exposed, script } = await serviceWorker.evaluate(async () => ({
      exposed: chrome.runtime.getManifest().web_accessible_resources ?? [],
      script: (await chrome.scripting.getRegisteredContentScripts())[0]?.js?.[0] ?? 'assets/content-script.js',
    }))
    expect(exposed).toEqual([])

    const page = await openFixture('<p>probe</p>')
    const reachable = await page.evaluate(
      (url) =>
        fetch(url).then(
          () => true,
          () => false,
        ),
      `chrome-extension://${extensionId}/${script}`,
    )
    expect(reachable).toBe(false)
  })
})

test.describe('fixing text on a web page', () => {
  test('replaces the selected text in an input', async ({ openFixture, fixLayout }) => {
    const page = await openFixture('<input id="field" value="ok hgsghl">')
    await page.locator('#field').evaluate((el: HTMLInputElement) => {
      el.focus()
      el.setSelectionRange(3, 9)
    })

    await fixLayout()
    await expect(page.locator('#field')).toHaveValue('ok السلام')
  })

  test('supports undo in inputs', async ({ openFixture, fixLayout }) => {
    const page = await openFixture('<input id="field" value="hgsghl">')
    const field = page.locator('#field')
    await field.focus()

    await fixLayout()
    await expect(field).toHaveValue('السلام')

    await page.keyboard.press('ControlOrMeta+Z')
    await expect(field).toHaveValue('hgsghl')
  })

  test('supports undo in textareas', async ({ openFixture, fixLayout }) => {
    const page = await openFixture('<textarea id="field">ok hgsghl</textarea>')
    const field = page.locator('#field')
    await field.evaluate((el: HTMLTextAreaElement) => {
      el.focus()
      el.setSelectionRange(3, 9)
    })

    await fixLayout()
    await expect(field).toHaveValue('ok السلام')

    await page.keyboard.press('ControlOrMeta+Z')
    await expect(field).toHaveValue('ok hgsghl')
  })

  test('converts the whole textarea when nothing is selected', async ({ openFixture, fixLayout }) => {
    const page = await openFixture('<textarea id="field">اثممخ\nصخقمي</textarea>')
    await page.locator('#field').focus()

    await fixLayout()
    await expect(page.locator('#field')).toHaveValue('hello\nworld')
  })

  test('notifies framework-controlled inputs through an input event', async ({ openFixture, fixLayout }) => {
    const page = await openFixture(`
      <input id="field" value="hgsghl"><span id="state"></span>
      <script>field.addEventListener('input', () => { state.textContent = field.value })</script>`)
    await page.locator('#field').focus()

    await fixLayout()
    await expect(page.locator('#state')).toHaveText('السلام')
  })

  test('edits contenteditable editors and supports undo', async ({ openFixture, fixLayout }) => {
    const page = await openFixture('<div id="editor" contenteditable="true">hgsghl ugd;l</div>')
    const editor = page.locator('#editor')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')

    await fixLayout()
    await expect(editor).toHaveText('السلام عليكم')

    await page.keyboard.press('ControlOrMeta+Z')
    await expect(editor).toHaveText('hgsghl ugd;l')
  })

  test('copies and shows fixed text for read-only page content', async ({ openFixture, fixLayout, context }) => {
    const page = await openFixture('<p id="message">hgsghl ugd;l</p>')
    await page.locator('#message').selectText()

    await fixLayout()
    await expect(page.locator('#layout-fixer-toast [role="status"]')).toContainText('السلام عليكم')
    await expect(page.locator('#message')).toHaveText('hgsghl ugd;l')
    expect(await context.pages()[0].evaluate(() => navigator.clipboard.readText())).toBe('السلام عليكم')
  })

  test('asks the user to select text when there is nothing to fix', async ({ openFixture, fixLayout }) => {
    const page = await openFixture('<p>nothing selected</p>')

    await fixLayout()
    await expect(page.locator('#layout-fixer-toast')).toContainText('Select the text you want to fix first')
  })

  test('acts only in the focused iframe', async ({ openFixture, fixLayout }) => {
    const page = await openFixture(`<iframe id="frame" srcdoc='<input id="inner" value="hgsghl">'></iframe>`)
    const frame = page.frameLocator('#frame')
    await frame.locator('#inner').focus()

    await fixLayout()
    await expect(frame.locator('#inner')).toHaveValue('السلام')
    await expect(page.locator('#layout-fixer-toast')).toHaveCount(0)
  })
})
