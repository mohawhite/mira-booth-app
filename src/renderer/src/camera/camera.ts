// Couche caméra. Chaque pilote fournit un flux vidéo pour le live view ; la capture
// prend une image de ce flux, recadrée en 3:2. En Phase 2, le pilote Canon EOS 2000D
// (EDSDK) remplacera la webcam en implémentant la même interface.
import type { BoothConfig } from '@shared/types'

export interface CameraDriver {
  readonly stream: MediaStream
  stop(): void
}

class WebcamDriver implements CameraDriver {
  private constructor(readonly stream: MediaStream) {}

  static async open(deviceId: string): Promise<WebcamDriver> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      }
    })
    return new WebcamDriver(stream)
  }

  stop(): void {
    this.stream.getTracks().forEach((t) => t.stop())
  }
}

/** Caméra simulée : une scène animée, pour développer sans matériel. */
class MockCameraDriver implements CameraDriver {
  readonly stream: MediaStream
  private raf = 0

  constructor() {
    const canvas = document.createElement('canvas')
    canvas.width = 1500
    canvas.height = 1000
    const ctx = canvas.getContext('2d')!
    const start = performance.now()
    const draw = (): void => {
      const t = (performance.now() - start) / 1000
      const g = ctx.createLinearGradient(0, 0, 1500, 1000)
      g.addColorStop(0, '#3a3a3a')
      g.addColorStop(1, '#bdbdbd')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 1500, 1000)
      // Deux silhouettes stylisées qui bougent doucement.
      for (const [i, x] of [560, 940].entries()) {
        const y = 520 + Math.sin(t * 1.4 + i) * 18
        ctx.fillStyle = i ? '#f2f2f2' : '#1c1c1c'
        ctx.beginPath()
        ctx.arc(x, y - 170, 95, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(x, y + 210, 190, 250, 0, Math.PI, 0)
        ctx.fill()
      }
      this.raf = requestAnimationFrame(draw)
    }
    draw()
    this.stream = canvas.captureStream(30)
  }

  stop(): void {
    cancelAnimationFrame(this.raf)
    this.stream.getTracks().forEach((t) => t.stop())
  }
}

let current: { driver: CameraDriver; key: string } | undefined
let video: HTMLVideoElement | undefined

/** Ouvre (ou réutilise) la caméra configurée. En cas d'échec webcam, bascule sur la caméra simulée. */
export async function openCamera(cfg: BoothConfig['camera']): Promise<CameraDriver> {
  const key = `${cfg.source}:${cfg.deviceId}`
  if (current?.key === key && current.driver.stream.active) return current.driver
  current?.driver.stop()
  let driver: CameraDriver
  if (cfg.source === 'webcam') {
    try {
      driver = await WebcamDriver.open(cfg.deviceId)
    } catch (e) {
      console.warn('[MIRA] webcam indisponible, caméra simulée utilisée', e)
      driver = new MockCameraDriver()
    }
  } else {
    driver = new MockCameraDriver()
  }
  current = { driver, key }
  video ??= Object.assign(document.createElement('video'), { muted: true, playsInline: true })
  video.srcObject = driver.stream
  await video.play().catch(() => {})
  return driver
}

export function closeCamera(): void {
  current?.driver.stop()
  current = undefined
}

export async function listVideoDevices(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((d) => d.kind === 'videoinput')
}

/** Rectangle source 3:2 centré, avec recadrage (zoom) optionnel. */
export function crop32(w: number, h: number, zoom: number): { sx: number; sy: number; sw: number; sh: number } {
  let sw = w
  let sh = (w * 2) / 3
  if (sh > h) {
    sh = h
    sw = (h * 3) / 2
  }
  sw /= zoom
  sh /= zoom
  return { sx: (w - sw) / 2, sy: (h - sh) / 2, sw, sh }
}

/** Capture une image JPEG 3:2 depuis le flux en cours. */
export async function capture(cfg: BoothConfig['camera']): Promise<string> {
  if (!video || !current) throw new Error('Caméra non ouverte')
  if (video.readyState < 2) await new Promise((r) => video!.addEventListener('loadeddata', r, { once: true }))
  const { videoWidth: w, videoHeight: h } = video
  const { sx, sy, sw, sh } = crop32(w, h, cfg.zoom)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sw)
  canvas.height = Math.round(sh)
  const ctx = canvas.getContext('2d')!
  ctx.translate(canvas.width / 2, canvas.height / 2)
  if (cfg.rotation === 180) ctx.rotate(Math.PI)
  if (cfg.mirrorFinal) ctx.scale(-1, 1)
  ctx.drawImage(video, sx, sy, sw, sh, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.92)
}
