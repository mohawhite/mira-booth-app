/// <reference types="vite/client" />
import type { MiraBridge } from '@shared/types'

declare global {
  interface Window {
    mira?: MiraBridge
  }
}
