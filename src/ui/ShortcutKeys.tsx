interface Props {
  readonly keys: readonly string[]
}

export function ShortcutKeys({ keys }: Props) {
  return (
    <span className="kbd-group" dir="ltr">
      {keys.map((key) => (
        <kbd key={key}>{key}</kbd>
      ))}
    </span>
  )
}
