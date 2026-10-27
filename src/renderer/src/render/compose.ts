// Rendu des planches : mise en page du modèle, puis adaptation au format attendu par
// le pilote d'impression (fond perdu, calage). Tout est fait au canvas : aucun module natif.
import type { BoothConfig, ColorMode, FormatId } from '@shared/types'
import { TEMPLATES, type Rect, type Template } from './templates'

export interface Composition {
  /** Image partagée (galerie, QR, e-mail). Pour les bandelettes : une seule bande. */
  composite: string
  /** Planche 10×15 prête à imprimer, en paysage, fond perdu inclus. */
  printImage: string
}

/** Rectangle source à prélever pour remplir `dst` sans déformation (équivalent object-fit: cover). */
export function coverRect(srcW: number, srcH: number, dst: { w: number; h: number }): Rect {
  const scale = Math.max(dst.w / srcW, dst.h / srcH)
  const w = dst.w / scale
  const h = dst.h / scale
  return { x: (srcW - w) / 2, y: (srcH - h) / 2, w, h }
}

/**
 * Position de la planche utile (1800×1200) dans l'image envoyée au pilote.
 * La planche est agrandie pour couvrir toute la surface (fond perdu), puis on applique
 * l'échelle et le décalage de calage réglés par l'opérateur.
 */
export function printPlacement(
  srcW: number,
  srcH: number,
  p: Pick<BoothConfig['print'], 'widthPx' | 'heightPx' | 'offsetX' | 'offsetY' | 'scale'>
): Rect {
  const scale = Math.max(p.widthPx / srcW, p.heightPx / srcH) * p.scale
  const w = srcW * scale
  const h = srcH * scale
  return { x: (p.widthPx - w) / 2 + p.offsetX, y: (p.heightPx - h) / 2 + p.offsetY, w, h }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image illisible'))
    img.src = src
  })
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!]
}

function drawPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, slot: Rect, mode: ColorMode): void {
  const src = coverRect(img.naturalWidth, img.naturalHeight, slot)
  ctx.save()
  ctx.filter = mode === 'nb' ? 'grayscale(1) contrast(1.12) brightness(1.03)' : 'none'
  ctx.drawImage(img, src.x, src.y, src.w, src.h, slot.x, slot.y, slot.w, slot.h)
  ctx.restore()
}

function drawCaption(ctx: CanvasRenderingContext2D, area: Rect, event: BoothConfig['event'], narrow: boolean): void {
  const cx = area.x + area.w / 2
  const title = event.name || 'MIRA'
  const details = [event.subtitle, event.dateLabel].filter(Boolean).join('  ·  ').toUpperCase()

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#0A0A0A'
  let size = narrow ? 72 : 84
  ctx.font = `300 ${size}px "Cormorant Garamond", Georgia, serif`
  while (ctx.measureText(title).width > area.w - 40 && size > 32) {
    size -= 4
    ctx.font = `300 ${size}px "Cormorant Garamond", Georgia, serif`
  }
  const titleY = area.y + area.h / 2 + (details ? size * 0.12 : size * 0.32)
  ctx.fillText(title, cx, titleY)

  if (details) {
    ctx.font = `500 ${narrow ? 20 : 22}px Manrope, system-ui, sans-serif`
    ctx.fillStyle = '#6B6B6B'
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '6px'
    ctx.fillText(details, cx, titleY + (narrow ? 52 : 56))
  }
  ctx.restore()
}

/** Met en page une bande (ou la planche entière pour les formats paysage). */
function layout(t: Template, images: HTMLImageElement[], event: BoothConfig['event'], mode: ColorMode): HTMLCanvasElement {
  const width = t.repeatX ?? t.width
  const [c, ctx] = canvas(width, t.height)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, t.height)
  t.slots.forEach((slot, i) => drawPhoto(ctx, images[i % images.length], slot, mode))
  drawCaption(ctx, t.caption, event, !!t.repeatX)
  return c
}

async function ensureFonts(): Promise<void> {
  await Promise.all([
    document.fonts.load('300 84px "Cormorant Garamond"'),
    document.fonts.load('500 22px Manrope')
  ]).catch(() => {})
}

export async function compose(
  format: FormatId,
  photos: string[],
  config: BoothConfig,
  mode: ColorMode
): Promise<Composition> {
  await ensureFonts()
  const t = TEMPLATES[format]
  const images = await Promise.all(photos.map(loadImage))
  const unit = layout(t, images, config.event, mode)

  // Planche complète (les bandelettes sont dupliquées pour la découpe 2").
  let sheet = unit
  if (t.repeatX) {
    const [c, ctx] = canvas(t.width, t.height)
    for (let x = 0; x < t.width; x += t.repeatX) ctx.drawImage(unit, x, 0)
    sheet = c
  }

  // Le pilote reçoit toujours une planche paysage.
  if (sheet.height > sheet.width) {
    const [c, ctx] = canvas(sheet.height, sheet.width)
    ctx.translate(c.width / 2, c.height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.drawImage(sheet, -sheet.width / 2, -sheet.height / 2)
    sheet = c
  }

  const [out, octx] = canvas(config.print.widthPx, config.print.heightPx)
  octx.fillStyle = '#FFFFFF'
  octx.fillRect(0, 0, out.width, out.height)
  const r = printPlacement(sheet.width, sheet.height, config.print)
  octx.drawImage(sheet, r.x, r.y, r.w, r.h)

  return {
    composite: unit.toDataURL('image/jpeg', 0.92),
    printImage: out.toDataURL('image/jpeg', 0.95)
  }
}

/** Page de calage : cadre de 1 mm aux bords utiles, croix centrale et repères. */
export function calibrationPage(p: BoothConfig['print']): string {
  const [sheet, ctx] = canvas(1800, 1200)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, 1800, 1200)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 12
  ctx.strokeRect(6, 6, 1788, 1188)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(900, 0)
  ctx.lineTo(900, 1200)
  ctx.moveTo(0, 600)
  ctx.lineTo(1800, 600)
  ctx.stroke()
  ctx.fillStyle = '#000000'
  ctx.font = '300 72px "Cormorant Garamond", Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('MIRA — page de calage 10×15', 900, 520)
  ctx.font = '500 28px Manrope, sans-serif'
  ctx.fillText(`Rendu ${p.widthPx}×${p.heightPx}  ·  échelle ${p.scale}  ·  décalage ${p.offsetX}/${p.offsetY}`, 900, 700)
  ctx.fillText('Le cadre noir doit être visible et régulier sur les 4 bords.', 900, 760)

  const [out, octx] = canvas(p.widthPx, p.heightPx)
  octx.fillStyle = '#FFFFFF'
  octx.fillRect(0, 0, out.width, out.height)
  // Pour le calage, pas d'agrandissement « fond perdu » : la zone utile est centrée telle quelle.
  const fit = Math.min(p.widthPx / 1800, p.heightPx / 1200) * p.scale
  const w = 1800 * fit
  const h = 1200 * fit
  octx.drawImage(sheet, (p.widthPx - w) / 2 + p.offsetX, (p.heightPx - h) / 2 + p.offsetY, w, h)
  return out.toDataURL('image/jpeg', 0.95)
}
