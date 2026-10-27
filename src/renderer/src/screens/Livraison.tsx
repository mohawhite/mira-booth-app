import { useState } from 'react'
import { Button } from '@/components/Button'
import { IconCheck, IconMail, IconMinus, IconPlus, IconPrint } from '@/components/Icons'
import { QrCode } from '@/components/QrCode'
import { Screen } from '@/components/Screen'
import { useT } from '@/i18n'
import { bridge } from '@/lib/bridge'
import { useConfig } from '@/lib/config'
import type { ScreenProps } from './types'

export function Livraison({ ctx, send }: ScreenProps) {
  const t = useT()
  const maxCopies = useConfig((s) => s.config.session.maxCopies)
  const [busy, setBusy] = useState(false)
  const saved = ctx.saved
  if (!saved) return null

  const setCopies = (n: number): void => {
    send({ type: 'SET_COPIES', copies: Math.max(0, Math.min(maxCopies, n)) })
  }

  const finish = async (): Promise<void> => {
    if (busy) return
    setBusy(true)
    let printed = 0
    if (ctx.copies > 0) {
      try {
        await bridge.print({ eventId: saved.meta.eventId, sessionId: saved.meta.id, copies: ctx.copies })
        printed = ctx.copies
      } catch {
        /* l'opérateur verra l'erreur dans la file d'impression */
      }
    }
    send({ type: 'FINISH', printed })
  }

  return (
    <Screen className="livraison">
      <h2 className="display screen-title">{t('delivery.title')}</h2>
      <div className="livraison-grid">
        <div className="livraison-preview">
          <img src={saved.compositeUrl} alt="" className={`print-preview ${ctx.format === 'bandelettes' ? 'print-preview-strip' : ''}`} />
        </div>

        {maxCopies > 0 && (
          <div className="card livraison-print">
            <IconPrint size={56} />
            <p className="eyebrow">{t('delivery.print')}</p>
            <div className="stepper">
              <button type="button" aria-label="-" onClick={() => setCopies(ctx.copies - 1)} disabled={ctx.copies <= 0}>
                <IconMinus size={40} />
              </button>
              <span className="numeral stepper-value">{ctx.copies}</span>
              <button type="button" aria-label="+" onClick={() => setCopies(ctx.copies + 1)} disabled={ctx.copies >= maxCopies}>
                <IconPlus size={40} />
              </button>
            </div>
            <p className="muted">{ctx.copies === 0 ? t('delivery.noPrint') : t('delivery.copies')}</p>
          </div>
        )}

        <div className="card livraison-digital">
          <QrCode value={saved.galleryUrl} size={260} />
          <p className="livraison-qr-label">{t('delivery.qr')}</p>
          {ctx.email ? (
            <p className="eyebrow livraison-sent"><IconCheck size={28} /> {t('delivery.emailSent', { email: ctx.email })}</p>
          ) : (
            <Button variant="secondary" size="md" icon={<IconMail size={34} />} onClick={() => send({ type: 'OPEN_EMAIL' })}>
              {t('delivery.email')}
            </Button>
          )}
        </div>
      </div>
      <Button className="livraison-done" onClick={finish} disabled={busy}>{t('delivery.done')}</Button>
    </Screen>
  )
}
