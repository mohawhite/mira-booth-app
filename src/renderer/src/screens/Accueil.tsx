import { Button } from '@/components/Button'
import { Halo } from '@/components/Halo'
import { Screen } from '@/components/Screen'
import { useT } from '@/i18n'
import { useConfig } from '@/lib/config'
import type { ScreenProps } from './types'

export function Accueil({ send }: ScreenProps) {
  const t = useT()
  const event = useConfig((s) => s.config.event)
  return (
    <Screen className="accueil">
      <div className="accueil-halo"><Halo size={200} /></div>
      <p className="eyebrow">{event.name}</p>
      <h1 className="display accueil-title">{event.welcome}</h1>
      <p className="accueil-hint muted">{t('welcome.hint')}</p>
      <Button onClick={() => send({ type: 'NEXT' })} className="accueil-cta">{t('welcome.cta')}</Button>
    </Screen>
  )
}
