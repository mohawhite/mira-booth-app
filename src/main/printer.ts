// File d'impression persistante. Deux pilotes en Phase 1 :
// - « mock »   : copie le fichier dans <data>/impressions-simulees et simule ~12 s par tirage (cadence DNP) ;
// - « system » : impression silencieuse via le pilote Windows (ex. DNP DS-RX1HS), sans boîte de dialogue.
// Le pilote DNP dédié (état papier/ruban, découpe 2") arrive en Phase 2.
import { BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { BoothConfig, PrintJob } from '../shared/types'
import { dataDir, sessionDir, writeJson } from './storage'

const SIMULATED_SECONDS_PER_PRINT = 12.4
const queueFile = (): string => join(dataDir(), 'print-queue.json')

let jobs: PrintJob[] = []
let running = false
let getConfig: () => BoothConfig

export async function initPrintQueue(configGetter: () => BoothConfig): Promise<void> {
  getConfig = configGetter
  try {
    jobs = JSON.parse(await fs.readFile(queueFile(), 'utf8')) as PrintJob[]
  } catch {
    jobs = []
  }
  // Un travail interrompu par un redémarrage repart en attente.
  for (const j of jobs) if (j.status === 'impression') j.status = 'en_attente'
  await persist()
  void pump()
}

async function persist(): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true })
  // On ne garde que l'historique récent pour que le fichier reste léger.
  jobs = jobs.slice(-500)
  await writeJson(queueFile(), jobs)
}

export const listJobs = (): PrintJob[] => jobs.slice(-50).reverse()
export const printedCount = (): number =>
  jobs.filter((j) => j.status === 'termine').reduce((n, j) => n + j.copies, 0)

export async function enqueue(eventId: string, sessionId: string, copies: number): Promise<PrintJob> {
  const job: PrintJob = {
    id: randomUUID(),
    eventId,
    sessionId,
    copies,
    status: 'en_attente',
    createdAt: new Date().toISOString()
  }
  jobs.push(job)
  await persist()
  void pump()
  return job
}

async function pump(): Promise<void> {
  if (running) return
  running = true
  try {
    let job: PrintJob | undefined
    while ((job = jobs.find((j) => j.status === 'en_attente'))) {
      job.status = 'impression'
      await persist()
      try {
        await printFile(join(sessionDir(job.eventId, job.sessionId), 'print.jpg'), job.copies)
        job.status = 'termine'
        job.error = undefined
      } catch (e) {
        job.status = 'erreur'
        job.error = e instanceof Error ? e.message : String(e)
      }
      await persist()
    }
  } finally {
    running = false
  }
}

export async function printFile(file: string, copies: number): Promise<void> {
  const cfg = getConfig().print
  if (cfg.driver === 'mock') {
    const out = join(dataDir(), 'impressions-simulees')
    await fs.mkdir(out, { recursive: true })
    await fs.copyFile(file, join(out, `${Date.now()}-x${copies}.jpg`))
    await new Promise((r) => setTimeout(r, SIMULATED_SECONDS_PER_PRINT * 1000 * copies))
    return
  }
  await systemPrint(file, copies, cfg.printerName)
}

/** Imprime une image plein cadre sur du 10×15 via le pilote Windows, sans dialogue. */
async function systemPrint(file: string, copies: number, deviceName: string): Promise<void> {
  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } })
  try {
    const html = `<!doctype html><html><head><style>
      @page { size: 152.4mm 101.6mm; margin: 0 }
      html,body { margin:0; padding:0; width:152.4mm; height:101.6mm; overflow:hidden }
      img { width:100%; height:100%; object-fit:cover; display:block }
    </style></head><body><img src="${pathToFileURL(file).href}"></body></html>`
    const tmp = join(dataDir(), 'print-page.html')
    await fs.writeFile(tmp, html, 'utf8')
    await win.loadFile(tmp)
    await new Promise<void>((resolve, reject) => {
      win.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: deviceName || undefined,
          copies,
          landscape: true,
          margins: { marginType: 'none' },
          pageSize: { width: 101600, height: 152400 } // microns, 4×6"
        },
        (ok, reason) => (ok ? resolve() : reject(new Error(reason || 'Échec de l’impression')))
      )
    })
  } finally {
    win.destroy()
  }
}
