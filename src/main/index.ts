import { app, BrowserWindow, ipcMain, powerSaveBlocker, session as electronSession } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { BoothConfig, BoothStatus, SessionMeta } from '../shared/types'
import { lanOrigin, localOrigin, startGalleryServer, stopGalleryServer } from './gallery'
import { enqueue, initPrintQueue, listJobs, printedCount, printFile } from './printer'
import * as storage from './storage'

const isDev = !app.isPackaged && !!process.env['ELECTRON_RENDERER_URL']
// Plein écran verrouillé en production ; désactivable avec MIRA_KIOSK=0 pour le développement.
const kiosk = process.env['MIRA_KIOSK'] ? process.env['MIRA_KIOSK'] === '1' : app.isPackaged

let mainWindow: BrowserWindow | undefined
let config: BoothConfig

function galleryOrigin(): string {
  return config.system.galleryBaseUrl.replace(/\/$/, '') || lanOrigin()
}

const galleryUrl = (eventId: string, sessionId: string): string =>
  `${galleryOrigin()}/s/${eventId}/${sessionId}`
const compositeUrl = (eventId: string, sessionId: string): string =>
  `${localOrigin()}/files/${eventId}/${sessionId}/composite.jpg`

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    kiosk,
    fullscreen: kiosk,
    frame: !kiosk,
    autoHideMenuBar: true,
    backgroundColor: '#0A0A0A',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false
    }
  })
  mainWindow.once('ready-to-show', () => mainWindow?.show())

  // Watchdog : si l'interface plante, on la recharge au lieu de laisser un écran figé.
  mainWindow.webContents.on('render-process-gone', () => mainWindow?.reload())
  mainWindow.webContents.on('unresponsive', () => mainWindow?.reload())

  if (isDev) void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']!)
  else void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
}

function registerIpc(): void {
  ipcMain.handle('config:get', () => config)
  ipcMain.handle('config:save', async (_e, next: BoothConfig) => {
    config = next
    await storage.saveConfig(next)
  })

  ipcMain.handle(
    'session:save',
    async (_e, input: { meta: SessionMeta; photos: string[]; composite: string; printImage: string }) => {
      await storage.saveSessionFiles(input.meta, input.photos, input.composite, input.printImage)
      return {
        meta: input.meta,
        galleryUrl: galleryUrl(input.meta.eventId, input.meta.id),
        compositeUrl: compositeUrl(input.meta.eventId, input.meta.id)
      }
    }
  )
  ipcMain.handle('session:update', (_e, meta: SessionMeta) => storage.writeMeta(meta))
  ipcMain.handle('session:list', async (_e, eventId: string) =>
    (await storage.listMetas(eventId)).map((meta) => ({
      meta,
      galleryUrl: galleryUrl(meta.eventId, meta.id),
      compositeUrl: compositeUrl(meta.eventId, meta.id)
    }))
  )
  ipcMain.handle('session:delete', (_e, eventId: string, sessionId: string) =>
    storage.deleteSessionFiles(eventId, sessionId)
  )

  ipcMain.handle('print:enqueue', (_e, i: { eventId: string; sessionId: string; copies: number }) =>
    enqueue(i.eventId, i.sessionId, i.copies)
  )
  ipcMain.handle('print:test', async (_e, dataUrl: string) => {
    const file = join(storage.dataDir(), 'page-test.jpg')
    await fs.writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'))
    await printFile(file, 1)
  })

  ipcMain.handle('email:send', (_e, i: { eventId: string; sessionId: string; email: string }) =>
    storage.queueEmail(i)
  )

  ipcMain.handle('status:get', async (): Promise<BoothStatus> => {
    const printers = mainWindow ? (await mainWindow.webContents.getPrintersAsync()).map((p) => p.name) : []
    return {
      printers,
      printQueue: listJobs(),
      diskFreeGb: await storage.diskFreeGb(),
      galleryOrigin: galleryOrigin(),
      sessionsCount: (await storage.listMetas(config.event.id)).length,
      printsCount: printedCount(),
      mode: 'electron'
    }
  })

  ipcMain.handle('app:quit', () => app.quit())
}

// Une seule instance de la borne à la fois.
if (!app.requestSingleInstanceLock()) app.quit()

app.whenReady().then(async () => {
  config = await storage.loadConfig()
  await fs.mkdir(storage.eventsDir(), { recursive: true })

  // Autorise la caméra pour l'interface de la borne uniquement.
  electronSession.defaultSession.setPermissionRequestHandler((_wc, permission, cb) =>
    cb(permission === 'media')
  )
  // Empêche la mise en veille de l'écran pendant un événement.
  powerSaveBlocker.start('prevent-display-sleep')

  startGalleryServer(() => config.event.name)
  await initPrintQueue(() => config)
  registerIpc()
  createWindow()
})

app.on('window-all-closed', () => {
  stopGalleryServer()
  app.quit()
})
