import { motion } from 'motion/react'
import { BackButton } from '@/components/Button'
import { FormatGlyph } from '@/components/Icons'
import { Screen } from '@/components/Screen'
import { useT } from '@/i18n'
import { useConfig } from '@/lib/config'
import type { ScreenProps } from './types'

export function Format({ send }: ScreenProps) {
  const t = useT()
  const formats = useConfig((s) => s.config.event.formats)
  return (
    <Screen className="format">
      <BackButton label={t('common.back')} onClick={() => send({ type: 'BACK' })} />
      <h2 className="display screen-title">{t('format.title')}</h2>
      <div className="format-cards">
        {formats.map((f, i) => (
          <motion.button
            key={f}
            type="button"
            className="format-card"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              send({ type: 'CHOOSE_FORMAT', format: f })
            }}
          >
            <FormatGlyph format={f} />
            <span className="format-card-name display">{t(`format.${f}`)}</span>
            <span className="eyebrow">{t(`format.${f}.desc`)}</span>
          </motion.button>
        ))}
      </div>
    </Screen>
  )
}
