// Icônes au trait fin, dessinées pour MIRA (aucun emoji dans l'interface).
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = ({ size = 40, ...rest }: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...rest
})

export const IconBack = (p: P) => (
  <svg {...base(p)}><path d="M15 5l-7 7 7 7" /></svg>
)
export const IconUp = (p: P) => (
  <svg {...base(p)}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
)
export const IconPrint = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 9V3h10v6" />
    <rect x="3" y="9" width="18" height="8" rx="2" />
    <path d="M7 14h10v7H7z" />
  </svg>
)
export const IconMail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
  </svg>
)
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
)
export const IconRetake = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4v4h4" />
  </svg>
)
export const IconMinus = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14" /></svg>
)
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const IconDelete = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-6-6 6-6z" />
    <path d="M12 10l4 4M16 10l-4 4" />
  </svg>
)

/** Pictogrammes des formats : reproduisent la mise en page réelle de la planche. */
export function FormatGlyph({ format }: { format: 'solo' | 'grille' | 'bandelettes' }) {
  const s = { fill: 'currentColor', opacity: 0.9 }
  return (
    <svg width="220" height="160" viewBox="0 0 220 160" aria-hidden>
      {format === 'solo' && (
        <>
          <rect x="20" y="10" width="180" height="140" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="28" y="18" width="164" height="104" rx="1" {...s} />
        </>
      )}
      {format === 'grille' && (
        <>
          <rect x="20" y="10" width="180" height="140" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="28" y="18" width="80" height="50" rx="1" {...s} />
          <rect x="112" y="18" width="80" height="50" rx="1" {...s} />
          <rect x="28" y="72" width="80" height="50" rx="1" {...s} />
          <rect x="112" y="72" width="80" height="50" rx="1" {...s} />
        </>
      )}
      {format === 'bandelettes' && (
        <>
          <rect x="80" y="2" width="60" height="156" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="85" y={7 + i * 32} width="50" height="29" rx="1" {...s} />
          ))}
        </>
      )}
    </svg>
  )
}
