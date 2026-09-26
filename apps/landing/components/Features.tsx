import type { Dictionary } from '@/lib/i18n'
import styles from './Features.module.css'

export function Features({ t }: { t: Dictionary }) {
  return (
    <section className="section" aria-labelledby="features-title">
      <div className="container narrow">
        <h2 id="features-title" className="section-title">
          {t.features.title}
        </h2>
        <ul className={styles.group}>
          {t.features.items.map((item) => (
            <li key={item.title} className={styles.row}>
              <h3>{item.title}</h3>
              <p className="muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
