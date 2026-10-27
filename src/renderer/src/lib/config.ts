import { DEFAULT_CONFIG } from '@shared/defaults'
import type { BoothConfig } from '@shared/types'
import { create } from 'zustand'
import { bridge } from './bridge'

interface ConfigState {
  config: BoothConfig
  loaded: boolean
  load(): Promise<void>
  save(next: BoothConfig): Promise<void>
}

export const useConfig = create<ConfigState>((set) => ({
  config: DEFAULT_CONFIG,
  loaded: false,
  async load() {
    set({ config: await bridge.getConfig(), loaded: true })
  },
  async save(next) {
    set({ config: next })
    await bridge.saveConfig(next)
  }
}))

/** Accès hors React (ex. acteurs de la machine à états). */
export const getConfig = (): BoothConfig => useConfig.getState().config
