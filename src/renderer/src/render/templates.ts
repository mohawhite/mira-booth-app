// Modèles de planches 10×15. Les coordonnées sont exprimées dans l'espace « utile »
// à 300 DPI : 1800×1200 en paysage (ou 1200×1800 en portrait pour les bandelettes).
// Le fond perdu et le calage sont appliqués ensuite par compose.ts.
import type { FormatId } from '@shared/types'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Template {
  format: FormatId
  poses: number
  /** Taille du canevas de mise en page. */
  width: number
  height: number
  /** Zones photo, dans l'ordre des poses. */
  slots: Rect[]
  /** Zone du texte (nom de l'événement, sous-titre). */
  caption: Rect
  /**
   * Bandelettes : la planche contient deux bandes identiques côte à côte.
   * On met en page une seule bande, puis on la duplique avec ce décalage horizontal.
   */
  repeatX?: number
}

const M = 40 // marge extérieure
const G = 20 // espace entre photos
const CAPTION_H = 160

export const TEMPLATES: Record<FormatId, Template> = {
  solo: {
    format: 'solo',
    poses: 1,
    width: 1800,
    height: 1200,
    slots: [{ x: M, y: M, w: 1800 - 2 * M, h: 1200 - 2 * M - CAPTION_H }],
    caption: { x: M, y: 1200 - M - CAPTION_H, w: 1800 - 2 * M, h: CAPTION_H }
  },
  grille: (() => {
    const w = (1800 - 2 * M - G) / 2
    const h = (1200 - 2 * M - CAPTION_H - G) / 2
    return {
      format: 'grille' as const,
      poses: 4,
      width: 1800,
      height: 1200,
      slots: [
        { x: M, y: M, w, h },
        { x: M + w + G, y: M, w, h },
        { x: M, y: M + h + G, w, h },
        { x: M + w + G, y: M + h + G, w, h }
      ],
      caption: { x: M, y: 1200 - M - CAPTION_H, w: 1800 - 2 * M, h: CAPTION_H }
    }
  })(),
  bandelettes: (() => {
    // Une bande = 600×1800 (2×6"). Photos 3:2 de 540×360.
    const m = 30
    const w = 600 - 2 * m
    const h = (w * 2) / 3
    const slots = [0, 1, 2, 3].map((i) => ({ x: m, y: m + i * (h + G), w, h }))
    const top = m + 4 * h + 3 * G
    return {
      format: 'bandelettes' as const,
      poses: 4,
      width: 1200,
      height: 1800,
      slots,
      caption: { x: m, y: top, w, h: 1800 - top - m },
      repeatX: 600
    }
  })()
}
