import { useEffect, useState, type ReactNode } from 'react'

export const STAGE_W = 1920
export const STAGE_H = 1080

/**
 * L'interface est dessinée sur une scène fixe de 1920×1080 (l'écran 15,6" de la borne),
 * mise à l'échelle pour remplir la fenêtre. Le rendu est ainsi identique en développement et sur la borne.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = (): void => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return (
    <div className="stage-viewport">
      <div className="stage grain" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}
