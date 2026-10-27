import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'lg' | 'md'
  disabled?: boolean
  className?: string
  icon?: ReactNode
}

export function Button({ children, onClick, variant = 'primary', size = 'lg', disabled, className = '', icon }: Props) {
  return (
    <motion.button
      type="button"
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={() => {
        if (disabled) return
        onClick?.()
      }}
    >
      {icon}
      <span>{children}</span>
    </motion.button>
  )
}

export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className="back-button"
      aria-label={label}
      onClick={() => {
        onClick()
      }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  )
}
