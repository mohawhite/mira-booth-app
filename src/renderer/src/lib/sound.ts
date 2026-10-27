// Sons feutrés, synthétisés à la volée (aucun fichier audio à embarquer).
import { getConfig } from './config'

let ctx: AudioContext | undefined
const audio = (): AudioContext => (ctx ??= new AudioContext())

function tone(freq: number, duration: number, gain = 0.08, type: OscillatorType = 'sine', delay = 0): void {
  const a = audio()
  const t = a.currentTime + delay
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(g).connect(a.destination)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

function shutter(): void {
  const a = audio()
  const len = Math.floor(a.sampleRate * 0.12)
  const buffer = a.createBuffer(1, len, a.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const src = a.createBufferSource()
  const g = a.createGain()
  const filter = a.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 1200
  g.gain.value = 0.25
  src.buffer = buffer
  src.connect(filter).connect(g).connect(a.destination)
  src.start()
}

const sounds = {
  tap: () => tone(880, 0.08, 0.04),
  tick: () => tone(1046, 0.12, 0.06),
  shutter,
  success: () => {
    tone(784, 0.5, 0.05, 'sine', 0)
    tone(1175, 0.7, 0.04, 'sine', 0.12)
  }
}

export function play(name: keyof typeof sounds): void {
  if (!getConfig().system.sounds) return
  try {
    sounds[name]()
  } catch {
    /* l'audio n'est pas critique */
  }
}
