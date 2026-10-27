import { motion } from 'motion/react'
import { Button } from '@/components/Button'
import { IconCheck, IconRetake } from '@/components/Icons'
import { Screen } from '@/components/Screen'
import { useT } from '@/i18n'
import type { ScreenProps } from './types'

export function Revue({ ctx, send }: ScreenProps) {
  const t = useT()
  const strip = ctx.format === 'bandelettes'
  return (
    <Screen className="revue">
      <div className="revue-preview">
        <motion.img
          src={ctx.saved?.compositeUrl}
          alt=""
          className={`print-preview ${strip ? 'print-preview-strip' : ''}`}
          initial={{ opacity: 0, y: 40, rotate: -1.5, filter: 'brightness(0)' }}
          animate={{ opacity: 1, y: 0, rotate: 0, filter: 'brightness(1)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <aside className="revue-side">
        <h2 className="display">{t('review.title')}</h2>
        <Button icon={<IconCheck size={40} />} onClick={() => send({ type: 'VALIDATE' })}>{t('review.ok')}</Button>
        {ctx.retakesLeft > 0 && (
          <>
            <Button variant="secondary" icon={<IconRetake size={36} />} onClick={() => send({ type: 'RETAKE' })}>
              {t('review.retake')}
            </Button>
            <p className="eyebrow">{t('review.retakesLeft', { n: ctx.retakesLeft })}</p>
          </>
        )}
      </aside>
    </Screen>
  )
}
