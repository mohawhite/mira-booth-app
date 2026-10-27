import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Halo } from '@/components/Halo'
import { Screen } from '@/components/Screen'
import { useT } from '@/i18n'
import { bridge } from '@/lib/bridge'
import { useConfig } from '@/lib/config'
import type { ScreenProps } from './types'

const SLIDE_MS = 6000

/** Écran d'attente : diaporama des photos autorisées et invitation à toucher l'écran. */
export function Attente({ send }: ScreenProps) {
  const t = useT()
  const event = useConfig((s) => s.config.event)
  const [slides, setSlides] = useState<string[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const load = (): void => {
      bridge
        .listSessions(event.id)
        .then((list) => setSlides(list.filter((s) => s.meta.consentGallery).slice(0, 30).map((s) => s.compositeUrl)))
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [event.id])

  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(id)
  }, [slides.length])

  const current = slides.length ? slides[index % slides.length] : undefined

  return (
    <Screen className="attente">
      <button type="button" className="attente-hit" aria-label={t('idle.touch')} onClick={() => send({ type: 'START' })} />
      <AnimatePresence>
        {current && (
          <motion.div
            key={current}
            className="attente-slide"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={current} alt="" className="attente-slide-bg" />
            <img src={current} alt="" className="attente-slide-photo" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="attente-veil" />

      <div className="attente-content">
        <div className="attente-halo"><Halo size={160} /></div>
        <p className="eyebrow">{event.subtitle || 'MIRA'}</p>
        <h1 className="display attente-title">{event.name}</h1>
        {event.dateLabel && <p className="eyebrow">{event.dateLabel}</p>}
      </div>

      <motion.p
        className="attente-cta"
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {t('idle.touch')}
      </motion.p>
      <div className="brand-mark">M I R A</div>
    </Screen>
  )
}
