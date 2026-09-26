import type { Dictionary } from '@/lib/i18n'
import styles from './HowItWorks.module.css'
import { Keys } from './Keys'

export function HowItWorks({ t }: { t: Dictionary }) {
  return (
    <section className="section section-grouped" aria-labelledby="how-title">
      <div className="container">
        <h2 id="how-title" className="section-title">
          {t.how.title}
        </h2>
        <ol className={styles.steps}>
          {t.how.steps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <h3>{step.title}</h3>
              {index === 1 && (
                <p>
                  <Keys keys={['⌥', '⇧', 'F']} /> <span className="muted">/</span> <Keys keys={['Alt', 'Shift', 'F']} />
                </p>
              )}
              <p className="muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
