interface Props {
  readonly label: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
}

export function SwitchRow({ label, checked, onChange }: Props) {
  return (
    <label className="row switch-row">
      <span className="row-label">{label}</span>
      <input
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        aria-checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}
