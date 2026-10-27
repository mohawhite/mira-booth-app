import { BackButton, Button } from '@/components/Button'
import { LiveView } from '@/components/LiveView'
import { Screen } from '@/components/Screen'
import { useT } from '@/i18n'
import type { ScreenProps } from './types'

export function Preparation({ ctx, send }: ScreenProps) {
  const t = useT()
  return (
    <Screen className="preparation">
      <BackButton label={t('common.back')} onClick={() => send({ type: 'BACK' })} />
      <div className="preparation-live">
        <LiveView width={1110} colorMode={ctx.colorMode} />
      </div>
      <aside className="preparation-side">
        <p className="eyebrow">{t(`format.${ctx.format}`)} · {t(`format.${ctx.format}.desc`)}</p>
        <h2 className="display">{t('prep.title')}</h2>
        <p className="muted">{t('prep.hint')}</p>
        <div className="segmented" role="group">
          {(['couleur', 'nb'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={ctx.colorMode === m ? 'active' : ''}
              onClick={() => {
                send({ type: 'SET_COLOR', mode: m })
              }}
            >
              {t(m === 'couleur' ? 'prep.color' : 'prep.bw')}
            </button>
          ))}
        </div>
        <Button onClick={() => send({ type: 'READY' })}>{t('prep.ready')}</Button>
      </aside>
    </Screen>
  )
}
