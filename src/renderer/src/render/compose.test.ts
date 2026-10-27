import { describe, expect, it } from 'vitest'
import { crop32 } from '../camera/camera'
import { coverRect, printPlacement } from './compose'
import { TEMPLATES } from './templates'

describe('coverRect', () => {
  it('prélève une bande centrée quand la source est plus large', () => {
    expect(coverRect(3000, 1000, { w: 1000, h: 1000 })).toEqual({ x: 1000, y: 0, w: 1000, h: 1000 })
  })
  it('garde toute la source quand les proportions sont identiques', () => {
    expect(coverRect(1500, 1000, { w: 600, h: 400 })).toEqual({ x: 0, y: 0, w: 1500, h: 1000 })
  })
})

describe('printPlacement', () => {
  const base = { widthPx: 1844, heightPx: 1240, offsetX: 0, offsetY: 0, scale: 1 }
  it('couvre toute la zone du pilote (fond perdu)', () => {
    const r = printPlacement(1800, 1200, base)
    expect(r.w).toBeGreaterThanOrEqual(1844)
    expect(r.h).toBeGreaterThanOrEqual(1240)
    expect(r.x + r.w / 2).toBeCloseTo(922)
    expect(r.y + r.h / 2).toBeCloseTo(620)
  })
  it('applique le décalage de calage', () => {
    const r = printPlacement(1800, 1200, { ...base, offsetX: 10, offsetY: -6 })
    const r0 = printPlacement(1800, 1200, base)
    expect(r.x - r0.x).toBe(10)
    expect(r.y - r0.y).toBe(-6)
  })
})

describe('crop32', () => {
  it('recadre une image 16:9 en 3:2', () => {
    const c = crop32(1920, 1080, 1)
    expect(c.sw / c.sh).toBeCloseTo(1.5)
    expect(c.sh).toBe(1080)
  })
  it('applique le zoom autour du centre', () => {
    const c = crop32(1500, 1000, 2)
    expect(c).toEqual({ sx: 375, sy: 250, sw: 750, sh: 500 })
  })
})

describe('TEMPLATES', () => {
  it('place chaque photo à l’intérieur de la planche utile', () => {
    for (const t of Object.values(TEMPLATES)) {
      expect(t.slots).toHaveLength(t.poses)
      const width = t.repeatX ?? t.width
      for (const s of [...t.slots, t.caption]) {
        expect(s.x).toBeGreaterThanOrEqual(0)
        expect(s.y).toBeGreaterThanOrEqual(0)
        expect(s.x + s.w).toBeLessThanOrEqual(width)
        expect(s.y + s.h).toBeLessThanOrEqual(t.height)
      }
    }
  })
  it('les bandelettes font 2×6" et tiennent deux fois sur un 10×15', () => {
    const t = TEMPLATES.bandelettes
    expect(t.repeatX).toBe(600)
    expect(t.width).toBe(1200)
    expect(t.height).toBe(1800)
  })
})
