import type { BoothConfig } from './types'

export const DEFAULT_CONFIG: BoothConfig = {
  event: {
    id: 'demo',
    name: 'Soirée MIRA',
    subtitle: 'Paris',
    welcome: 'Bienvenue',
    dateLabel: '',
    formats: ['solo', 'grille', 'bandelettes']
  },
  session: {
    countdownSeconds: 5,
    retakes: 1,
    maxCopies: 2,
    inactivitySeconds: 45
  },
  camera: {
    source: 'webcam',
    deviceId: '',
    mirrorPreview: true,
    mirrorFinal: false,
    rotation: 0,
    zoom: 1
  },
  print: {
    driver: 'mock',
    printerName: '',
    // DNP DS-RX1HS, 10×15 : 1800×1200 utiles + fond perdu. À vérifier dans le pilote.
    widthPx: 1844,
    heightPx: 1240,
    offsetX: 0,
    offsetY: 0,
    scale: 1
  },
  system: {
    pin: '1234',
    lang: 'fr',
    sounds: true,
    galleryBaseUrl: ''
  }
}

/** Fusionne une configuration enregistrée avec les valeurs par défaut (nouvelles clés). */
export function withDefaults(partial: Partial<BoothConfig> | undefined): BoothConfig {
  const p = partial ?? {}
  return {
    event: { ...DEFAULT_CONFIG.event, ...p.event },
    session: { ...DEFAULT_CONFIG.session, ...p.session },
    camera: { ...DEFAULT_CONFIG.camera, ...p.camera },
    print: { ...DEFAULT_CONFIG.print, ...p.print },
    system: { ...DEFAULT_CONFIG.system, ...p.system }
  }
}
