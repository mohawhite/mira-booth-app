import { Button } from '@/components/Button'
import { Screen } from '@/components/Screen'
import { useT } from '@/i18n'
import type { ScreenProps } from './types'

/** Consentement explicite, rien de pré-coché : par défaut, la photo reste privée. */
export function Consentement({ send }: ScreenProps) {
  const t = useT()
  return (
    <Screen className="consentement">
      <h2 className="display consentement-title">{t('consent.title')}</h2>
      <p className="muted">{t('consent.hint')}</p>
      <div className="consentement-actions">
        <Button variant="secondary" onClick={() => send({ type: 'CONSENT', gallery: false })}>{t('consent.no')}</Button>
        <Button onClick={() => send({ type: 'CONSENT', gallery: true })}>{t('consent.yes')}</Button>
      </div>
    </Screen>
  )
}
