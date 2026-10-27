import { useState } from 'react'
import { BackButton, Button } from '@/components/Button'
import { IconCheck } from '@/components/Icons'
import { EmailKeyboard } from '@/components/Keyboard'
import { Screen } from '@/components/Screen'
import { useT } from '@/i18n'
import { bridge } from '@/lib/bridge'
import { play } from '@/lib/sound'
import type { ScreenProps } from './types'

export const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)

export function Email({ ctx, send }: ScreenProps) {
  const t = useT()
  const [value, setValue] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const valid = isEmail(value)

  const submit = async (): Promise<void> => {
    if (!valid || !consent || !ctx.saved || busy) return
    setBusy(true)
    try {
      await bridge.sendEmail({ eventId: ctx.saved.meta.eventId, sessionId: ctx.saved.meta.id, email: value })
      play('success')
      send({ type: 'EMAIL_SENT', email: value })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen className="email">
      <BackButton label={t('common.back')} onClick={() => send({ type: 'BACK' })} />
      <h2 className="display email-title">{t('email.title')}</h2>
      <div className={`email-field ${value && !valid ? 'invalid' : ''}`}>
        {value ? <span>{value}</span> : <span className="faint">{t('email.placeholder')}</span>}
        <span className="caret" />
      </div>
      <div className="email-actions">
        <button
          type="button"
          className={`checkbox ${consent ? 'checked' : ''}`}
          onClick={() => {
            play('tap')
            setConsent((c) => !c)
          }}
        >
          <span className="checkbox-box">{consent && <IconCheck size={30} />}</span>
          <span className="checkbox-label">{t('email.consent')}</span>
        </button>
        <Button size="md" onClick={submit} disabled={!valid || !consent || busy}>{t('email.send')}</Button>
      </div>
      <EmailKeyboard value={value} onChange={setValue} />
    </Screen>
  )
}
