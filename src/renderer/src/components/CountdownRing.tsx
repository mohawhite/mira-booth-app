import { AnimatePresence, motion } from 'motion/react'

/** Anneau qui se referme autour du chiffre, une seconde après l'autre. */
export function CountdownRing({ value, total, size = 420 }: { value: number; total: number; size?: number }) {
  const r = size / 2 - 6
  const c = 2 * Math.PI * r
  const progress = value / total
  return (
    <div className="countdown" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(250,250,250,.18)" strokeWidth="2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#FAFAFA"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 12px rgba(255,255,255,.6))' }}
        />
      </svg>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          className="countdown-value numeral"
          initial={{ opacity: 0, scale: 1.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
