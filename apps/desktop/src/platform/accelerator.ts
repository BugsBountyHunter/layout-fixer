/** Tauri accelerator names as macOS draws them. */
const MAC_SYMBOLS: Readonly<Record<string, string>> = {
  Alt: '⌥',
  Option: '⌥',
  Shift: '⇧',
  Cmd: '⌘',
  Command: '⌘',
  Super: '⌘',
  CmdOrCtrl: '⌘',
  CommandOrControl: '⌘',
  Ctrl: '⌃',
  Control: '⌃',
}

const OTHER_NAMES: Readonly<Record<string, string>> = {
  CmdOrCtrl: 'Ctrl',
  CommandOrControl: 'Ctrl',
  Control: 'Ctrl',
  Option: 'Alt',
  Super: 'Win',
}

/** "Alt+Shift+F" → ["⌥", "⇧", "F"] on macOS, ["Alt", "Shift", "F"] elsewhere. */
export function formatAccelerator(accelerator: string, isMac: boolean): string[] {
  const names = isMac ? MAC_SYMBOLS : OTHER_NAMES
  return accelerator
    .split('+')
    .filter(Boolean)
    .map((key) => names[key] ?? key)
}
