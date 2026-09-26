import { devices, expect, test } from '@playwright/test'

test('fixes typed text with the Fix button', async ({ page }) => {
  await page.goto('/')
  const input = page.getByTestId('demo-input')
  await input.fill('hgsghl ugd;l')
  await page.getByRole('button', { name: 'Fix' }).click()
  await expect(input).toHaveValue('السلام عليكم')
})

test('fixes typed text with Alt+Shift+F', async ({ page }) => {
  await page.goto('/ar/')
  const input = page.getByTestId('demo-input')
  await input.fill('اثممخ')
  await input.press('Alt+Shift+KeyF')
  await expect(input).toHaveValue('hello')
})

test('leaves an empty box alone', async ({ page }) => {
  await page.goto('/')
  const input = page.getByTestId('demo-input')
  await input.fill('   ')
  await page.getByRole('button', { name: 'Fix' }).click()
  await expect(input).toHaveValue('   ')
})

test('shows before and after without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('demo-before')).toBeVisible()
  await expect(page.getByTestId('demo-before')).toHaveText('hgsghl ugd;l')
  await expect(page.getByTestId('demo-showcase')).toHaveText('السلام عليكم')
  await context.close()
})

test('shows before and after, without animating, for reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/')
  await page.waitForTimeout(3000)
  await expect(page.getByTestId('demo-before')).toBeVisible()
  await expect(page.getByTestId('demo-before')).toHaveText('hgsghl ugd;l')
  await expect(page.getByTestId('demo-showcase')).toHaveText('السلام عليكم')
  await context.close()
})

test('animates through the samples', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('demo-showcase')).toHaveText('hello world', { timeout: 10_000 })
})

test('keeps the shortcut keys left-to-right on the Arabic page', async ({ page }) => {
  await page.goto('/ar/')
  await expect(page.getByTestId('demo-keys')).toHaveAttribute('dir', 'ltr')
})

test('keeps the try-it box disabled until the demo can respond', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('demo-input')).toBeDisabled()
  await context.close()
})

test('uses the macOS Arabic layout and ⌥⇧F on a Mac', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'platform', { get: () => 'MacIntel' })
    Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined })
  })
  await page.goto('/')
  await expect(page.getByTestId('demo-keys')).toHaveText('⌥⇧F')
  const input = page.getByTestId('demo-input')
  await input.fill('hgp,hv')
  await input.press('Alt+Shift+KeyF')
  await expect(input).toHaveValue('الح،اد')
})

test('lays out the empty try-it box in the page direction', async ({ page }) => {
  await page.goto('/ar/')
  const input = page.getByTestId('demo-input')
  await expect(input).toBeEnabled()
  expect(await input.evaluate((element) => getComputedStyle(element).direction)).toBe('rtl')
})

test('the showcase animation can be paused and resumed', async ({ page }) => {
  await page.goto('/')
  const showcase = page.getByTestId('demo-showcase')
  await page.getByRole('button', { name: 'Pause animation' }).click()
  const frozen = await showcase.textContent()
  await page.waitForTimeout(3000)
  await expect(showcase).toHaveText(frozen ?? '')
  await page.getByRole('button', { name: 'Play animation' }).click()
  await expect(showcase).not.toHaveText(frozen ?? '', { timeout: 6000 })
})

test('hides the try-it box without JavaScript, since it cannot work', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('demo-input')).toBeHidden()
  await context.close()
})

test('hides the keyboard shortcut hint on touch screens', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['Pixel 7'] })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('demo-input')).toBeVisible()
  await expect(page.getByTestId('demo-hint')).toHaveCount(1)
  await expect(page.getByTestId('demo-hint')).toBeHidden()
  await context.close()
})
