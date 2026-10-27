// Génère les fichiers de la voix MIRA avec l'API Fish Audio.
// À lancer sur votre PC (Node.js 22), avec votre propre clé API :
//
//   Windows (PowerShell) :
//     $env:FISH_API_KEY="votre_cle"; $env:FISH_VOICE_ID="id_de_la_voix"; node scripts/generer-voix.mjs
//   macOS / Linux :
//     FISH_API_KEY=votre_cle FISH_VOICE_ID=id_de_la_voix node scripts/generer-voix.mjs
//
// Options :
//   FISH_MODEL   modèle Fish Audio (défaut : s2-pro ; essayez « s1 » en cas d'erreur)
//   LANGS        langues à générer, séparées par des virgules (défaut : fr)
//   FORCE=1      régénère les fichiers déjà présents
//
// Les fichiers sont écrits dans src/renderer/public/voix/<langue>/<nom>.mp3.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const phrases = JSON.parse(readFileSync(join(root, 'scripts/voix-phrases.json'), 'utf8'))

const apiKey = process.env.FISH_API_KEY
const voiceId = process.env.FISH_VOICE_ID
const model = process.env.FISH_MODEL || 's2-pro'
const langs = (process.env.LANGS || 'fr').split(',').map((l) => l.trim())
const force = process.env.FORCE === '1'

if (!apiKey || !voiceId) {
  console.error('Il manque FISH_API_KEY et/ou FISH_VOICE_ID (voir l’en-tête de ce fichier).')
  process.exit(1)
}

async function tts(text) {
  const res = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      model
    },
    body: JSON.stringify({ text, reference_id: voiceId, format: 'mp3', normalize: true })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} : ${(await res.text()).slice(0, 300)}`)
  return Buffer.from(await res.arrayBuffer())
}

let failed = 0
for (const lang of langs) {
  const list = phrases[lang]
  if (!list) {
    console.warn(`Langue inconnue : ${lang}`)
    continue
  }
  const dir = join(root, 'src/renderer/public/voix', lang)
  mkdirSync(dir, { recursive: true })
  for (const [name, text] of Object.entries(list)) {
    const file = join(dir, `${name}.mp3`)
    if (existsSync(file) && !force) {
      console.log(`= ${lang}/${name}.mp3 (déjà présent)`)
      continue
    }
    try {
      writeFileSync(file, await tts(text))
      console.log(`✓ ${lang}/${name}.mp3`)
    } catch (e) {
      failed++
      console.error(`✗ ${lang}/${name}.mp3 — ${e.message}`)
    }
  }
}
process.exit(failed ? 1 : 0)
