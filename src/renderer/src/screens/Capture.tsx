import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { capture } from '@/camera/camera'
import { CountdownRing } from '@/components/CountdownRing'
import { Halo } from '@/components/Halo'
import { IconUp } from '@/components/Icons'
import { LiveView } from '@/components/LiveView'
import { Screen } from '@/components/Screen'
import { useT, type TKey } from '@/i18n'
import { getConfig, useConfig } from '@/lib/config'
import { play } from '@/lib/sound'
import { POSES } from '@/machine/boothMachine'
import type { ScreenProps } from './types'

/** Repère « Regardez ici » : l'objectif est au-dessus de l'écran. */
function LookHere({ label }: { label: string }) {
  return (
    <div className="look-here">
      <Halo size={110} intense />
      <motion.div
        className="look-here-label"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <IconUp size={34} />
        <span className="eyebrow">{label}</span>
        <IconUp size={34} />
      </motion.div>
    </div>
  )
}

function PoseDots({ done, total }: { done: number; total: number }) {
  if (total < 2) return null
  return (
    <div className="pose-dots" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < done ? 'done' : i === done ? 'current' : ''} />
      ))}
    </div>
  )
}

export function Compte({ ctx, send }: ScreenProps) {
  const t = useT()
  const seconds = useConfig((s) => s.config.session.countdownSeconds)
  const [value, setValue] = useState(seconds)
  const [flash, setFlash] = useState(false)
  const fired = useRef(false)
  const total = POSES[ctx.format]
  const pose = ctx.photos.length

  useEffect(() => {
    if (value <= 0) return
    play('tick')
    const id = setTimeout(() => setValue((v) => v - 1), 1000)
    return () => clearTimeout(id)
  }, [value])

  useEffect(() => {
    if (value > 0 || fired.current) return
    fired.current = true
    setFlash(true)
    play('shutter')
    capture(getConfig().camera)
      .then((photo) => setTimeout(() => send({ type: 'CAPTURED', photo }), 350))
      .catch(() => send({ type: 'CAPTURE_FAILED' }))
  }, [value, send])

  return (
    <Screen className="compte">
      <LookHere label={t('count.look')} />
      <div className="compte-live">
        <LiveView width={1200} colorMode={ctx.colorMode} />
        <div className="compte-ring">
          {value > 0 && <CountdownRing value={value} total={seconds} size={380} />}
        </div>
      </div>
      <div className="compte-footer">
        {total > 1 && <span className="eyebrow">{t('count.pose', { n: pose + 1, total })}</span>}
        <PoseDots done={pose} total={total} />
      </div>
      <AnimatePresence>
        {flash && (
          <motion.div
            className="flash"
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </Screen>
  )
}

const INTERLUDES: TKey[] = ['interlude.1', 'interlude.2', 'interlude.3']

/** Entre deux poses : la photo « se développe » (du noir vers l'image) avec un mot d'encouragement. */
export function Interlude({ ctx }: ScreenProps) {
  const t = useT()
  const last = ctx.photos[ctx.photos.length - 1]
  const total = POSES[ctx.format]
  return (
    <Screen className="interlude">
      <motion.img
        src={last}
        alt=""
        className="interlude-photo"
        style={{ filter: ctx.colorMode === 'nb' ? 'grayscale(1) contrast(1.12)' : undefined }}
        initial={{ opacity: 0, scale: 0.92, filter: 'brightness(0)' }}
        animate={{ opacity: 1, scale: 1, filter: ctx.colorMode === 'nb' ? 'brightness(1) grayscale(1) contrast(1.12)' : 'brightness(1)' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
      <h2 className="display interlude-text">{t(INTERLUDES[(ctx.photos.length - 1) % INTERLUDES.length])}</h2>
      <PoseDots done={ctx.photos.length} total={total} />
    </Screen>
  )
}
