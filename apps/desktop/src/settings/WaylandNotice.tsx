import { useMessages } from '../i18n/react'

/** Linux on Wayland: explains why the shortcut does nothing in this session. */
export function WaylandNotice() {
  const m = useMessages()
  return (
    <section className="section" aria-labelledby="wayland-title">
      <h2 id="wayland-title">{m.waylandTitle}</h2>
      <p className="footnote notice-text" role="note">
        {m.waylandBody}
      </p>
    </section>
  )
}
