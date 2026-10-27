import { Halo } from '@/components/Halo'
import { Screen } from '@/components/Screen'
import { useT, type TKey } from '@/i18n'

/** Écran d'attente courte (rendu, incident caméra) : jamais de jargon technique pour l'invité. */
export function Status({ message }: { message: TKey }) {
  const t = useT()
  return (
    <Screen className="status">
      <Halo size={220} intense />
      <h2 className="display status-text">{t(message)}</h2>
    </Screen>
  )
}
