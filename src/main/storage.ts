// Stockage local : configuration, sessions et photos.
// Arborescence : <userData>/events/<eventId>/<sessionId>/{meta.json, photo-N.jpg, composite.jpg, print.jpg}
// composite.jpg = image partagée (galerie, QR) ; print.jpg = planche 10×15 avec fond perdu.
import { app } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { withDefaults } from '../shared/defaults'
import type { BoothConfig, SessionMeta } from '../shared/types'

export const dataDir = (): string => join(app.getPath('userData'), 'mira')
export const eventsDir = (): string => join(dataDir(), 'events')
export const sessionDir = (eventId: string, sessionId: string): string =>
  join(eventsDir(), safe(eventId), safe(sessionId))

/** Empêche toute sortie du dossier de données via un identifiant forgé. */
export function safe(id: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new Error(`Identifiant invalide : ${id}`)
  return id
}

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T
  } catch {
    return undefined
  }
}

/** Écriture atomique : un crash pendant l'écriture ne corrompt pas le fichier. */
export async function writeJson(file: string, value: unknown): Promise<void> {
  const tmp = `${file}.tmp`
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8')
  await fs.rename(tmp, file)
}

const configFile = (): string => join(dataDir(), 'config.json')

export async function loadConfig(): Promise<BoothConfig> {
  return withDefaults(await readJson<Partial<BoothConfig>>(configFile()))
}

export async function saveConfig(config: BoothConfig): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true })
  await writeJson(configFile(), config)
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const match = /^data:image\/(jpeg|png);base64,(.+)$/.exec(dataUrl)
  if (!match) throw new Error('Image invalide')
  return Buffer.from(match[2], 'base64')
}

export async function saveSessionFiles(
  meta: SessionMeta,
  photos: string[],
  composite: string,
  printImage: string
): Promise<void> {
  const dir = sessionDir(meta.eventId, meta.id)
  await fs.mkdir(dir, { recursive: true })
  await Promise.all(
    photos.map((p, i) => fs.writeFile(join(dir, `photo-${i + 1}.jpg`), dataUrlToBuffer(p)))
  )
  await fs.writeFile(join(dir, 'composite.jpg'), dataUrlToBuffer(composite))
  await fs.writeFile(join(dir, 'print.jpg'), dataUrlToBuffer(printImage))
  await writeJson(join(dir, 'meta.json'), meta)
}

export async function writeMeta(meta: SessionMeta): Promise<void> {
  await writeJson(join(sessionDir(meta.eventId, meta.id), 'meta.json'), meta)
}

export async function readMeta(eventId: string, sessionId: string): Promise<SessionMeta | undefined> {
  return readJson<SessionMeta>(join(sessionDir(eventId, sessionId), 'meta.json'))
}

export async function listMetas(eventId: string): Promise<SessionMeta[]> {
  const dir = join(eventsDir(), safe(eventId))
  let names: string[] = []
  try {
    names = await fs.readdir(dir)
  } catch {
    return []
  }
  const metas = await Promise.all(names.map((n) => readJson<SessionMeta>(join(dir, n, 'meta.json'))))
  return metas
    .filter((m): m is SessionMeta => !!m)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function deleteSessionFiles(eventId: string, sessionId: string): Promise<void> {
  await fs.rm(sessionDir(eventId, sessionId), { recursive: true, force: true })
}

/** Phase 1 : les e-mails ne partent pas, ils sont consignés dans une boîte d'envoi locale. */
export async function queueEmail(entry: { eventId: string; sessionId: string; email: string }): Promise<void> {
  const file = join(dataDir(), 'outbox.json')
  const outbox = (await readJson<unknown[]>(file)) ?? []
  outbox.push({ ...entry, queuedAt: new Date().toISOString(), status: 'simulé' })
  await writeJson(file, outbox)
}

export async function diskFreeGb(): Promise<number | null> {
  try {
    const s = await fs.statfs(dataDir())
    return Math.round(((s.bavail * s.bsize) / 1024 ** 3) * 10) / 10
  } catch {
    return null
  }
}
