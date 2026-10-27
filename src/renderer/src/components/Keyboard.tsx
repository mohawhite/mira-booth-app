import { IconDelete } from './Icons'

const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
  ['w', 'x', 'c', 'v', 'b', 'n', '.', '-', '_', 'del']
]
const DOMAINS = ['@gmail.com', '@hotmail.fr', '@outlook.fr', '@yahoo.fr', '@icloud.com']

/** Clavier AZERTY pour la saisie d'e-mail, touches de 96 px. */
export function EmailKeyboard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const press = (k: string): void => {
    if (k === 'del') onChange(value.slice(0, -1))
    else if (value.length < 80) onChange(value + k)
  }
  const hasAt = value.includes('@')
  return (
    <div className="keyboard">
      <div className="keyboard-domains">
        {DOMAINS.map((d) => (
          <button key={d} type="button" className="key key-domain" disabled={hasAt} onClick={() => press(d)}>
            {d}
          </button>
        ))}
      </div>
      {ROWS.map((row, i) => (
        <div key={i} className="keyboard-row">
          {row.map((k) => (
            <button key={k} type="button" className={`key ${k === 'del' ? 'key-del' : ''}`} onClick={() => press(k)} aria-label={k === 'del' ? 'Effacer' : k}>
              {k === 'del' ? <IconDelete size={36} /> : k}
            </button>
          ))}
        </div>
      ))}
      <div className="keyboard-row">
        <button type="button" className="key key-wide" disabled={hasAt} onClick={() => press('@')}>@</button>
      </div>
    </div>
  )
}
