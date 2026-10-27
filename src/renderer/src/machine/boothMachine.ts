// Parcours invité. Chaque état correspond à un écran ; il n'existe aucun état sans issue :
// tous mènent à « merci » puis « attente », directement ou via l'inactivité (RESET).
import type { ColorMode, FormatId, SavedSession } from '@shared/types'
import { assign, fromPromise, setup } from 'xstate'
import { getConfig } from '@/lib/config'

export const POSES: Record<FormatId, number> = { solo: 1, grille: 4, bandelettes: 4 }

export interface BoothContext {
  format: FormatId
  colorMode: ColorMode
  photos: string[]
  retakesLeft: number
  sessionId: string
  saved?: SavedSession
  copies: number
  email?: string
  consentGallery: boolean
  printed: number
}

export type BoothEvent =
  | { type: 'START' }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'CHOOSE_FORMAT'; format: FormatId }
  | { type: 'SET_COLOR'; mode: ColorMode }
  | { type: 'READY' }
  | { type: 'CAPTURED'; photo: string }
  | { type: 'CAPTURE_FAILED' }
  | { type: 'RETAKE' }
  | { type: 'VALIDATE' }
  | { type: 'SET_COPIES'; copies: number }
  | { type: 'OPEN_EMAIL' }
  | { type: 'EMAIL_SENT'; email: string }
  | { type: 'FINISH'; printed: number }
  | { type: 'CONSENT'; gallery: boolean }
  | { type: 'RESET' }

const newSessionId = (): string =>
  `${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}-${Math.random().toString(36).slice(2, 7)}`

/** Nouvelle séance, avec les réglages opérateur du moment. */
const fresh = (): BoothContext => ({
  format: 'solo',
  colorMode: 'couleur',
  photos: [],
  retakesLeft: getConfig().session.retakes,
  sessionId: newSessionId(),
  copies: Math.min(1, getConfig().session.maxCopies),
  consentGallery: false,
  printed: 0
})

export const boothMachine = setup({
  types: {
    context: {} as BoothContext,
    events: {} as BoothEvent
  },
  actors: {
    // Implémentations fournies par l'application (voir App.tsx) via `provide`.
    composeAndSave: fromPromise<SavedSession, BoothContext>(async () => {
      throw new Error('composeAndSave non fourni')
    }),
    finalize: fromPromise<void, BoothContext>(async () => {})
  },
  guards: {
    canRetake: ({ context }) => context.retakesLeft > 0
  }
}).createMachine({
  id: 'booth',
  context: fresh,
  initial: 'attente',
  on: {
    RESET: '.attente'
  },
  states: {
    attente: {
      entry: assign(() => fresh()),
      on: { START: 'accueil' }
    },
    accueil: {
      on: { NEXT: 'format' }
    },
    format: {
      on: {
        BACK: 'accueil',
        CHOOSE_FORMAT: { target: 'preparation', actions: assign({ format: ({ event }) => event.format }) }
      }
    },
    preparation: {
      entry: assign({ photos: [] }),
      on: {
        BACK: 'format',
        SET_COLOR: { actions: assign({ colorMode: ({ event }) => event.mode }) },
        READY: 'compte'
      }
    },
    compte: {
      on: {
        CAPTURED: [
          {
            guard: ({ context }) => context.photos.length + 1 < POSES[context.format],
            target: 'interlude',
            actions: assign({ photos: ({ context, event }) => [...context.photos, event.photo] })
          },
          { target: 'composition', actions: assign({ photos: ({ context, event }) => [...context.photos, event.photo] }) }
        ],
        CAPTURE_FAILED: 'erreurCamera'
      }
    },
    interlude: {
      after: { 2000: 'compte' }
    },
    erreurCamera: {
      // L'invité voit un message rassurant ; on retente la pose en cours.
      after: { 3000: 'compte' }
    },
    composition: {
      invoke: {
        src: 'composeAndSave',
        input: ({ context }) => context,
        onDone: { target: 'revue', actions: assign({ saved: ({ event }) => event.output }) },
        onError: 'erreurRendu'
      }
    },
    erreurRendu: {
      after: { 3000: 'composition' }
    },
    revue: {
      on: {
        VALIDATE: 'livraison',
        RETAKE: {
          guard: 'canRetake',
          target: 'preparation',
          actions: assign({ retakesLeft: ({ context }) => context.retakesLeft - 1, saved: undefined })
        }
      }
    },
    livraison: {
      on: {
        SET_COPIES: { actions: assign({ copies: ({ event }) => event.copies }) },
        OPEN_EMAIL: 'email',
        FINISH: { target: 'consentement', actions: assign({ printed: ({ event }) => event.printed }) }
      }
    },
    email: {
      on: {
        BACK: 'livraison',
        EMAIL_SENT: { target: 'livraison', actions: assign({ email: ({ event }) => event.email }) }
      }
    },
    consentement: {
      on: {
        CONSENT: { target: 'merci', actions: assign({ consentGallery: ({ event }) => event.gallery }) }
      }
    },
    merci: {
      invoke: { src: 'finalize', input: ({ context }) => context },
      after: { 8000: 'attente' },
      on: { START: 'attente' }
    }
  }
})

export type BoothState = 'attente' | 'accueil' | 'format' | 'preparation' | 'compte' | 'interlude'
  | 'erreurCamera' | 'erreurRendu' | 'composition' | 'revue' | 'livraison' | 'email' | 'consentement' | 'merci'
