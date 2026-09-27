export const en = {
  brand: 'Layout Fixer',
  skipLink: 'Skip to content',
  meta: {
    title: 'Layout Fixer — fix Arabic ⇄ English keyboard layout mistakes',
    description:
      'Typed with the wrong keyboard layout? Select the text and press ⌥⇧F / Alt+Shift+F to fix Arabic ⇄ English instantly.',
  },
  nav: {
    addToChrome: 'Add to Chrome',
    switchLanguage: 'عربي',
  },
  hero: {
    title: 'Typed in the wrong layout?',
    titleAccent: 'Fix it in one keystroke.',
    subtitle:
      'Layout Fixer turns text typed with the wrong keyboard layout back into what you meant — Arabic ⇄ English, right in your browser.',
    cta: 'Add to Chrome — it’s free',
    comingSoon: 'Edge and Firefox coming soon',
  },
  demo: {
    label: 'Try it yourself',
    placeholder: 'Try: hgsghl ugd;l',
    fix: 'Fix',
    before: 'Typed',
    after: 'Fixed',
    orPress: 'or press',
    pause: 'Pause animation',
    play: 'Play animation',
  },
  video: {
    title: 'See it in 40 seconds',
    label:
      'Layout Fixer promo video: text typed on the wrong keyboard layout is selected, Alt+Shift+F is pressed, and it becomes the intended Arabic.',
  },
  how: {
    title: 'How it works',
    steps: [
      {
        title: 'Select the text',
        body: 'Or just click in the field — with nothing selected, the whole field is fixed.',
      },
      { title: 'Press the shortcut', body: 'Or right-click and choose Fix keyboard layout.' },
      { title: 'Done', body: 'The text is replaced in place. Changed your mind? Undo with Ctrl+Z / ⌘Z.' },
    ],
  },
  features: {
    title: 'Everything you need, nothing you don’t',
    items: [
      {
        title: 'Works both ways',
        body: 'Arabic typed on the English layout, and English typed on the Arabic layout — detected automatically.',
      },
      { title: 'Works where you type', body: 'Gmail, WhatsApp Web, Slack, search boxes and most websites.' },
      {
        title: 'Your keyboard, your way',
        body: 'The PC Arabic layout and the macOS “Arabic” layout — chosen automatically.',
      },
      { title: 'Paste and fix', body: 'A box in the toolbar popup fixes anything you paste into it.' },
      {
        title: 'Read-only text too',
        body: 'Can’t edit it, like a message you received? The fixed text is copied and shown to you.',
      },
      { title: 'Your language, your look', body: 'Interface in English and Arabic, light and dark mode.' },
    ],
  },
  privacy: {
    title: 'Private by design',
    body: 'Everything happens on your device. No data collection, no tracking, no network requests.',
    link: 'Read the privacy policy',
  },
  desktop: {
    eyebrow: 'New',
    title: 'Layout Fixer for desktop',
    body: 'Fix text in every app, not just the browser — Word, Slack, WhatsApp, Notes, Terminal. Select it and press ⌥⇧F on a Mac or Alt+Shift+F on Windows and Linux. Afterwards it switches your keyboard to the right language, so you can keep typing.',
    mac: 'Download for macOS',
    windows: 'Download for Windows',
    linux: 'Download for Linux',
    linuxDeb: '.deb package',
    note: 'Free and open source · macOS 12+, Windows 10 and 11, Linux (X11, or Wayland on GNOME and KDE Plasma) · Updates itself',
    allReleases: 'All downloads',
    firstLaunchTitle: 'Opening it for the first time',
    firstLaunchMac:
      'macOS: open the app. When macOS says it can’t verify it, go to System Settings → Privacy & Security and click Open Anyway. Then allow Layout Fixer under Accessibility so it can press ⌘C and ⌘V for you.',
    firstLaunchWindows: 'Windows: if SmartScreen says “Windows protected your PC”, click More info → Run anyway.',
    firstLaunchLinux:
      'Linux: make the AppImage executable and open it, or install the .deb. On GNOME, install the GNOME extension from the app’s Settings once.',
  },
  faq: {
    title: 'Questions',
    items: [
      {
        question: 'Does it read what I type?',
        answer:
          'No. It only runs when you press the shortcut or choose the command, and only on the text you picked. Nothing leaves your device.',
      },
      {
        question: 'Which keyboards are supported?',
        answer:
          'Arabic and English (US). It supports the PC Arabic layout used on Windows, Linux and ChromeOS, and the macOS “Arabic” layout.',
      },
      { question: 'Is it free?', answer: 'Yes. It’s free and open source under the MIT license.' },
      {
        question: 'Why does my computer ask before opening the desktop app?',
        answer:
          'The app isn’t signed with a paid Apple or Microsoft certificate yet, so macOS and Windows ask you to confirm the first launch once. The source code is public on GitHub, and every update is verified with the project’s own signing key.',
      },
    ],
  },
  support: {
    title: 'Help Layout Fixer grow',
    subtitle: 'It’s free and open source. Here’s how you can help.',
    rate: { title: 'Rate it on the Chrome Web Store', detail: 'Reviews help people find it' },
    star: { title: 'Star it on GitHub' },
    bug: { title: 'Report a bug' },
    language: { title: 'Request a language', detail: 'Persian, Urdu, Hebrew, Russian…' },
    contribute: { title: 'Contribute code', detail: 'Read the contributing guide' },
    share: 'Share with a friend',
    shareButton: 'Share',
    shareText: 'Typed in the wrong keyboard layout? Layout Fixer fixes it in one keystroke.',
    copied: 'Link copied',
    newTab: 'opens in a new tab',
    donateTitle: 'Support development',
    donateBody: 'A small donation keeps new languages and the desktop app coming.',
    donateButton: 'Donate with PayPal',
  },
  footer: {
    privacy: 'Privacy',
    github: 'GitHub',
    license: 'MIT License',
    donate: 'Donate',
    madeWith: 'Made with',
    love: 'love',
    by: 'by',
    author: 'Ahmed Saber',
  },
  notFound: {
    title: 'Page not found',
    body: 'This page doesn’t exist.',
    home: 'Go to the home page',
  },
}

export type Dictionary = typeof en
