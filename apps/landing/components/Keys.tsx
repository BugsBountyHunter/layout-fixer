interface KeysProps {
  readonly keys: readonly string[]
  /** Highlights the keys, as if pressed (the demo's shortcut moment). */
  readonly active?: boolean
  readonly testId?: string
}

export function Keys({ keys, active = false, testId }: KeysProps) {
  return (
    <span className="kbd-group" dir="ltr" data-testid={testId}>
      {keys.map((key) => (
        <kbd key={key} data-active={active || undefined}>
          {key}
        </kbd>
      ))}
    </span>
  )
}
