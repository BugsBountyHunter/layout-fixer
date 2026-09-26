import { PROMO_VIDEO } from '@/lib/config'
import type { Dictionary } from '@/lib/i18n'
import styles from './PromoVideo.module.css'

/** Rendered from apps/promo-video in the extension repo. It never autoplays and loads only when played. */
export function PromoVideo({ t }: { t: Dictionary }) {
  return (
    <section className="section" aria-labelledby="video-title">
      <div className="container">
        <h2 id="video-title" className="section-title">
          {t.video.title}
        </h2>
        {/* biome-ignore lint/a11y/useMediaCaption: the video has no audio track; all of its text is on screen */}
        <video
          className={styles.video}
          src={PROMO_VIDEO.src}
          poster={PROMO_VIDEO.poster}
          width={1920}
          height={1080}
          controls
          playsInline
          preload="none"
          aria-label={t.video.label}
          data-testid="promo-video"
        />
      </div>
    </section>
  )
}
