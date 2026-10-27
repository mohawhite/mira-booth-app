// Génère les fichiers de la voix MIRA avec l'API ElevenLabs.
// À lancer sur votre PC (Node.js 22), avec votre propre clé API :
//
//   Windows (PowerShell) :
//     $env:ELEVENLABS_API_KEY="votre_cle"; npm run voix
//   macOS / Linux :
//     ELEVENLABS_API_KEY=votre_cle npm run voix
//
// Options :
//   ELEVENLABS_VOICE_ID  autre voix (défaut : Victoria)
//   ELEVENLABS_MODEL  modèle (défaut : eleven_multilingual_v2, très bon en français)
//   LANGS             langues à générer, séparées par des virgules (défaut : fr)
//   FORCE=1           régénère les fichiers déjà présents
//
// Les textes sont dans scripts/voix-phrases.json ; les fichiers sont écrits dans
// src/renderer/public/voix/<langue>/<nom>.mp3.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const phrases = JSON.parse(readFileSync(join(root, 'scripts/voix-phrases.json'), 'utf8'))

const apiKey = process.env.ELEVENLABS_API_KEY
// Voix par défaut : Victoria – Warm and calm (française, accent parisien).
const voiceId = process.env.ELEVENLABS_VOICE_ID || 'WeAAwKYcS06VmXw086yZ'
const model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2'
const langs = (process.env.LANGS || 'fr').split(',').map((l) => l.trim())
const force = process.env.FORCE === '1'

if (!apiKey) {
  console.error('Il manque ELEVENLABS_API_KEY (voir l’en-tête de ce fichier).')
  process.exit(1)
}

async function tts(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: model,
      // Voix posée et régulière : stabilité assez haute, peu d'exagération.
      voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true }
    })
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
