import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type { VarState, OutlineSpan } from '../../../shared/protocol'

// Pannello «Stati & Contatori» (parametri di stato del mondo). Idioma dell'IDE:
// la LISTA nel dock modifica i campi con applicazione IMMEDIATA (un'operazione =
// una frase .fav riscritta/aggiunta/rimossa), la CREAZIONE usa una modale ampia.
// Tutto round-trip via outline.serialize + splice Monaco (undo nativo).

export default function VariablesEditor(): JSX.Element {
  const variables = useStudio((s) => s.variables)
  const loading = useStudio((s) => s.variablesLoading)
  const loadVariables = useStudio((s) => s.loadVariables)
  const applyStatement = useStudio((s) => s.applyStatement)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))
  const [creating, setCreating] = useState(false)

  if (!isFav) {
    return <div className="insp-empty">Apri un file .fav per gestire stati e contatori.</div>
  }
  if (!variables) {
    return (
      <div className="insp-empty">
        {loading ? 'Carico stati e contatori…' : 'Niente caricato.'}
        {!loading && (
          <button className="map-reload" onClick={() => void loadVariables()}>
            ⟳ Carica
          </button>
        )}
      </div>
    )
  }
  if (!variables.ok) {
    return (
      <div className="insp-empty">
        Il file contiene errori: correggili per gestire stati e contatori.
        <button className="map-reload" onClick={() => void loadVariables()}>
          ⟳ Riprova
        </button>
      </div>
    )
  }

  const { states, counters } = variables

  // Imposta il valore iniziale dello stato (replace della frase 'X è valore.', o
  // append se lo stato non ne aveva ancora uno).
  const setInitial = (s: VarState, value: string): void => {
    const v = value.trim()
    if (!v) return
    void applyStatement({ op: 'state_init', name: s.name, value: v }, s.initialSpan ?? undefined)
  }

  // Riscrive l'elenco dei valori ammessi (commento canonico). Lista vuota → elimina
  // il commento; altrimenti replace (se esiste) o append.
  const setValues = (s: VarState, values: string[]): void => {
    const puliti = Array.from(new Set(values.map((x) => x.trim().toLowerCase()).filter(Boolean)))
    if (puliti.length === 0) {
      if (s.valuesComment?.span) void deleteStatement(s.valuesComment.span)
      return
    }
    void applyStatement(
      { op: 'state_values_comment', name: s.name, values: puliti },
      s.valuesComment?.span ?? undefined
    )
  }

  // Elimina lo stato/contatore: rimuove dichiarazione + valore iniziale + commento.
  // Cancella dal BASSO verso l'ALTO (riga decrescente) così le righe più in alto
  // non slittano fra una delete e l'altra. NB: eventuali regole che lo citano
  // restano nel testo (potrebbero diventare 'morte': l'autore le vedrà nei Problemi).
  const eliminaSpans = async (spans: (OutlineSpan | null | undefined)[]): Promise<void> => {
    const vivi = spans.filter((x): x is OutlineSpan => !!x)
    vivi.sort((a, b) => b.line - a.line)
    for (const sp of vivi) await deleteStatement(sp)
  }

  return (
    <div className="ruled">
      <div className="insp-top">
        <span className="debug-title">
          Stati<span className="debug-count"> · {states.length}</span> · Contatori
          <span className="debug-count"> · {counters.length}</span>
        </span>
        <div>
          <button className="icon-btn" title="Nuovo stato o contatore" onClick={() => setCreating(true)}>
            ➕
          </button>
          <button className="icon-btn" title="Aggiorna" onClick={() => void loadVariables()}>
            ⟳
          </button>
        </div>
      </div>

      {creating && <VariableForm onDone={() => setCreating(false)} />}

      <div className="ruled-body">
        {states.length === 0 && counters.length === 0 && (
          <p className="insp-none">
            nessuno stato né contatore — creane uno con ➕ per popolare i menu del builder di regole
          </p>
        )}

        {states.map((s) => (
          <div key={'s' + s.name} className="rule-card">
            <div className="rule-head">
              <span className="rule-verb">stato</span>
              <span className="rule-target">{s.name}</span>
              <button
                className="rule-del"
                title="Elimina questo stato"
                onClick={() => void eliminaSpans([s.declSpan, s.initialSpan, s.valuesComment?.span])}
              >
                ×
              </button>
            </div>
            <StateValues s={s} onSetInitial={setInitial} onSetValues={setValues} />
          </div>
        ))}

        {counters.map((c) => (
          <div key={'c' + c.name} className="rule-card event">
            <div className="rule-head">
              <span className="rule-verb">contatore</span>
              <span className="rule-target">{c.name}</span>
              <button
                className="rule-del"
                title="Elimina questo contatore"
                onClick={() => void eliminaSpans([c.declSpan])}
              >
                ×
              </button>
            </div>
            <div className="var-note">parte da 0 · usa aumenta / diminuisci / diventa nelle regole</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Valori ammessi di uno stato: chip cliccabili (clic = imposta come iniziale; × =
// togli dall'elenco) + campo per aggiungerne. Il valore iniziale è evidenziato e
// non rimovibile (toglierlo svuoterebbe lo stato).
function StateValues({
  s,
  onSetInitial,
  onSetValues
}: {
  s: VarState
  onSetInitial: (s: VarState, value: string) => void
  onSetValues: (s: VarState, values: string[]) => void
}): JSX.Element {
  const [nuovo, setNuovo] = useState('')
  const aggiungi = (): void => {
    const v = nuovo.trim().toLowerCase()
    if (!v) return
    onSetValues(s, [...s.values, v])
    setNuovo('')
  }
  return (
    <div className="var-values">
      <div className="objed-chips">
        {s.values.length === 0 && <span className="insp-none">nessun valore — aggiungine sotto</span>}
        {s.values.map((v) => {
          const iniziale = v === s.initial
          return (
            <span key={v} className={'objed-chip' + (iniziale ? ' var-initial' : '')}>
              <button
                className="var-chipname"
                title={iniziale ? 'Valore iniziale' : 'Imposta come valore iniziale'}
                onClick={() => !iniziale && onSetInitial(s, v)}
              >
                {v}
                {iniziale && ' ★'}
              </button>
              {!iniziale && (
                <button
                  title="Togli dai valori ammessi"
                  onClick={() => onSetValues(s, s.values.filter((x) => x !== v))}
                >
                  ×
                </button>
              )}
            </span>
          )
        })}
      </div>
      <div className="objed-add">
        <input
          value={nuovo}
          placeholder="aggiungi un valore (es. inquieta)"
          onChange={(e) => setNuovo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && aggiungi()}
        />
        <button className="modal-btn ghost" disabled={!nuovo.trim()} onClick={aggiungi}>
          + valore
        </button>
      </div>
    </div>
  )
}

// Modale di CREAZIONE (stato o contatore). Per gli stati: nome + valore iniziale +
// elenco valori ammessi (scope completo → i dropdown del builder si popolano subito).
function VariableForm({ onDone }: { onDone: () => void }): JSX.Element {
  const applyStatement = useStudio((s) => s.applyStatement)
  const [tipo, setTipo] = useState<'stato' | 'contatore'>('stato')
  const [nome, setNome] = useState('')
  const [iniziale, setIniziale] = useState('')
  const [valori, setValori] = useState<string[]>([])
  const [nuovoVal, setNuovoVal] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  const aggiungiVal = (): void => {
    const v = nuovoVal.trim().toLowerCase()
    if (!v) return
    setValori((prev) => Array.from(new Set([...prev, v])))
    setNuovoVal('')
  }

  const valido = nome.trim().length > 0

  const crea = async (): Promise<void> => {
    const name = nome.trim()
    if (!name) return
    if (tipo === 'contatore') {
      await applyStatement({ op: 'counter_decl', name })
      onDone()
      return
    }
    // Stato: dichiarazione → commento dei valori (se presenti) → valore iniziale.
    // Tutti append: l'ordine di chiamata è l'ordine nel file.
    await applyStatement({ op: 'state_decl', name })
    const init = iniziale.trim().toLowerCase()
    const tutti = Array.from(new Set([...valori, ...(init ? [init] : [])]))
    if (tutti.length > 0) {
      await applyStatement({ op: 'state_values_comment', name, values: tutti })
    }
    if (init) {
      await applyStatement({ op: 'state_init', name, value: init })
    }
    onDone()
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onDone()
      }}
    >
      <div className="modal rule-modal">
        <h2 className="modal-title">Nuovo stato o contatore</h2>
        <div className="rule-modal-body">
          <div className="objed-field">
            <label>Tipo</label>
            <div className="objed-seg">
              <button className={tipo === 'stato' ? 'on' : ''} onClick={() => setTipo('stato')}>
                Stato (a parole)
              </button>
              <button
                className={tipo === 'contatore' ? 'on' : ''}
                onClick={() => setTipo('contatore')}
              >
                Contatore (numero)
              </button>
            </div>
            <p className="var-hint">
              {tipo === 'stato'
                ? 'Una variabile che contiene una parola alla volta (es. atmosfera: tranquilla/inquieta/ostile).'
                : 'Un numero che sale e scende (parte da 0). Es. sospetto, punteggio.'}
            </p>
          </div>

          <div className="objed-field">
            <label>Nome</label>
            <input
              autoFocus
              value={nome}
              placeholder={tipo === 'stato' ? 'es. atmosfera' : 'es. sospetto'}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          {tipo === 'stato' && (
            <>
              <div className="objed-field">
                <label>Valore iniziale</label>
                <input
                  value={iniziale}
                  placeholder="es. tranquilla"
                  onChange={(e) => setIniziale(e.target.value)}
                />
              </div>
              <div className="objed-field">
                <label>Valori ammessi (oltre all'iniziale)</label>
                <div className="objed-chips">
                  {valori.length === 0 && (
                    <span className="insp-none">facoltativo — popolano i menu del builder</span>
                  )}
                  {valori.map((v) => (
                    <span key={v} className="objed-chip">
                      {v}
                      <button
                        title="Togli"
                        onClick={() => setValori((prev) => prev.filter((x) => x !== v))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="objed-add">
                  <input
                    value={nuovoVal}
                    placeholder="aggiungi un valore (es. inquieta)"
                    onChange={(e) => setNuovoVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && aggiungiVal()}
                  />
                  <button className="modal-btn ghost" disabled={!nuovoVal.trim()} onClick={aggiungiVal}>
                    + valore
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="modal-btn ghost" onClick={onDone}>
            Annulla
          </button>
          <button className="modal-btn primary" disabled={!valido} onClick={() => void crea()}>
            Crea {tipo}
          </button>
        </div>
      </div>
    </div>
  )
}
