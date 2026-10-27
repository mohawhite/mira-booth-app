import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** Conteneur d'écran avec transition douce (fondu + léger mouvement). */
export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      className={`screen ${className}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.section>
  )
}
