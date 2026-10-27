import { Button } from '@/components/Button'
import { Halo } from '@/components/Halo'
import { Screen } from '@/components/Screen'
import { useLang, useT } from '@/i18n'
import { useConfig } from '@/lib/config'
import type { ScreenProps } from './types'

export function Accueil({ send }: ScreenProps) {
  const t = useT()
  const event = useConfig((s) => s.config.event)
  const { lang, setLang } = useLang()
  return (
    <Screen className="accueil">
      <div className="accueil-halo"><Halo size={200} /></div>
      <p className="eyebrow">{event.name}</p>
      <h1 className="display accueil-title">{event.welcome}</h1>
      <p className="accueil-hint muted">{t('welcome.hint')}</p>
      <Button onClick={() => send({ type: 'NEXT' })} className="accueil-cta">{t('welcome.cta')}</Button>

      <div className="lang-switch" role="group" aria-label="Langue">
        {(['fr', 'en'] as const).map((l) => (
          <button key={l} type="button" className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </Screen>
  )
}
