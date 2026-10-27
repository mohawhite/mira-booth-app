import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { IconDelete } from '@/components/Icons'
import { useConfig } from '@/lib/config'

const HOLD_MS = 3000

/** Zone invisible (coin haut-gauche) : un appui de 3 s ouvre le clavier du code PIN. */
export function AdminCorner({ enabled, onUnlock }: { enabled: boolean; onUnlock: () => void }) {
  const timer = useRef<number>(undefined)
  const [pin, setPin] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const expected = useConfig((s) => s.config.system.pin)

  const start = (): void => {
    if (!enabled) return
    timer.current = window.setTimeout(() => setPin(''), HOLD_MS)
  }
  const cancel = (): void => window.clearTimeout(timer.current)

  const press = (k: string): void => {
    if (pin === null) return
    setError(false)
    if (k === 'del') return setPin(pin.slice(0, -1))
    const next = pin + k
    if (next.length < expected.length) return setPin(next)
    if (next === expected) {
      setPin(null)
      onUnlock()
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <>
      <div className="admin-corner" onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel} />
      <AnimatePresence>
        {pin !== null && (
          <motion.div className="pin-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="pin-card">
              <p className="eyebrow">Espace opérateur</p>
              <div className={`pin-dots ${error ? 'error' : ''}`}>
                {Array.from({ length: expected.length }, (_, i) => (
                  <span key={i} className={i < pin.length ? 'filled' : ''} />
                ))}
              </div>
              <div className="pin-pad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', '0', 'del'].map((k) =>
                  k === 'x' ? (
                    <button key={k} type="button" className="pin-key pin-cancel" onClick={() => setPin(null)}>Annuler</button>
                  ) : (
                    <button key={k} type="button" className="pin-key" onClick={() => press(k)} aria-label={k === 'del' ? 'Effacer' : k}>
                      {k === 'del' ? <IconDelete size={36} /> : k}
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
