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
  shortcutSection: 'Shortcut',
  shortcutLabel: 'Fix the selected text',
  shortcutHint: 'Select text in any app and press the shortcut. You can also use Fix Selection in the menu bar.',
  shortcutTaken: 'Another app already uses this shortcut. Use Fix Selection in the menu bar for now.',
  accessSection: 'Permission',
  accessLabel: 'Accessibility',
  accessAllowed: 'Allowed',
  accessButton: 'Allow…',
  accessHint:
    'Layout Fixer presses ⌘C and ⌘V for you, which macOS only allows after you turn it on in System Settings → Privacy & Security → Accessibility.',
  accessAllowedHint: 'Layout Fixer can copy and paste the text you select.',
  privacyTitle: 'Privacy',
  privacyBody:
    'Layout Fixer reads text only when you press the shortcut, converts it on this device, and never stores or sends it.',
  loadError: 'Couldn’t load your settings. Showing the defaults.',
})
