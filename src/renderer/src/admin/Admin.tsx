import { useEffect, useState, type ReactNode } from 'react'
import { closeCamera, listVideoDevices } from '@/camera/camera'
import { IconMinus, IconPlus } from '@/components/Icons'
import { bridge } from '@/lib/bridge'
import { useConfig } from '@/lib/config'
import { countVoiceFiles, previewVoice } from '@/lib/voice'
import { calibrationPage } from '@/render/compose'
import type { BoothConfig, BoothStatus, FormatId, SavedSession } from '@shared/types'

type Tab = 'tableau' | 'evenement' | 'seance' | 'camera' | 'impression' | 'galerie' | 'systeme'

const TABS: [Tab, string][] = [
  ['tableau', 'Tableau de bord'],
  ['evenement', 'Événement'],
  ['seance', 'Séance'],
  ['camera', 'Caméra'],
  ['impression', 'Impression'],
  ['galerie', 'Galerie'],
  ['systeme', 'Système']
]

const FORMAT_LABELS: Record<FormatId, string> = { solo: 'Portrait (1 photo)', grille: 'Mosaïque (4 poses)', bandelettes: 'Bandelettes (4 poses)' }

const STATUS_LABELS = { en_attente: 'En attente', impression: 'Impression…', termine: 'Terminé', erreur: 'Erreur' }

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

