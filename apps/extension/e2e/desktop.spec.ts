import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test as base, expect } from './fixtures'

const HOST = 'io.github.bugsbountyhunter.layoutfixer'

/**
 * A stand-in for Layout Fixer for desktop: answers like the real host and logs each request.
 * Chromium reads host manifests from the profile's NativeMessagingHosts folder on every call.
 */
const FAKE_HOST = `
const fs = require('node:fs')
let input = Buffer.alloc(0)
process.stdin.on('data', (chunk) => {
  input = Buffer.concat([input, chunk])
  if (input.length < 4) return
  const length = input.readUInt32LE(0)
  if (input.length < 4 + length) return
  const request = JSON.parse(input.subarray(4, 4 + length).toString())
  fs.appendFileSync(process.env.LOG ?? process.argv[2], JSON.stringify(request) + '\\n')
  const body = Buffer.from(JSON.stringify({ ok: true, version: '9.9.9', result: 'switched' }))
  const header = Buffer.alloc(4)
  header.writeUInt32LE(body.length)
  process.stdout.write(Buffer.concat([header, body]), () => process.exit(0))
})
`

const test = base.extend<{ hostLog: string }>({
  hostLog: async ({ userDataDir, extensionId }, use) => {
    const dir = join(userDataDir, 'NativeMessagingHosts')
    mkdirSync(dir, { recursive: true })
    const log = join(dir, 'requests.log')
    const script = join(dir, 'fake-host.cjs')
    const launcher = join(dir, 'fake-host.sh')
    writeFileSync(script, FAKE_HOST)
    writeFileSync(launcher, `#!/bin/sh\nexec "${process.execPath}" "${script}" "${log}"\n`)
    chmodSync(launcher, 0o755)
    writeFileSync(
      join(dir, `${HOST}.json`),
      JSON.stringify({
        name: HOST,
        description: 'Fake Layout Fixer for desktop',
        path: launcher,
        type: 'stdio',
        allowed_origins: [`chrome-extension://${extensionId}/`],
      }),
    )
    await use(log)
  },
})

const requests = (log: string) =>
  existsSync(log)
    ? readFileSync(log, 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
    : []

// Windows looks hosts up in the registry, not the profile folder.
test.skip(process.platform === 'win32', 'native messaging hosts are registered in the Windows registry')

test.describe('switching the keyboard layout through the desktop app', () => {
  test('the settings page turns it on and shows the connected app', async ({ context, extensionId, hostLog }) => {
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(`chrome-extension://${extensionId}/src/options/index.html`)
    const toggle = page.getByRole('switch', { name: 'Switch keyboard layout after fixing' })
    await expect(toggle).not.toBeChecked()

    await toggle.check()
    await expect(page.getByTestId('desktop-status')).toHaveText('Connected to Layout Fixer for desktop 9.9.9.')
    expect(requests(hostLog)).toContainEqual({ type: 'ping' })
  })

  test('a fix in a text field asks the desktop app to switch to the fixed language', async ({
    openFixture,
    fixLayout,
    setSettings,
    hostLog,
  }) => {
    await setSettings({ arabicLayout: 'ar-pc', showToasts: true, switchKeyboardLayout: true })
    const page = await openFixture('<input id="field" value="hgsghl">')
    await page.locator('#field').focus()
    await fixLayout()

    await expect(page.locator('#field')).toHaveValue('السلام')
    await expect
      .poll(() => requests(hostLog))
      .toContainEqual({ type: 'switch-layout', language: 'ar', layout: 'ar-pc' })
  })

  test('nothing is sent while the setting is off', async ({ openFixture, fixLayout, setSettings, hostLog }) => {
    await setSettings({ arabicLayout: 'ar-pc', showToasts: true, switchKeyboardLayout: false })
    const page = await openFixture('<input id="field" value="hgsghl">')
    await page.locator('#field').focus()
    await fixLayout()

    await expect(page.locator('#field')).toHaveValue('السلام')
    await page.waitForTimeout(500)
    expect(requests(hostLog)).toEqual([])
  })
})
