// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type AboutLink, AboutSection, type AboutStrings } from './AboutSection'
import { BugIcon, HeartIcon } from './icons'

const strings: AboutStrings = {
  title: 'About',
  share: 'Share with a friend',
  copyLink: 'Copy link',
  copied: 'Copied',
  copyFailed: 'Copy this address:',
  madeWith: 'Made with',
  love: 'love',
  by: 'by',
  author: 'Ahmed Saber',
  newTab: 'opens in a new tab',
}
const links: AboutLink[] = [{ id: 'bug', label: 'Report a bug', href: 'https://example.com/bug', icon: <BugIcon /> }]
const donate: AboutLink = { id: 'donate', label: 'Donate', href: 'https://paypal.me/x', icon: <HeartIcon /> }

function setup(props: Partial<Parameters<typeof AboutSection>[0]> = {}) {
  return render(
    <AboutSection
      strings={strings}
      links={links}
      donate={donate}
      shareUrl="https://layoutfixer.dev"
      authorUrl="https://github.com/author"
      {...props}
    />,
  )
}

afterEach(cleanup)

describe('AboutSection', () => {
  it('renders the links as new-tab links, donate last', () => {
    setup()
    const bug = screen.getByRole('link', { name: /Report a bug/ })
    expect(bug.getAttribute('href')).toBe('https://example.com/bug')
    expect(bug.getAttribute('target')).toBe('_blank')
    expect(bug.getAttribute('rel')).toBe('noopener noreferrer')
    const all = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(all).toEqual(['https://example.com/bug', 'https://paypal.me/x', 'https://github.com/author'])
  })

  it('credits the author with the version', () => {
    setup({ version: 'Version 1.2.0' })
    expect(screen.getByRole('img', { name: 'love' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Ahmed Saber/ }).getAttribute('href')).toBe('https://github.com/author')
    expect(screen.getByText(/Version 1\.2\.0/)).toBeTruthy()
  })

  it('lets the browser open links when there is no onOpen', () => {
    setup()
    expect(fireEvent.click(screen.getByRole('link', { name: /Donate/ }))).toBe(true)
  })

  it('hands links to onOpen instead of navigating when given', async () => {
    const onOpen = vi.fn()
    setup({ onOpen })
    await userEvent.click(screen.getByRole('link', { name: /Donate/ }))
    expect(onOpen).toHaveBeenCalledWith('https://paypal.me/x')
  })

  it('copies the website address and confirms', async () => {
    const copy = vi.fn().mockResolvedValue(undefined)
    setup({ copy })
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(copy).toHaveBeenCalledWith('https://layoutfixer.dev')
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy()
  })

  it('shows the address when copying fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    setup({ copy: vi.fn().mockRejectedValue(new Error('denied')) })
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }))
    expect((await screen.findByRole('status')).textContent).toContain('https://layoutfixer.dev')
  })

  it('uses the Clipboard API by default and reports when it is missing', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(await screen.findByRole('status')).toBeTruthy()
  })
})
