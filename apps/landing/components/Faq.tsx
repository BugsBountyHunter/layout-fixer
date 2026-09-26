import type { Dictionary } from '@/lib/i18n'
import styles from './Faq.module.css'

export function Faq({ t }: { t: Dictionary }) {
  return (
    <section className="section section-grouped" aria-labelledby="faq-title">
      <div className="container narrow">
        <h2 id="faq-title" className="section-title">
          {t.faq.title}
        </h2>
        {t.faq.items.map((item) => (
          <details key={item.question} className={styles.item}>
            <summary className={styles.question}>{item.question}</summary>
            <p className={`muted ${styles.answer}`}>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
