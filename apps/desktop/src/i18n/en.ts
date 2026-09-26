export const EN = {
  appName: 'Layout Fixer',
  subtitle: 'Fix text typed with the wrong keyboard layout, in any app.',
  loadError: 'Couldn’t load your settings. Showing the defaults.',

  // Tray menu (sent to the native side)
  trayFix: 'Fix Selection',
  trayPause: 'Pause',
  trayResume: 'Resume',
  traySettings: 'Settings…',
  trayQuit: 'Quit Layout Fixer',

  // Messages on screen after a fix attempt
  hudNothingSelected: 'Select the text first',
  hudNothingToFix: 'Nothing to fix',
  hudAccessibility: 'Allow Layout Fixer in Accessibility settings',
  hudSecureInput: 'Can’t fix text in password fields',
  hudElevated: 'Can’t fix text in apps running as administrator',
  hudWayland: 'Fixing text needs an X11 session on Linux for now',
  hudUnsupported: 'Fixing text isn’t available on this system yet',
  hudFailed: 'Couldn’t fix the text',

  // Permission (macOS)
  accessSection: 'Permission',
  accessLabel: 'Accessibility',
  accessAllowed: 'Allowed',
  accessButton: 'Allow…',
  accessHint:
    'Layout Fixer presses ⌘C and ⌘V for you, which macOS only allows after you turn it on in System Settings → Privacy & Security → Accessibility.',
  accessAllowedHint: 'Layout Fixer can copy and paste the text you select.',

  // Shortcut
  shortcutSection: 'Shortcut',
  shortcutLabel: 'Fix the selected text',
  shortcutHint: 'Select text in any app and press the shortcut. You can also use Fix Selection in the menu bar.',
  shortcutTaken: 'Another app already uses this shortcut. Choose another one.',
  shortcutChange: 'Change',
  shortcutRecording: 'Press the new shortcut…',
  shortcutCancel: 'Cancel',
  shortcutReset: 'Reset',
  shortcutNeedsModifier: 'Use at least one of Ctrl, Alt or ⌘ with a letter, digit or F-key.',
  shortcutReserved: 'The system uses this shortcut. Choose another one.',

  // General
  generalSection: 'General',
  launchAtLogin: 'Open at login',
  showMessages: 'Show on-screen messages',
  showMessagesHint: 'A short message appears when nothing is selected or the text can’t be fixed.',
  language: 'Language',
  languageAuto: 'Same as system',

  // Arabic layout
  layoutSection: 'Arabic keyboard layout',
  layoutAuto: 'Automatic',
  layoutAutoHint: (current: string) =>
    `Uses the Mac layout on macOS and the PC layout everywhere else. Now using: ${current}.`,
  layoutPc: 'PC',
  layoutPcHint: 'Windows “Arabic (101)”, macOS “Arabic – PC”, Linux.',
  layoutMac: 'Mac',
  layoutMacHint: 'The default “Arabic” layout on macOS.',
  layoutExample: (keys: string, word: string) => `Typing ${keys} gives ${word}`,

  // Wayland (Linux)
  waylandTitle: 'Wayland session',
  waylandBody:
    'Wayland doesn’t let apps press keys in other apps yet, so fixing text doesn’t work in this session. Log in with an X11 (Xorg) session to use Layout Fixer; Wayland support is planned.',

  // Updates
  updatesSection: 'Updates',
  autoUpdate: 'Check for updates automatically',
  updateCheckNow: 'Check now',
  updateChecking: 'Checking…',
  updateCurrent: 'Layout Fixer is up to date.',
  updateAvailable: (version: string) => `Version ${version} is available.`,
  updateInstall: 'Install and restart',
  updateInstalling: 'Installing…',
  updateFailed: 'Couldn’t check for updates. Try again later.',
  updateHint: 'Updates come from the project’s GitHub releases and are verified before they install.',
  appVersion: (version: string) => `Version ${version}`,
  trayUpdate: (version: string) => `Update to ${version}…`,

  privacyTitle: 'Privacy',
  privacyBody:
    'Layout Fixer reads text only when you press the shortcut, converts it on this device, and never stores or sends it.',

  // First-run welcome
  welcomeTitle: 'Welcome to Layout Fixer',
  welcomeBody: 'Typed a sentence with the wrong keyboard layout? Select it in any app and press the shortcut.',
  welcomeTry: 'Try it: select the text below and press',
  welcomeSample: 'hgsghl ugd;l',
  welcomeTryLabel: 'Practice text',
  welcomeDone: 'Done',
} as const

type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : T[K] }

/** Every language provides exactly these keys; functions keep their parameters. */
export type Messages = Widen<typeof EN>
