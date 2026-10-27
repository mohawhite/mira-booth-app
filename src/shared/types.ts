// Types partagés entre le processus principal (Electron) et l'interface.

export type FormatId = 'solo' | 'grille' | 'bandelettes'
export type ColorMode = 'couleur' | 'nb'
export type Lang = 'fr' | 'en'

export interface BoothConfig {
  event: {
    id: string
    name: string
    subtitle: string
    welcome: string
    dateLabel: string
    formats: FormatId[]
  }
  session: {
    countdownSeconds: number
    retakes: number
    maxCopies: number
    inactivitySeconds: number
  }
  camera: {
    source: 'webcam' | 'mock'
    deviceId: string
    mirrorPreview: boolean
    mirrorFinal: boolean
    rotation: 0 | 180
    zoom: number // 1 = pas de recadrage, 1.2 = recadrage de 20 %
  }
  print: {
    driver: 'mock' | 'system'
    printerName: string
    widthPx: number // taille de rendu attendue par le pilote (fond perdu inclus)
    heightPx: number
    offsetX: number
    offsetY: number
    scale: number
  }
  system: {
    pin: string
    lang: Lang
    sounds: boolean
    voice: boolean // voix guide (fichiers MP3 dans public/voix)
    voiceVolume: number // 0 à 1
    galleryBaseUrl: string // vide = adresse locale automatique
  }
}

export interface SessionMeta {
  id: string
  eventId: string
  createdAt: string
  format: FormatId
  colorMode: ColorMode
  photoCount: number
  copiesPrinted: number
  email?: string
  consentGallery: boolean
  consentEmail: boolean
}

export interface SavedSession {
  meta: SessionMeta
  galleryUrl: string
  compositeUrl: string // URL affichable dans l'interface
}

export type PrintJobStatus = 'en_attente' | 'impression' | 'termine' | 'erreur'

export interface PrintJob {
  id: string
  sessionId: string
  eventId: string
  copies: number
  status: PrintJobStatus
  createdAt: string
  error?: string
}

export interface BoothStatus {
  printers: string[]
  printQueue: PrintJob[]
  diskFreeGb: number | null
  galleryOrigin: string
  sessionsCount: number
  printsCount: number
  mode: 'electron' | 'web'
}

/** API exposée à l'interface par le preload (`window.mira`). */
export interface MiraBridge {
  getConfig(): Promise<BoothConfig>
  saveConfig(config: BoothConfig): Promise<void>
  saveSession(input: {
    meta: SessionMeta
    photos: string[] // data URLs JPEG
    composite: string // data URL JPEG, image partagée
    printImage: string // data URL JPEG, planche d'impression 10×15
  }): Promise<SavedSession>
  updateSession(meta: SessionMeta): Promise<void>
  listSessions(eventId: string): Promise<SavedSession[]>
  deleteSession(eventId: string, sessionId: string): Promise<void>
  print(input: { eventId: string; sessionId: string; copies: number }): Promise<PrintJob>
  printTestPage(dataUrl: string): Promise<void>
  sendEmail(input: { eventId: string; sessionId: string; email: string }): Promise<void>
  getStatus(): Promise<BoothStatus>
  quit(): Promise<void>
}
