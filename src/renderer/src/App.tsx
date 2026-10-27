import { useMachine } from '@xstate/react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fromPromise } from 'xstate'
import { Admin } from './admin/Admin'
import { AdminCorner } from './admin/AdminGate'
import { IdleGuard } from './components/IdleGuard'
import { Stage } from './components/Stage'
import { bridge, isElectron } from './lib/bridge'
import { getConfig, useConfig } from './lib/config'
import { say, stopVoice } from './lib/voice'
import { boothMachine, type BoothContext, type BoothState } from './machine/boothMachine'
import { compose } from './render/compose'
import { Accueil } from './screens/Accueil'
import { Attente } from './screens/Attente'
import { Compte, Interlude } from './screens/Capture'
import { Consentement } from './screens/Consentement'
import { Email } from './screens/Email'
import { Format } from './screens/Format'
import { Livraison } from './screens/Livraison'
import { Merci } from './screens/Merci'
import { Preparation } from './screens/Preparation'
import { Revue } from './screens/Revue'
import { Status } from './screens/Status'
import type { SessionMeta } from '@shared/types'

const toMeta = (ctx: BoothContext): SessionMeta => ({
  id: ctx.sessionId,
  eventId: getConfig().event.id,
  createdAt: ctx.saved?.meta.createdAt ?? new Date().toISOString(),
  format: ctx.format,
  colorMode: ctx.colorMode,
  photoCount: ctx.photos.length,
  copiesPrinted: ctx.printed,
  email: ctx.email,
  consentGallery: ctx.consentGallery,
  consentEmail: !!ctx.email
})

const machine = boothMachine.provide({
  actors: {
    composeAndSave: fromPromise(async ({ input }: { input: BoothContext }) => {
      const config = getConfig()
      const { composite, printImage } = await compose(input.format, input.photos, config, input.colorMode)
      return bridge.saveSession({ meta: toMeta(input), photos: input.photos, composite, printImage })
    }),
    finalize: fromPromise(async ({ input }: { input: BoothContext }) => {
      if (input.saved) await bridge.updateSession(toMeta(input))
    })
  }
})

/** États pendant lesquels l'invité interagit : l'inactivité y ramène à l'accueil. */
const IDLE_STATES: BoothState[] = ['accueil', 'format', 'preparation', 'revue', 'livraison', 'email', 'consentement']

function Booth() {
  const config = useConfig((s) => s.config)
  const [snapshot, send] = useMachine(machine)
  const [admin, setAdmin] = useState(false)
  const state = snapshot.value as BoothState
  const ctx = snapshot.context

  // Voix guide : une phrase à l'entrée de certains écrans.
  const previous = useRef<BoothState>(state)
  useEffect(() => {
    const from = previous.current
    previous.current = state
    if (from === state) return
    if (state === 'attente') stopVoice()
    else if (state === 'format' && from === 'accueil') say('accueil')
    else if (state === 'compte' && ctx.photos.length === 0) say('regard')
    else if (state === 'interlude') say('pose')
    else if (state === 'revue') say('revue', 600)
    // Laisse d'abord sonner le carillon de fin.
    else if (state === 'merci') say(ctx.printed > 0 ? 'impression' : 'merci', 700)
  }, [state, ctx.photos.length, ctx.printed])

  const reset = useCallback(() => send({ type: 'RESET' }), [send])
  const props = { ctx, send }

  const screen = (() => {
    switch (state) {
      case 'attente': return <Attente {...props} />
      case 'accueil': return <Accueil {...props} />
      case 'format': return <Format {...props} />
      case 'preparation': return <Preparation {...props} />
      case 'compte': return <Compte {...props} />
      case 'interlude': return <Interlude {...props} />
      case 'erreurCamera':
      case 'erreurRendu': return <Status message="error.camera" />
      case 'composition': return <Status message="composing" />
      case 'revue': return <Revue {...props} />
      case 'livraison': return <Livraison {...props} />
      case 'email': return <Email {...props} />
      case 'consentement': return <Consentement {...props} />
      case 'merci': return <Merci {...props} />
    }
  })()

  // Chaque pose a sa propre clé : le compte à rebours repart de zéro.
  const key = state === 'compte' ? `compte-${ctx.photos.length}-${ctx.retakesLeft}` : state

  if (admin) return <Admin onClose={() => setAdmin(false)} />

  return (
    <>
      <AnimatePresence mode="wait">
        <div key={key} className="screen-slot">{screen}</div>
      </AnimatePresence>
      <IdleGuard active={IDLE_STATES.includes(state)} seconds={config.session.inactivitySeconds} onTimeout={reset} />
      <AdminCorner enabled={state === 'attente' || state === 'accueil'} onUnlock={() => setAdmin(true)} />
    </>
  )
}

export function App() {
  const { loaded, load } = useConfig()
  useEffect(() => {
    void load()
    if (isElectron) document.body.classList.add('kiosk-cursor-hidden')
  }, [load])
  return <Stage>{loaded && <Booth />}</Stage>
}
