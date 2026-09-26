// English only until phase 5 moves the desktop app onto the extension's en/ar message files.
export const STRINGS = Object.freeze({
  title: 'Layout Fixer',
  subtitle: 'Fix text typed with the wrong keyboard layout, in any app.',
  layoutSection: 'Arabic keyboard layout',
  layoutAuto: 'Automatic',
  layoutAutoHint: (current: string) =>
    `Uses the Mac layout on macOS and the PC layout everywhere else. Now using: ${current}.`,
  layoutPc: 'PC',
  layoutPcHint: 'Windows “Arabic (101)”, macOS “Arabic – PC”, Linux.',
  layoutMac: 'Mac',
  layoutMacHint: 'The default “Arabic” layout on macOS.',
  layoutExample: (keys: string, word: string) => `Typing ${keys} gives ${word}`,
  privacyTitle: 'Privacy',
  privacyBody:
    'Layout Fixer reads text only when you press the shortcut, converts it on this device, and never stores or sends it.',
  loadError: 'Couldn’t load your settings. Showing the defaults.',
})
