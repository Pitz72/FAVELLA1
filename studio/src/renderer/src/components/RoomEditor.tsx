import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type { OutlineRoom } from '../../../shared/protocol'
import { nucleo } from '../utils/posizione'

// Editor delle STANZE: lista + form (modello ObjectsEditor). Modifica la
// DESCRIZIONE (op 'description' via descSpan) e imposta la POSIZIONE INIZIALE del
// giocatore (op 'start', che sostituisce «Il giocatore comincia in X.» via
// outline.startSpan). Il NOME non è rinominabile da qui: l'id della stanza è usato
// da connessioni, posizioni e start → la rinomina si fa nel testo (a mano).
// Creazione di una stanza nuova: dalla Mappa (➕ Stanza) — qui solo lista+modifica.
export default function RoomEditor(): JSX.Element {
  const outline = useStudio((s) => s.outline)
  const loading = useStudio((s) => s.outlineLoading)
  const loadOutline = useStudio((s) => s.loadOutline)
  const applyStatement = useStudio((s) => s.applyStatement)
  const requestReveal = useStudio((s) => s.requestReveal)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))

  const [selId, setSelId] = useState<string | null>(null)
  const [descBozza, setDescBozza] = useState('')

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

  return (
    <div className="objed">
      <div className="insp-top">
        <span className="debug-title">
          Stanze<span className="debug-count"> · {rooms.length}</span>
        </span>
        <div>
          <button className="icon-btn" title="Aggiorna" onClick={() => void loadOutline()}>
            ⟳
          </button>
        </div>
      </div>

      <div className="objed-body">
        <div className="objed-list">
          {rooms.length === 0 ? (
            <p className="insp-none">nessuna stanza — creale dalla Mappa (➕ Stanza)</p>
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

        {sel && (
          <div className="objed-form">
            <div className="objed-field">
              <label>Nome</label>
              <input type="text" value={sel.name} readOnly title="La rinomina si fa nel testo" />
              <p className="var-note">
                Il nome non si modifica qui: l’identità della stanza è usata da connessioni,
                posizioni e partenza. Per rinominarla, modificala nel testo.
              </p>
            </div>

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
              {sel.exits.length === 0 ? (
                <span className="insp-none">nessuna — collega le stanze dalla Mappa</span>
              ) : (
                <div className="objed-chips">
                  {sel.exits.map((e, i) => (
                    <span key={i} className="objed-chip" title={e.implicit ? 'auto-ritorno' : 'connessione'}>
                      {e.direction} → {e.toName}
                      {e.implicit && <span className="var-badge"> auto</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
