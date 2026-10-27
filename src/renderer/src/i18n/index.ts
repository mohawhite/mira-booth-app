import type { Lang } from '@shared/types'
import { create } from 'zustand'
import { en } from './en'
import { fr, type Dict } from './fr'

const dicts: Record<Lang, Dict> = { fr, en }

export type TKey = keyof Dict

/** Langue de la session en cours : l'invité peut la changer, elle revient à la langue par défaut ensuite. */
export const useLang = create<{ lang: Lang; setLang(l: Lang): void }>((set) => ({
  lang: 'fr',
  setLang: (lang) => set({ lang })
}))

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let s = dicts[lang][key] ?? fr[key]
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}

export function useT(): (key: TKey, vars?: Record<string, string | number>) => string {
  const lang = useLang((s) => s.lang)
  return (key, vars) => translate(lang, key, vars)
}
