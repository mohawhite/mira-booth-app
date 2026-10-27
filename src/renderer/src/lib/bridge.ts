// Accès au processus principal. Hors Electron (aperçu navigateur), on utilise une
// version simulée en mémoire pour pouvoir travailler l'interface sans la borne.
import { DEFAULT_CONFIG, withDefaults } from '@shared/defaults'
import type { BoothConfig, MiraBridge, PrintJob, SavedSession } from '@shared/types'

function createWebBridge(): MiraBridge {
  const sessions: SavedSession[] = []
  const jobs: PrintJob[] = []
  const CONFIG_KEY = 'mira.config'

  const readConfig = (): BoothConfig => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY)
      return withDefaults(raw ? JSON.parse(raw) : undefined)
    } catch {
      return DEFAULT_CONFIG
    }
  }

  return {
    async getConfig() {
      return readConfig()
    },
    async saveConfig(c) {
      try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(c))
      } catch {
        /* stockage indisponible : la config reste en mémoire */
      }
    },
    async saveSession({ meta, composite }) {
      const saved: SavedSession = {
        meta,
        compositeUrl: composite,
        galleryUrl: `https://galerie.mira.app/s/${meta.eventId}/${meta.id}`
      }
      sessions.unshift(saved)
      return saved
    },
    async updateSession(meta) {
      const s = sessions.find((x) => x.meta.id === meta.id)
      if (s) s.meta = meta
    },
    async listSessions(eventId) {
      return sessions.filter((s) => s.meta.eventId === eventId)
    },
    async deleteSession(_eventId, sessionId) {
      const i = sessions.findIndex((s) => s.meta.id === sessionId)
      if (i >= 0) sessions.splice(i, 1)
    },
    async print({ eventId, sessionId, copies }) {
      const job: PrintJob = {
        id: crypto.randomUUID(),
        eventId,
        sessionId,
        copies,
        status: 'impression',
        createdAt: new Date().toISOString()
      }
      jobs.push(job)
      setTimeout(() => (job.status = 'termine'), 12_400 * copies)
      return job
    },
    async printTestPage() {},
    async sendEmail({ email }) {
      console.info('[MIRA] e-mail simulé vers', email)
    },
    async getStatus() {
      return {
        printers: ['DNP DS-RX1 (simulée)'],
        printQueue: [...jobs].reverse(),
        diskFreeGb: null,
        galleryOrigin: 'https://galerie.mira.app',
        sessionsCount: sessions.length,
        printsCount: jobs.filter((j) => j.status === 'termine').reduce((n, j) => n + j.copies, 0),
        mode: 'web'
      }
    },
    async quit() {
      location.reload()
    }
  }
}

export const bridge: MiraBridge = window.mira ?? createWebBridge()
export const isElectron = !!window.mira
