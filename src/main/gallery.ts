// Mini-serveur local : sert les images à l'interface et une page galerie par session
// (cible du QR code). Les téléphones doivent être sur le même réseau que la borne ;
// en Phase 2, la galerie passera par le cloud.
import { createReadStream, promises as fs } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { networkInterfaces } from 'node:os'
import { join } from 'node:path'
import { readMeta, safe, sessionDir } from './storage'

export const GALLERY_PORT = 8765

let server: Server | undefined

export function lanAddress(): string {
  for (const list of Object.values(networkInterfaces())) {
    for (const ni of list ?? []) {
      if (ni.family === 'IPv4' && !ni.internal) return ni.address
    }
  }
  return '127.0.0.1'
}

export const localOrigin = (): string => `http://127.0.0.1:${GALLERY_PORT}`
export const lanOrigin = (): string => `http://${lanAddress()}:${GALLERY_PORT}`

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function galleryPage(eventName: string, eventId: string, sessionId: string): string {
  const img = `/files/${eventId}/${sessionId}/composite.jpg`
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(eventName)} — MIRA</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;background:#0A0A0A;color:#FAFAFA;font-family:system-ui,sans-serif;
       display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px 16px;min-height:100vh;box-sizing:border-box}
  .brand{font-family:Georgia,serif;letter-spacing:.5em;font-size:14px;opacity:.6}
  h1{font-family:Georgia,serif;font-weight:400;font-size:32px;margin:0;text-align:center}
  img{width:100%;max-width:720px;border-radius:6px;box-shadow:0 24px 64px rgba(0,0,0,.6)}
  a{display:inline-block;padding:16px 32px;border:1px solid #FAFAFA;border-radius:999px;color:#FAFAFA;
    text-decoration:none;letter-spacing:.08em}
</style></head><body>
<div class="brand">M I R A</div>
<h1>${escapeHtml(eventName)}</h1>
<img src="${img}" alt="Votre photo">
<a href="${img}" download="mira-${sessionId}.jpg">Télécharger</a>
</body></html>`
}

export function startGalleryServer(getEventName: () => string): void {
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const parts = url.pathname.split('/').filter(Boolean)

      if (parts[0] === 'files' && parts.length === 4) {
        const [, eventId, sessionId, file] = parts
        if (!/^(composite|photo-\d+)\.jpg$/.test(file)) throw new Error('404')
        const path = join(sessionDir(eventId, sessionId), file)
        await fs.access(path)
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*'
        })
        createReadStream(path).pipe(res)
        return
      }

      if (parts[0] === 's' && parts.length === 3) {
        const [, eventId, sessionId] = parts
        const meta = await readMeta(safe(eventId), safe(sessionId))
        if (!meta) throw new Error('404')
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(galleryPage(getEventName(), eventId, sessionId))
        return
      }
      throw new Error('404')
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Introuvable')
    }
  })
  server.listen(GALLERY_PORT, '0.0.0.0')
}

export function stopGalleryServer(): void {
  server?.close()
}
