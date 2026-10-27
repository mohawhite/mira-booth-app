import { useConfig } from '@/lib/config'
import type { Lang } from '@shared/types'
import { en } from './en'
import { fr, type Dict } from './fr'

const dicts: Record<Lang, Dict> = { fr, en }

export type TKey = keyof Dict

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let s = dicts[lang][key] ?? fr[key]
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}

export function useT(): (key: TKey, vars?: Record<string, string | number>) => string {
  // La langue de la borne se choisit dans l'espace opérateur, pas par l'invité.
  const lang = useConfig((s) => s.config.system.lang)
  return (key, vars) => translate(lang, key, vars)
}