function NumberStepper({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  const set = (v: number): void => onChange(Math.round(Math.min(max, Math.max(min, v)) * 1000) / 1000)
  return (
    <div className="num-stepper">
      <button type="button" onClick={() => set(value - step)} disabled={value <= min}><IconMinus size={28} /></button>
      <span>{value}</span>
      <button type="button" onClick={() => set(value + step)} disabled={value >= max}><IconPlus size={28} /></button>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span />
    </button>
  )
}

function Choice<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="choice">
      {options.map(([v, label]) => (
        <button key={String(v)} type="button" className={v === value ? 'active' : ''} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  )
}

export function Admin({ onClose }: { onClose: () => void }) {
  const { config, save } = useConfig()
  const [draft, setDraft] = useState<BoothConfig>(config)
  const [tab, setTab] = useState<Tab>('tableau')
  const [status, setStatus] = useState<BoothStatus>()
  const [sessions, setSessions] = useState<SavedSession[]>([])
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [voiceFiles, setVoiceFiles] = useState<Record<string, { found: number; total: number }>>({})
  const [notice, setNotice] = useState('')
  const dirty = JSON.stringify(draft) !== JSON.stringify(config)

  useEffect(() => {
    const load = (): void => void bridge.getStatus().then(setStatus).catch(() => {})
    load()
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (tab === 'galerie') void bridge.listSessions(config.event.id).then(setSessions)
    if (tab === 'camera') void listVideoDevices().then(setDevices).catch(() => setDevices([]))
    if (tab === 'systeme')
      void Promise.all([countVoiceFiles('fr'), countVoiceFiles('en')]).then(([fr, en]) => setVoiceFiles({ fr, en }))
  }, [tab, config.event.id])

  const patch = <K extends keyof BoothConfig>(section: K, values: Partial<BoothConfig[K]>): void =>
    setDraft((d) => ({ ...d, [section]: { ...d[section], ...values } }))

  const flash = (msg: string): void => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 2500)
  }

  const persist = async (): Promise<void> => {
    if (draft.system.pin.length < 4) return flash('Le code PIN doit contenir au moins 4 chiffres')
    if (draft.camera.source !== config.camera.source || draft.camera.deviceId !== config.camera.deviceId) closeCamera()
    await save(draft)
    flash('Réglages enregistrés')
  }

  const ev = draft.event
  const se = draft.session
  const cam = draft.camera
  const pr = draft.print
  const sys = draft.system

  return (
    <div className="admin">
      <header className="admin-header">
        <div>
          <p className="eyebrow">M I R A · Espace opérateur</p>
          <h1 className="display">{config.event.name}</h1>
        </div>
        <div className="admin-header-actions">
          {notice && <span className="admin-notice">{notice}</span>}
          <button type="button" className="admin-btn primary" disabled={!dirty} onClick={persist}>Enregistrer</button>
          <button type="button" className="admin-btn" onClick={onClose}>Retour à la borne</button>
        </div>
      </header>

      <nav className="admin-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      <main className="admin-body">
        {tab === 'tableau' && (
          <div className="admin-dashboard">
            <div className="stat"><span className="stat-value numeral">{status?.sessionsCount ?? '–'}</span><span className="eyebrow">Séances</span></div>
            <div className="stat"><span className="stat-value numeral">{status?.printsCount ?? '–'}</span><span className="eyebrow">Tirages imprimés</span></div>
            <div className="stat"><span className="stat-value numeral">{status?.printQueue.filter((j) => j.status === 'en_attente' || j.status === 'impression').length ?? '–'}</span><span className="eyebrow">En file d'impression</span></div>
            <div className="stat"><span className="stat-value numeral">{status?.diskFreeGb != null ? `${status.diskFreeGb} Go` : '–'}</span><span className="eyebrow">Disque libre</span></div>
            <div className="panel span-4">
              <h3>État</h3>
              <ul className="status-list">
                <li><span>Mode</span><span>{status?.mode === 'web' ? 'Aperçu navigateur (simulation)' : 'Borne (Electron)'}</span></li>
                <li><span>Caméra</span><span>{config.camera.source === 'webcam' ? 'Webcam' : 'Caméra simulée'}</span></li>
                <li><span>Impression</span><span>{config.print.driver === 'mock' ? 'Simulée' : config.print.printerName || 'Imprimante par défaut'}</span></li>
                <li><span>Galerie (QR)</span><span>{status?.galleryOrigin ?? '–'}</span></li>
                {status?.diskFreeGb != null && status.diskFreeGb < 20 && <li className="warn"><span>Alerte</span><span>Moins de 20 Go libres : archivez les anciens événements.</span></li>}
              </ul>
            </div>
            <div className="panel span-4">
              <h3>File d'impression</h3>
              {status?.printQueue.length ? (
                <ul className="status-list">
                  {status.printQueue.slice(0, 8).map((j) => (
                    <li key={j.id} className={j.status === 'erreur' ? 'warn' : ''}>
                      <span>{new Date(j.createdAt).toLocaleTimeString('fr-FR')} · séance {j.sessionId.slice(-5)} · ×{j.copies}</span>
                      <span>{STATUS_LABELS[j.status]}{j.error ? ` — ${j.error}` : ''}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="muted">Aucun tirage pour le moment.</p>}
            </div>
          </div>
        )}

        {tab === 'evenement' && (
          <div className="admin-form">
            <Field label="Nom de l'événement" hint="Affiché à l'écran et imprimé sur les photos.">
              <input value={ev.name} onChange={(e) => patch('event', { name: e.target.value })} />
            </Field>
            <Field label="Sous-titre (lieu, prénoms…)">
              <input value={ev.subtitle} onChange={(e) => patch('event', { subtitle: e.target.value })} />
            </Field>
            <Field label="Date imprimée" hint="Ex. 14 · 02 · 2027. Laisser vide pour ne rien imprimer.">
              <input value={ev.dateLabel} onChange={(e) => patch('event', { dateLabel: e.target.value })} />
            </Field>
            <Field label="Message d'accueil">
              <input value={ev.welcome} onChange={(e) => patch('event', { welcome: e.target.value })} />
            </Field>
            <Field label="Identifiant de l'événement" hint="Lettres, chiffres, tirets. Les photos sont rangées par événement.">
              <input value={ev.id} onChange={(e) => patch('event', { id: e.target.value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) || 'demo' })} />
            </Field>
            <Field label="Formats proposés">
              <div className="choice">
                {(Object.keys(FORMAT_LABELS) as FormatId[]).map((f) => {
                  const on = ev.formats.includes(f)
                  return (
                    <button
                      key={f}
                      type="button"
                      className={on ? 'active' : ''}
                      onClick={() => {
                        const next = on ? ev.formats.filter((x) => x !== f) : [...ev.formats, f]
                        if (next.length) patch('event', { formats: (Object.keys(FORMAT_LABELS) as FormatId[]).filter((x) => next.includes(x)) })
                      }}
                    >
                      {FORMAT_LABELS[f]}
                    </button>
                  )
                })}
              </div>
            </Field>
          </div>
        )}

        {tab === 'seance' && (
          <div className="admin-form">
            <Field label="Compte à rebours (secondes)"><NumberStepper value={se.countdownSeconds} min={3} max={10} onChange={(v) => patch('session', { countdownSeconds: v })} /></Field>
            <Field label="Reprises autorisées par séance"><NumberStepper value={se.retakes} min={0} max={3} onChange={(v) => patch('session', { retakes: v })} /></Field>
            <Field label="Copies maximum par séance" hint="0 = impression désactivée (numérique uniquement)."><NumberStepper value={se.maxCopies} min={0} max={5} onChange={(v) => patch('session', { maxCopies: v })} /></Field>
            <Field label="Retour à l'accueil après inactivité (secondes)"><NumberStepper value={se.inactivitySeconds} min={20} max={180} step={5} onChange={(v) => patch('session', { inactivitySeconds: v })} /></Field>
          </div>
        )}

        {tab === 'camera' && (
          <div className="admin-form">
            <Field label="Source" hint="Phase 2 : Canon EOS 2000D via le SDK Canon (EDSDK).">
              <Choice value={cam.source} options={[['webcam', 'Webcam'], ['mock', 'Caméra simulée']]} onChange={(v) => patch('camera', { source: v })} />
            </Field>
            {cam.source === 'webcam' && (
              <Field label="Webcam">
                <select value={cam.deviceId} onChange={(e) => patch('camera', { deviceId: e.target.value })}>
                  <option value="">Par défaut</option>
                  {devices.map((d, i) => <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Caméra ${i + 1}`}</option>)}
                </select>
              </Field>
            )}
            <Field label="Miroir sur l'aperçu" hint="Recommandé : les invités se voient comme dans un miroir."><Toggle checked={cam.mirrorPreview} onChange={(v) => patch('camera', { mirrorPreview: v })} /></Field>
            <Field label="Miroir sur la photo finale"><Toggle checked={cam.mirrorFinal} onChange={(v) => patch('camera', { mirrorFinal: v })} /></Field>
            <Field label="Rotation"><Choice value={cam.rotation} options={[[0, '0°'], [180, '180°']]} onChange={(v) => patch('camera', { rotation: v })} /></Field>
            <Field label="Recadrage (zoom)" hint="Utile pour masquer le bord de la fenêtre ronde de la borne."><NumberStepper value={cam.zoom} min={1} max={1.6} step={0.05} onChange={(v) => patch('camera', { zoom: v })} /></Field>
          </div>
        )}

        {tab === 'impression' && (
          <div className="admin-form">
            <Field label="Pilote">
              <Choice value={pr.driver} options={[['mock', 'Simulé'], ['system', 'Imprimante Windows (DNP)']]} onChange={(v) => patch('print', { driver: v })} />
            </Field>
            {pr.driver === 'system' && (
              <Field label="Imprimante" hint="Installer le pilote DNP avant de brancher l'imprimante en USB.">
                <select value={pr.printerName} onChange={(e) => patch('print', { printerName: e.target.value })}>
                  <option value="">Imprimante par défaut</option>
                  {status?.printers.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            )}
            <Field label="Taille de rendu (pixels)" hint="DNP DS-RX1HS 10×15 : 1800×1200 utiles + fond perdu. Vérifiez la valeur dans le pilote.">
              <div className="inline">
                <NumberStepper value={pr.widthPx} min={1700} max={1900} step={2} onChange={(v) => patch('print', { widthPx: v })} />
                <span>×</span>
                <NumberStepper value={pr.heightPx} min={1100} max={1300} step={2} onChange={(v) => patch('print', { heightPx: v })} />
              </div>
            </Field>
            <Field label="Calage horizontal / vertical (pixels)">
              <div className="inline">
                <NumberStepper value={pr.offsetX} min={-60} max={60} step={2} onChange={(v) => patch('print', { offsetX: v })} />
                <NumberStepper value={pr.offsetY} min={-60} max={60} step={2} onChange={(v) => patch('print', { offsetY: v })} />
              </div>
            </Field>
            <Field label="Échelle"><NumberStepper value={pr.scale} min={0.9} max={1.1} step={0.005} onChange={(v) => patch('print', { scale: v })} /></Field>
            <div>
              <button
                type="button"
                className="admin-btn"
                onClick={async () => {
                  await persist()
                  await bridge.printTestPage(calibrationPage(draft.print))
                  flash('Page de calage envoyée')
                }}
              >
                Imprimer une page de calage
              </button>
            </div>
          </div>
        )}

        {tab === 'galerie' && (
          <div className="admin-gallery">
            {sessions.length === 0 && <p className="muted">Aucune photo pour cet événement.</p>}
            {sessions.map((s) => (
              <figure key={s.meta.id} className="gallery-item">
                <img src={s.compositeUrl} alt="" />
                <figcaption>
                  <span>{new Date(s.meta.createdAt).toLocaleTimeString('fr-FR')} · {s.meta.consentGallery ? 'Diaporama' : 'Privée'}</span>
                  <span className="gallery-actions">
                    <button type="button" onClick={async () => { await bridge.print({ eventId: s.meta.eventId, sessionId: s.meta.id, copies: 1 }); flash('Réimpression lancée') }}>Réimprimer</button>
                    <button type="button" onClick={async () => { await bridge.deleteSession(s.meta.eventId, s.meta.id); setSessions((l) => l.filter((x) => x.meta.id !== s.meta.id)) }}>Supprimer</button>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {tab === 'systeme' && (
          <div className="admin-form">
            <Field label="Code PIN opérateur" hint="4 à 8 chiffres.">
              <input inputMode="numeric" value={sys.pin} onChange={(e) => patch('system', { pin: e.target.value.replace(/\D/g, '').slice(0, 8) })} />
            </Field>
            <Field label="Langue par défaut"><Choice value={sys.lang} options={[['fr', 'Français'], ['en', 'English']]} onChange={(v) => patch('system', { lang: v })} /></Field>
            <Field label="Sons (compte à rebours, déclencheur, fin)"><Toggle checked={sys.sounds} onChange={(v) => patch('system', { sounds: v })} /></Field>
            <Field label="Voix guide" hint={Object.entries(voiceFiles).map(([l, c]) => `${l.toUpperCase()} : ${c.found}/${c.total} fichiers`).join('  ·  ') || 'Vérification des fichiers…'}>
              <Toggle checked={sys.voice} onChange={(v) => patch('system', { voice: v })} />
            </Field>
            <Field label="Volume de la voix (%)">
              <div className="inline">
                <NumberStepper value={Math.round(sys.voiceVolume * 100)} min={10} max={100} step={10} onChange={(v) => patch('system', { voiceVolume: v / 100 })} />
                <button type="button" className="admin-btn" onClick={() => previewVoice(sys.lang, sys.voiceVolume)}>Écouter</button>
              </div>
            </Field>
            <Field label="Adresse publique de la galerie" hint="Vide = adresse locale de la borne (les téléphones doivent être sur le même Wi-Fi). Phase 2 : galerie en ligne.">
              <input value={sys.galleryBaseUrl} placeholder={status?.galleryOrigin} onChange={(e) => patch('system', { galleryBaseUrl: e.target.value.trim() })} />
            </Field>
            <div>
              <button type="button" className="admin-btn danger" onClick={() => void bridge.quit()}>Quitter MIRA BOOTH</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
