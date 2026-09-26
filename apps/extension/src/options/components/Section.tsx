import type { ReactNode } from 'react'

interface Props {
  readonly id: string
  readonly title: string
  /** Shown under the group, like a footnote in system settings. */
  readonly hint?: string
  readonly children: ReactNode
}

export function Section({ id, title, hint, children }: Props) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <div className="group">{children}</div>
      {hint && <p className="footnote">{hint}</p>}
    </section>
  )
}
