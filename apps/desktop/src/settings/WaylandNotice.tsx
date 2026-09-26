import { STRINGS } from './strings'

/** Linux on Wayland: explains why the shortcut does nothing in this session. */
export function WaylandNotice() {
  return (
    <section className="section" aria-labelledby="wayland-title">
      <h2 id="wayland-title">{STRINGS.waylandTitle}</h2>
      <p className="footnote notice-text" role="note">
        {STRINGS.waylandBody}
      </p>
    </section>
  )
}
