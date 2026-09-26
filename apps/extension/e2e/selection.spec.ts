import { expect, test } from './fixtures'

const BUTTON = '#layout-fixer-selection button.trigger'

test.describe('selection button', () => {
  test('is off by default', async ({ openFixture }) => {
    const page = await openFixture('<p id="message">hgsghl ugd;l</p>')
    await page.locator('#message').click({ clickCount: 3 })
    await page.waitForTimeout(500)
    await expect(page.locator(BUTTON)).toHaveCount(0)
  })

  test('can be turned on from the settings page', async ({ context, extensionId, serviceWorker }) => {
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(`chrome-extension://${extensionId}/src/options/index.html#selection`)
    const toggle = page.getByRole('switch', { name: /Show a button when I select text/ })
    await toggle.check()
    await expect(toggle).toBeChecked()
    await expect
      .poll(() => serviceWorker.evaluate(async () => (await chrome.scripting.getRegisteredContentScripts()).length))
      .toBe(1)

    await toggle.uncheck()
    await expect
      .poll(() => serviceWorker.evaluate(async () => (await chrome.scripting.getRegisteredContentScripts()).length))
      .toBe(0)
  })

  test('appears on selected text and fixes it into Arabic', async ({ openFixture, enableSelectionButton, context }) => {
    await enableSelectionButton()
    const page = await openFixture('<p id="message">hgsghl ugd;l</p>')
    await page.locator('#message').click({ clickCount: 3 })

    await page.locator(BUTTON).click()
    const arabic = page.getByRole('button', { name: /العربية/ })
    await expect(arabic).toContainText('السلام عليكم')
    await arabic.click()

    await expect(page.locator('#layout-fixer-toast [role="status"]')).toContainText('السلام عليكم')
    await expect(page.locator(BUTTON)).toHaveCount(0)
    expect(await context.pages()[0].evaluate(() => navigator.clipboard.readText())).toBe('السلام عليكم')
  })

  test('offers English for text typed on the Arabic layout', async ({ openFixture, enableSelectionButton }) => {
    await enableSelectionButton()
    const page = await openFixture('<p id="message">اثممخ صخقمي</p>')
    await page.locator('#message').click({ clickCount: 3 })

    await page.locator(BUTTON).click()
    await expect(page.locator('#layout-fixer-selection button.item')).toHaveCount(1)
    await expect(page.getByRole('button', { name: /English/ })).toContainText('hello world')
  })

  test('replaces text in an input and supports undo', async ({ openFixture, enableSelectionButton }) => {
    await enableSelectionButton()
    const page = await openFixture('<input id="field" value="hgsghl ugd;l">')
    const field = page.locator('#field')
    await field.click({ clickCount: 3 })

    await page.locator(BUTTON).click()
    await page.getByRole('button', { name: /العربية/ }).click()
    await expect(field).toHaveValue('السلام عليكم')
    await expect(field).toBeFocused()

    await page.keyboard.press('ControlOrMeta+Z')
    await expect(field).toHaveValue('hgsghl ugd;l')
  })

  test('works in tabs that were already open when it was turned on', async ({ openFixture, enableSelectionButton }) => {
    const page = await openFixture('<p id="message">hgsghl</p>')
    await enableSelectionButton()

    await page.locator('#message').click({ clickCount: 3 })
    await expect(page.locator(BUTTON)).toBeVisible()
  })

  test('hides on Escape and when clicking elsewhere', async ({ openFixture, enableSelectionButton }) => {
    await enableSelectionButton()
    const page = await openFixture('<p id="message">hgsghl</p><p id="other">elsewhere</p>')
    await page.locator('#message').click({ clickCount: 3 })
    await expect(page.locator(BUTTON)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator(BUTTON)).toHaveCount(0)

    await page.locator('#message').click({ clickCount: 3 })
    await expect(page.locator(BUTTON)).toBeVisible()
    await page.mouse.click(5, 300)
    await expect(page.locator(BUTTON)).toHaveCount(0)
  })

  test('Tab moves to the next page field, never onto the button', async ({ openFixture, enableSelectionButton }) => {
    await enableSelectionButton()
    const page = await openFixture('<input id="first" value="hgsghl"><input id="second" value="">')
    await page.locator('#first').click({ clickCount: 3 })
    await expect(page.locator(BUTTON)).toBeVisible()

    await page.keyboard.press('Tab')
    await expect(page.locator('#second')).toBeFocused()
  })

  test('never appears in password fields', async ({ openFixture, enableSelectionButton }) => {
    await enableSelectionButton()
    const page = await openFixture('<input id="secret" type="password" value="hgsghl">')
    await page.locator('#secret').click({ clickCount: 3 })
    await page.waitForTimeout(500)
    await expect(page.locator(BUTTON)).toHaveCount(0)
  })
})
