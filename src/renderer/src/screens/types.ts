import type { BoothContext, BoothEvent } from '@/machine/boothMachine'

export interface ScreenProps {
  ctx: BoothContext
  send: (event: BoothEvent) => void
}
