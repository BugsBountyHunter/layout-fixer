import { expect, test } from './fixtures'

test.describe('settings page', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(`chrome-extension://${extensionId}/src/options/index.html`)
  })

  test('starts in automatic mode and explains each layout with an example', async ({ context }) => {
    const page = context.pages()[0]
    await expect(page.getByRole('radio', { name: /Automatic/ })).toBeChecked()
    await expect(page.locator('.choice', { has: page.getByRole('radio', { name: /^PC/ }) })).toContainText(
      'Typing lvpfh gives مرحبا',
    )
    await expect(page.locator('.choice', { has: page.getByRole('radio', { name: /^Mac/ }) })).toContainText(
      'Typing lnpfh gives مرحبا',
    )
  })

  test('saves the layout choice and keeps it after reload', async ({ context }) => {
    const page = context.pages()[0]
    await page.getByRole('radio', { name: /^Mac/ }).check()
    await expect(page.getByRole('status')).toHaveText('Saved')

    await page.reload()
    await expect(page.getByRole('radio', { name: /^Mac/ })).toBeChecked()
  })

  test('saves the on-page messages switch', async ({ context }) => {
    const page = context.pages()[0]
    const toggle = page.getByRole('switch', { name: /Show a message after copying/ })
    await expect(toggle).toBeChecked()
    await toggle.uncheck()

    await page.reload()
    await expect(page.getByRole('switch', { name: /Show a message after copying/ })).not.toBeChecked()
  })

  test('shows the version and the privacy promise', async ({ context }) => {
    const page = context.pages()[0]
    await expect(page.getByText(/^Version \d+\.\d+\.\d+$/)).toBeVisible()
    await expect(page.getByText(/never collects, stores or sends/)).toBeVisible()
  })
})

test.describe('settings take effect everywhere', () => {
  test('the popup converts with the chosen layout and says which one', async ({
    context,
    extensionId,
    setSettings,
  }) => {
    await setSettings({ arabicLayout: 'ar-mac', showToasts: true })
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)

    await expect(page.getByText('Arabic keyboard: Mac')).toBeVisible()
    await page.getByLabel('Text typed with the wrong layout').fill('lnpfh')
    await expect(page.locator('output')).toHaveText('مرحبا')
  })

  test('the popup updates live when settings change in another page', async ({ context, extensionId, setSettings }) => {
    await setSettings({ arabicLayout: 'ar-pc', showToasts: true })
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
    await page.getByLabel('Text typed with the wrong layout').fill('lvpfh')
    await expect(page.locator('output')).toHaveText('مرحبا')

    await setSettings({ arabicLayout: 'ar-mac', showToasts: true })
    await expect(page.locator('output')).toHaveText('مدحبا')
  })

  test('the popup settings button opens the settings page', async ({ context, extensionId }) => {
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`)

    const [settingsPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Settings' }).first().click(),
    ])
    await expect(settingsPage).toHaveURL(/\/src\/options\/index\.html$/)
  })

  test('fixing text on a page uses the chosen layout', async ({ openFixture, fixLayout, setSettings }) => {
    await setSettings({ arabicLayout: 'ar-mac', showToasts: true })
    const page = await openFixture('<input id="field" value="lnpfh">')
    await page.locator('#field').focus()

    await fixLayout()
    await expect(page.locator('#field')).toHaveValue('مرحبا')
  })

  test('turning messages off hides the toast but still copies', async ({
    openFixture,
    fixLayout,
    setSettings,
    context,
  }) => {
    await setSettings({ arabicLayout: 'ar-pc', showToasts: false })
    const page = await openFixture('<p id="message">hgsghl</p>')
    await page.locator('#message').selectText()

    await fixLayout()
    await expect.poll(() => context.pages()[0].evaluate(() => navigator.clipboard.readText())).toBe('السلام')
    await expect(page.locator('#layout-fixer-toast')).toHaveCount(0)
  })
})

test.describe('language pair', () => {
  test('shows Arabic and English and swaps them instead of allowing the same language twice', async ({
    context,
    extensionId,
  }) => {
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(`chrome-extension://${extensionId}/src/options/index.html`)
    const first = page.getByLabel('First language')
    const second = page.getByLabel('Second language')
    await expect(first).toHaveValue('ar')
    await expect(second).toHaveValue('en')

    await first.selectOption('en')
    await expect(first).toHaveValue('en')
    await expect(second).toHaveValue('ar')

    await page.reload()
    await expect(page.getByLabel('First language')).toHaveValue('en')
    await expect(page.getByLabel('Second language')).toHaveValue('ar')
  })
})
