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

  // Install location (macOS)
  moveTitle: 'Move Layout Fixer to Applications',
  moveDiskImage:
    'You opened Layout Fixer from the disk image. Quit it, drag Layout Fixer into the Applications folder, and open it from there — otherwise it can’t update itself or open at login.',
  moveTranslocated:
    'macOS is running Layout Fixer from a temporary copy. Quit it, drag Layout Fixer into the Applications folder in Finder, and open it from there — otherwise it can’t update itself or open at login.',
  moveButton: 'Open Applications Folder',
  updateNeedsMove: 'Move Layout Fixer to Applications to install updates.',

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
  switchLayout: 'Switch keyboard layout after fixing',
  switchLayoutHint:
    'After fixing, your keyboard switches to the language of the fixed text, so you can keep typing. It uses the layouts you already have.',
  switchLayoutMissingAr: (where: string) => `To switch to Arabic, add an Arabic keyboard in ${where}.`,
  switchLayoutMissingEn: (where: string) => `To switch to English, add an English keyboard in ${where}.`,
  keyboardSettingsMac: 'System Settings → Keyboard → Text Input',
  keyboardSettingsWindows: 'Settings → Time & language → Language & region',
  keyboardSettingsLinux: 'your desktop’s keyboard settings',
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
  layoutMismatch: (have: string) =>
    `Your computer has the ${have} Arabic layout, not this one, so fixed text may come out wrong.`,
  layoutMismatchUse: (name: string) => `Use ${name}`,

  // GNOME (Linux)
  gnomeSection: 'Keyboard switching on GNOME',
  gnomeLabel: 'Layout Fixer extension',
  gnomeInstall: 'Install',
  gnomeOn: 'On',
  gnomeLogOut: 'Log out to finish',
  gnomeExtensionsOff: 'Extensions are off',
  gnomeIncompatible: 'Not supported',
  gnomeOffHint:
    'GNOME lets apps switch the keyboard layout only through a GNOME Shell extension. Layout Fixer installs its own small one; it only switches the layout and never sees what you type.',
  gnomeOnHint: 'Layout Fixer switches the keyboard layout through its GNOME Shell extension.',
  gnomeLogOutHint: 'Log out and back in to finish: GNOME loads new extensions when you log in.',
  gnomeExtensionsOffHint: 'Turn on Extensions in the Extensions app, then log out and back in.',
  gnomeIncompatibleHint:
    'This version of GNOME can’t run the extension yet. Update Layout Fixer to get one that supports it.',
  gnomeFailed: 'The extension couldn’t be installed. Try again, or check that your home folder is writable.',

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

  // About
  aboutSection: 'About',
  aboutReportBug: 'Report a bug',
  aboutRequestLanguage: 'Request a language',
  aboutContribute: 'Star or contribute on GitHub',
  aboutShare: 'Share with a friend',
  aboutCopyLink: 'Copy link',
  aboutCopied: 'Copied',
  aboutCopyFailed: 'Copy this address:',
  aboutDonate: 'Donate',
  aboutMadeWith: 'Made with',
  aboutLove: 'love',
  aboutBy: 'by',
  aboutAuthor: 'Ahmed Saber',
  aboutNewTab: 'opens in your browser',

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
