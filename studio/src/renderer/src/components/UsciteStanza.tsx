import { useState } from 'react'
import { useStudio } from '../store'
import type { OutlineExit, OutlineRoom } from '../../../shared/protocol'

// Le uscite di una stanza, modificabili: lo stesso pezzo sta nel pannello Stanze e nella
// scheda che compare sulla Mappa quando si clicca una stanza. Si cambia la direzione, si
// cambia la stanza dall'altra parte, si toglie, se ne aggiunge una. Ogni modifica riscrive
// la frase «collega» da cui l'uscita nasce (anche in un file incluso).

const NUOVA = '__nuova__'

/**
 * Un menu di direzioni. «➕ nuova direzione…» apre due campi (la direzione e la sua
 * opposta: nel linguaggio le direzioni inventate vanno sempre in coppia).
 */
export function DirezioneSelect({
  valore,
  direzioni,
  usate = [],
  vuota,
  onScegli
}: {
  valore?: string
  direzioni: string[]
  usate?: string[]
  /** Testo della voce vuota (per «aggiungi»); senza, la direzione è sempre una. */
  vuota?: string
  onScegli: (direzione: string, opposta?: string) => void
}): JSX.Element {
  const [nuova, setNuova] = useState(false)
  const [nome, setNome] = useState('')
  const [opp, setOpp] = useState('')
  const n = nome.trim().toLowerCase()
  const o = opp.trim().toLowerCase()
  const valida = !!n && !!o && !n.includes(' ') && !o.includes(' ') && n !== o

  if (nuova) {
    return (
      <span className="dir-nuova">
        <input type="text" autoFocus placeholder="direzione" value={nome} onChange={(e) => setNome(e.target.value)} />
        <span aria-hidden="true">↔</span>
        <input
          type="text"
          placeholder="opposta"
          value={opp}
          onChange={(e) => setOpp(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && valida) {
              setNuova(false)
              onScegli(n, o)
            }
          }}
        />
        <button
          className="modal-btn primary"
          disabled={!valida}
          title="Es. «botola» ↔ «scala»: una parola sola, e il ritorno è la sua opposta"
          onClick={() => {
            setNuova(false)
            onScegli(n, o)
          }}
        >
          Ok
        </button>
        <button className="modal-btn ghost" onClick={() => setNuova(false)}>
          Annulla
        </button>
      </span>
    )
  }

  // Una direzione appena inventata non è ancora nel mondo: il menu la mostra lo stesso.
  const lista = !valore || direzioni.includes(valore) ? direzioni : [...direzioni, valore]
  return (
    <select
      value={valore ?? ''}
      onChange={(e) => {
        if (e.target.value === NUOVA) setNuova(true)
        else if (e.target.value) onScegli(e.target.value)
      }}
    >
      {vuota !== undefined && <option value="">{vuota}</option>}
      {lista.map((d) => {
        const occupata = usate.includes(d) && d !== valore
        return (
          <option key={d} value={d} disabled={occupata}>
            {d}
            {occupata ? ' (già usata)' : ''}
          </option>
        )
      })}
      <option value={NUOVA}>➕ nuova direzione…</option>
    </select>
  )
}

function UscitaRiga({ stanza, uscita, rooms, direzioni }: {
  stanza: OutlineRoom
  uscita: OutlineExit
  rooms: OutlineRoom[]
  direzioni: string[]
}): JSX.Element {
  const cambiaUscita = useStudio((s) => s.cambiaUscita)
  const eliminaUscita = useStudio((s) => s.eliminaUscita)
  const usate = stanza.exits.map((e) => e.direction)
  return (
    <div className="uscita-riga">
      <div className="uscita-coppia">
        <DirezioneSelect
          valore={uscita.direction}
          direzioni={direzioni}
          usate={usate}
          onScegli={(direzione, opposta) => void cambiaUscita({ daId: stanza.id, uscita, direzione, opposta })}
        />
        <span className="uscita-freccia" aria-hidden="true">
          →
        </span>
        <select
          value={uscita.to}
          onChange={(e) => void cambiaUscita({ daId: stanza.id, uscita, versoId: e.target.value })}
          aria-label="Stanza dall'altra parte"
        >
          {rooms
            .filter((r) => r.id !== stanza.id)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
        </select>
      </div>
      {uscita.implicit && (
        <span
          className="var-badge"
          title="È il ritorno di una connessione scritta dall'altra stanza: cambiarla riscrive quella frase."
        >
          ritorno
        </span>
      )}
      <button
        className="rule-del"
        title={uscita.implicit ? 'Toglie la connessione (anche l’andata)' : 'Toglie la connessione (anche il ritorno)'}
        onClick={() => void eliminaUscita(uscita)}
        disabled={!uscita.span}
      >
        ×
      </button>
    </div>
  )
}

export default function UsciteStanza({ stanzaId }: { stanzaId: string }): JSX.Element | null {
  const outline = useStudio((s) => s.outline)
  const mapAddConnection = useStudio((s) => s.mapAddConnection)
  const [dir, setDir] = useState('')
  const [opposta, setOpposta] = useState<string | undefined>(undefined)
  const [verso, setVerso] = useState('')

  const stanza = outline?.rooms.find((r) => r.id === stanzaId)
  if (!outline || !stanza) return null
  const rooms = outline.rooms
  const direzioni = outline.directions
  const altre = rooms.filter((r) => r.id !== stanza.id)
  const usate = stanza.exits.map((e) => e.direction)
  const pronta = !!dir && !!verso

  return (
    <div className="uscite">
      {stanza.exits.length === 0 && <p className="insp-none">Nessuna uscita: aggiungine una qui sotto.</p>}
      {stanza.exits.map((e, i) => (
        <UscitaRiga key={e.direction + '>' + e.to + i} stanza={stanza} uscita={e} rooms={rooms} direzioni={direzioni} />
      ))}
      {altre.length > 0 ? (
        <div className="uscita-riga uscita-nuova">
          <div className="uscita-coppia">
            <DirezioneSelect
              valore={dir}
              direzioni={direzioni}
              usate={usate}
              vuota="direzione…"
              onScegli={(d, o) => {
                setDir(d)
                setOpposta(o)
              }}
            />
            <span className="uscita-freccia" aria-hidden="true">
              →
            </span>
            <select value={verso} onChange={(e) => setVerso(e.target.value)} aria-label="Stanza dall'altra parte">
              <option value="">stanza…</option>
              {altre.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="modal-btn primary"
            disabled={!pronta}
            title="Aggiunge l'uscita e il ritorno dall'altra stanza"
            onClick={() => {
              const d = dir
              const v = verso
              const o = opposta
              setDir('')
              setVerso('')
              setOpposta(undefined)
              void mapAddConnection(stanza.id, d, v, o)
            }}
          >
            + Aggiungi uscita
          </button>
        </div>
      ) : (
        <p className="insp-none">Servono almeno due stanze per collegarle.</p>
      )}
      <p className="var-note">
        Il ritorno dall'altra stanza si scrive da solo: «nord» da qui è «sud» da lì.
      </p>
    </div>
  )
}
