import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Halo } from '@/components/Halo'
import { Screen } from '@/components/Screen'
import { useT } from '@/i18n'
import { play } from '@/lib/sound'
import type { ScreenProps } from './types'

export function Merci({ ctx, send }: ScreenProps) {
  const t = useT()
  useEffect(() => play('success'), [])
  return (
    <Screen className="merci">
      <button type="button" className="attente-hit" aria-label="OK" onClick={() => send({ type: 'START' })} />
      <Halo size={180} />
      <motion.h1
        className="display merci-title"
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
      >
        {t('thanks.title')}
      </motion.h1>
      <motion.p
        className="merci-text muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
      >
        {ctx.printed > 0 ? t('thanks.printing') : t('thanks.noPrint')}
      </motion.p>
    </Screen>
  )
}
