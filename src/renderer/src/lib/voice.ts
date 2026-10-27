// Voix guide de la borne (fichiers MP3 générés avec ElevenLabs, voir docs/VOIX.md).
// Les fichiers vivent dans public/voix/<langue>/ ; s'il en manque, la borne reste simplement muette.
import type { Lang } from '@shared/types'
import { getConfig } from './config'

/** Moments du parcours où la voix intervient, et leurs variantes (tirées au hasard). */
export const VOICE_CUES = {
  accueil: ['accueil-1', 'accueil-2'],
  regard: ['regard-1', 'regard-2'],
  pose: ['pose-1', 'pose-2', 'pose-3'],
  revue: ['revue'],
  impression: ['impression'],
  merci: ['merci']
} as const

export type VoiceCue = keyof typeof VOICE_CUES

const ALL_FILES = Object.values(VOICE_CUES).flat()
const lastPlayed: Partial<Record<VoiceCue, string>> = {}
let current: HTMLAudioElement | undefined
let pending: number | undefined

const fileUrl = (lang: Lang, name: string): string => new URL(`voix/${lang}/${name}.mp3`, document.baseURI).href

/** Variante au hasard, en évitant de répéter la précédente. */
function pick(cue: VoiceCue): string {
  const options: readonly string[] = VOICE_CUES[cue]
  const others = options.length > 1 ? options.filter((n) => n !== lastPlayed[cue]) : options
  const name = others[Math.floor(Math.random() * others.length)]
  lastPlayed[cue] = name
  return name
}

export function stopVoice(): void {
  window.clearTimeout(pending)
  current?.pause()
  current = undefined
}

/** Joue une phrase. Une nouvelle phrase coupe la précédente. */
export function say(cue: VoiceCue, delayMs = 0): void {
  const { voice, voiceVolume } = getConfig().system
  if (!voice) return
  stopVoice()
  const play = (): void => {
    const audio = new Audio(fileUrl(getConfig().system.lang, pick(cue)))
    audio.volume = voiceVolume
    current = audio
    audio.play().catch(() => {
      /* fichier absent ou lecture refusée : on reste muet */
    })
  }
  if (delayMs) pending = window.setTimeout(play, delayMs)
  else play()
}

/** Exemple pour l'espace opérateur : joue même si la voix est désactivée, au volume indiqué. */
export function previewVoice(lang: Lang, volume: number): void {
  stopVoice()
  const audio = new Audio(fileUrl(lang, pick('accueil')))
  audio.volume = volume
  current = audio
  audio.play().catch(() => {})
}

/** Nombre de fichiers voix présents pour une langue (affiché dans l'espace opérateur). */
export async function countVoiceFiles(lang: Lang): Promise<{ found: number; total: number }> {
  const results = await Promise.all(
    ALL_FILES.map(
      (name) =>
        new Promise<boolean>((resolve) => {
          const audio = new Audio()
          audio.preload = 'metadata'
          audio.onloadedmetadata = () => resolve(true)
          audio.onerror = () => resolve(false)
          audio.src = fileUrl(lang, name)
        })
    )
  )
  return { found: results.filter(Boolean).length, total: ALL_FILES.length }
}
