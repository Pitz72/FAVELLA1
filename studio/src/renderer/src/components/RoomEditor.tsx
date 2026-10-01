import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type { OutlineRoom } from '../../../shared/protocol'
import { nucleo } from '../utils/posizione'
import { DirezioneSelect } from './UsciteStanza'
import UsciteStanza from './UsciteStanza'
import { EliminaElemento, RinominaElemento, idDiNome } from './ElementoAzioni'

// Editor delle STANZE: lista + scheda. Qui si fa tutto quello che si fa su una stanza:
// la si crea (anche già collegata a un'altra), la si rinomina, se ne cambia la descrizione,
// le uscite e il fatto di essere il punto di partenza, e la si elimina. Ogni gesto riscrive
// la frase giusta del testo, in qualunque file della storia stia.
export default function RoomEditor(): JSX.Element {
  const outline = useStudio((s) => s.outline)
  const loading = useStudio((s) => s.outlineLoading)
  const loadOutline = useStudio((s) => s.loadOutline)
  const applyStatement = useStudio((s) => s.applyStatement)
  const addRoom = useStudio((s) => s.mapAddRoom)
  const addConnection = useStudio((s) => s.mapAddConnection)
  const requestReveal = useStudio((s) => s.requestReveal)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))

  const [selId, setSelId] = useState<string | null>(null)
  const [descBozza, setDescBozza] = useState('')
  // Creazione in-linea: ➕ apre una riga col nome (con articolo) e, se si vuole, il collegamento.
  const [creando, setCreando] = useState(false)
  const [nuovoNome, setNuovoNome] = useState('')
  const [collegaA, setCollegaA] = useState('')
  const [direzione, setDirezione] = useState('')
  const [opposta, setOpposta] = useState<string | undefined>(undefined)

  const sel = outline?.rooms.find((r) => r.id === selId) ?? null

  // Allinea la bozza di descrizione alla stanza selezionata.
  useEffect(() => {
    setDescBozza(sel?.description ?? '')
  }, [selId, sel?.description])

  if (!isFav) {
    return <div className="insp-empty">Apri un file .fav per modificare le stanze.</div>
  }
  if (!outline) {
    return (
      <div className="insp-empty">
        {loading ? 'Carico le stanze…' : 'Nessuna stanza caricata.'}
        {!loading && (
          <button className="map-reload" onClick={() => void loadOutline()}>
            ⟳ Carica
          </button>
        )}
      </div>
    )
  }
  if (!outline.ok) {
    return (
      <div className="insp-empty">
        Il file contiene errori: correggili per usare l’editor stanze.
        <button className="map-reload" onClick={() => void loadOutline()}>
          ⟳ Riprova
        </button>
      </div>
    )
  }

  const rooms = outline.rooms

  const salvaDescrizione = async (): Promise<void> => {
    if (!sel) return
    await applyStatement({ op: 'description', name: sel.name, text: descBozza }, sel.descSpan)
  }

  // Imposta questa stanza come posizione iniziale. Scrive «Il giocatore comincia
  // in <nucleo>.» (nome senza articolo → italiano pulito «in cucina»). Se esiste
  // già una frase di partenza la SOSTITUISCE (outline.startSpan), altrimenti la
  // appende. La stanza diventa l'unica isStart al prossimo reload.
  const impostaIniziale = async (r: OutlineRoom): Promise<void> => {
    await applyStatement({ op: 'start', name: nucleo(r.name) }, outline.startSpan ?? undefined)
  }

  const chiudiCreazione = (): void => {
    setCreando(false)
    setNuovoNome('')
    setCollegaA('')
    setDirezione('')
    setOpposta(undefined)
  }

  // Crea «<Nome> è una stanza.» e, se richiesto, la collega a un'altra stanza.
  const creaStanza = async (): Promise<void> => {
    const nome = nuovoNome.trim()
    if (!nome) return
    const da = collegaA
    const dir = direzione
    const opp = opposta
    chiudiCreazione()
    await addRoom(nome)
    const nuovoId = idDiNome(nome)
    if (da && dir) await addConnection(da, dir, nuovoId, opp)
    setSelId(nuovoId)
  }

  return (
    <div className="objed">
      <div className="insp-top">
        <span className="debug-title">
          Stanze<span className="debug-count"> · {rooms.length}</span>
        </span>
        <div>
          <button
            className="btn-testo"
            title="Aggiungi una stanza alla storia"
            onClick={() => (creando ? chiudiCreazione() : setCreando(true))}
          >
            + Nuova stanza
          </button>
        </div>
      </div>

      {creando && (
        <div className="objed-create objed-create-col">
          <div className="objed-create-riga">
            <input
              type="text"
              autoFocus
              placeholder="Nome con l’articolo (es. La cantina)"
              value={nuovoNome}
              onChange={(e) => setNuovoNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void creaStanza()
                if (e.key === 'Escape') chiudiCreazione()
              }}
            />
            <button className="modal-btn primary" disabled={!nuovoNome.trim()} onClick={() => void creaStanza()}>
              Crea
            </button>
            <button className="modal-btn ghost" onClick={chiudiCreazione}>
              Annulla
            </button>
          </div>
          {rooms.length > 0 && (
            <div className="objed-create-riga">
              <span className="var-note">Collegala a</span>
              <select value={collegaA} onChange={(e) => setCollegaA(e.target.value)} aria-label="Collega a">
                <option value="">— nessuna (per ora) —</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {collegaA && (
                <>
                  <span className="var-note">verso</span>
                  <DirezioneSelect
                    valore={direzione}
                    direzioni={outline.directions}
                    usate={rooms.find((r) => r.id === collegaA)?.exits.map((e) => e.direction) ?? []}
                    vuota="direzione…"
                    onScegli={(d, o) => {
                      setDirezione(d)
                      setOpposta(o)
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="objed-body">
        <div className="objed-list">
          {rooms.length === 0 ? (
            <p className="insp-none">nessuna stanza: creane una con «Nuova stanza» (o dalla Mappa)</p>
          ) : (
            rooms.map((r) => (
              <div
                key={r.id}
                className={'objed-row' + (r.id === selId ? ' sel' : '')}
                onClick={() => setSelId(r.id)}
                title={r.isStart ? 'Stanza iniziale' : 'Stanza'}
              >
                <span className="objed-row-icon">{r.isStart ? '★' : '▢'}</span>
                <span className="objed-row-name">{r.name}</span>
              </div>
            ))
          )}
        </div>

        {!sel && <div className="vuoto-scegli">Scegli una stanza dall’elenco per modificarla.</div>}
        {sel && (
          <div className="objed-form">
            <RinominaElemento nome={sel.name} onRinominato={(n) => setSelId(idDiNome(n))} />

            <div className="objed-field">
              <label className="objed-check">
                <input
                  type="checkbox"
                  checked={sel.isStart}
                  disabled={sel.isStart}
                  onChange={() => void impostaIniziale(sel)}
                />
                Posizione iniziale del giocatore
              </label>
              {sel.isStart && (
                <p className="var-note">Il giocatore parte da qui. Spunta un’altra stanza per spostare la partenza.</p>
              )}
            </div>

            <div className="objed-field">
              <label>Descrizione</label>
              {sel.descConditional ? (
                <p className="insp-none">
                  Descrizione condizionale: modificala nel testo (l’editor non la riscrive).
                  {sel.descSpan && (
                    <button
                      className="map-reload"
                      onClick={() => requestReveal(sel.descSpan!.file, sel.descSpan!.line, 1)}
                    >
                      ✎ vai al testo
                    </button>
                  )}
                </p>
              ) : (
                <>
                  <textarea
                    rows={4}
                    placeholder="Cosa vede il giocatore entrando qui…"
                    value={descBozza}
                    onChange={(e) => setDescBozza(e.target.value)}
                  />
                  <button
                    className="modal-btn primary objed-save"
                    disabled={descBozza === sel.description}
                    onClick={() => void salvaDescrizione()}
                  >
                    Salva descrizione
                  </button>
                </>
              )}
            </div>

            <div className="objed-field">
              <label>Uscite</label>
              <UsciteStanza stanzaId={sel.id} />
            </div>

            <EliminaElemento nome={sel.name} tipo="stanza" onEliminato={() => setSelId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
