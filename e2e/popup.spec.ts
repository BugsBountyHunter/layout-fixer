import { CAN_SET_UI_LANGUAGE, expect, test } from './fixtures'

test.describe('popup', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
  })

  test('fixes Arabic typed on the English layout as you type', async ({ context }) => {
    const page = context.pages()[0]
    await page.getByLabel('Text typed with the wrong layout').fill('hgsghl ugd;l')
    await expect(page.locator('output')).toHaveText('السلام عليكم')
  })

  test('fixes English typed on the Arabic layout', async ({ context }) => {
    const page = context.pages()[0]
    await page.getByLabel('Text typed with the wrong layout').fill('اثممخ صخقمي')
    await expect(page.locator('output')).toHaveText('hello world')
  })

  test('forces a direction with the segmented control', async ({ context }) => {
    const page = context.pages()[0]
    await page.getByLabel('Text typed with the wrong layout').fill('hello')
    await page.getByRole('radio', { name: 'AR → EN' }).check()
    await expect(page.getByRole('radio', { name: 'AR → EN' })).toBeChecked()
    await expect(page.getByRole('radio', { name: 'Auto' })).not.toBeChecked()
    await expect(page.locator('output')).toHaveText('hello')
    await page.getByRole('radio', { name: 'EN → AR' }).check()
    await expect(page.locator('output')).toHaveText('اثممخ')
  })

  test('copies the result with the button and with Cmd/Ctrl+Enter', async ({ context }) => {
    const page = context.pages()[0]
    const input = page.getByLabel('Text typed with the wrong layout')
    await input.fill('hgsghl')

    await page.getByRole('button', { name: 'Copy' }).click()
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('السلام')

    await input.fill('ugd;l')
    await input.press('ControlOrMeta+Enter')
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('عليكم')
  })

  test('clears the input and keeps focus in it', async ({ context }) => {
    const page = context.pages()[0]
    const input = page.getByLabel('Text typed with the wrong layout')
    await input.fill('hgsghl')
    await page.getByRole('button', { name: 'Clear' }).click()

    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
    await expect(page.getByRole('button', { name: 'Copy' })).toBeDisabled()
  })

  test('shows the live keyboard shortcut for this platform', async ({ context }) => {
    const page = context.pages()[0]
    await expect(page.locator('.hint kbd')).toHaveCount(3)
  })
})

test.describe('popup in Arabic', () => {
  test.use({ uiLanguage: 'ar' })
  test.skip(!CAN_SET_UI_LANGUAGE, 'Chromium on macOS ignores --lang; runs on Linux/Windows CI')

  test('renders right-to-left with Arabic labels', async ({ context, extensionId }) => {
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByRole('heading')).toHaveText('مصحح لغة الكيبورد')
    await page.getByLabel('النص المكتوب بلغة خطأ').fill('hgsghl')
    await expect(page.locator('output')).toHaveText('السلام')
  })
})
