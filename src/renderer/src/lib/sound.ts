// Sons discrets, synthétisés à la volée (aucun fichier audio à embarquer).
// Tout passe par un filtre passe-bas commun : pas d'aigus agressifs dans une salle de réception.
// Les touches de l'interface sont silencieuses ; seuls le compte à rebours, le déclenchement
// et la fin de séance ont un son.
import { getConfig } from './config'

let ctx: AudioContext | undefined
let bus: AudioNode | undefined

function output(): [AudioContext, AudioNode] {
  if (!ctx || !bus) {
    ctx = new AudioContext()
    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 3200
    const master = ctx.createGain()
    master.gain.value = 0.7
    lowpass.connect(master).connect(ctx.destination)
    bus = lowpass
  }
  return [ctx, bus]
}

/** Note douce, attaque progressive et longue extinction (timbre proche d'un carillon feutré). */
function note(freq: number, { at = 0, duration = 1.2, gain = 0.05 } = {}): void {
  const [a, out] = output()
  const t = a.currentTime + at
  const g = a.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  g.connect(out)
  // Fondamentale + octave très légère pour un son rond, sans « bip ».
  for (const [mult, level] of [[1, 1], [2, 0.18]] as const) {
    const osc = a.createOscillator()
    const og = a.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq * mult
    og.gain.value = level
    osc.connect(og).connect(g)
    osc.start(t)
    osc.stop(t + duration + 0.05)
  }
}

/** Court bruit filtré : un « clic » mécanique. */
function click(at: number, freq: number, gain: number, length = 0.035): void {
  const [a, out] = output()
  const t = a.currentTime + at
  const len = Math.floor(a.sampleRate * length)
  const buffer = a.createBuffer(1, len, a.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4)
  const src = a.createBufferSource()
  const band = a.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = freq
  band.Q.value = 1.2
  const g = a.createGain()
  g.gain.value = gain
  src.buffer = buffer
  src.connect(band).connect(g).connect(out)
  src.start(t)
}

const sounds = {
  // Compte à rebours : un battement boisé, presque une horloge.
  tick: () => click(0, 1400, 0.35, 0.025),
  // Déclencheur d'appareil reflex : miroir qui monte, puis qui redescend.
  shutter: () => {
    click(0, 2200, 0.5, 0.04)
    click(0.07, 1600, 0.4, 0.05)
  },
  // Fin de séance : deux notes douces (quinte), sans éclat.
  success: () => {
    note(523.25, { duration: 1.4, gain: 0.08 })
    note(783.99, { at: 0.16, duration: 1.6, gain: 0.06 })
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
