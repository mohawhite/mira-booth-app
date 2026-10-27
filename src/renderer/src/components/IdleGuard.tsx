import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n'
import { Button } from './Button'

const WARNING_SECONDS = 10

/**
 * Ramène doucement la borne à l'accueil quand plus personne ne l'utilise.
 * Un avertissement « Toujours là ? » apparaît 10 s avant.
 */
export function IdleGuard({ active, seconds, onTimeout }: { active: boolean; seconds: number; onTimeout: () => void }) {
  const t = useT()
  const [left, setLeft] = useState(seconds)
  const lastActivity = useRef(Date.now())

  useEffect(() => {
    const touch = (): void => {
      lastActivity.current = Date.now()
      setLeft(seconds)
    }
    touch()
    window.addEventListener('pointerdown', touch, true)
    return () => window.removeEventListener('pointerdown', touch, true)
  }, [seconds, active])

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      const remaining = seconds - Math.floor((Date.now() - lastActivity.current) / 1000)
      setLeft(remaining)
      if (remaining <= 0) onTimeout()
    }, 250)
    return () => clearInterval(id)
  }, [active, seconds, onTimeout])

  const warn = active && left <= WARNING_SECONDS && left > 0
  return (
    <AnimatePresence>
      {warn && (
        <motion.div className="idle-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="idle-card">
            <h2 className="display">{t('idle.still')}</h2>
            <p className="muted">{t('idle.stillHint')}</p>
            <div className="idle-count numeral">{left}</div>
            <Button variant="secondary" size="md">{t('idle.continue')}</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
