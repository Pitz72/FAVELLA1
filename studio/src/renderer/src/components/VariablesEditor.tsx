import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type { VarState, VarCounter, OutlineSpan, SerializeSpec } from '../../../shared/protocol'
import Finestra from './Finestra'
import { NonPronto, Vuoto } from './Elenco'
import { IconaAggiorna, IconaChiudi, IconaPiu, IconaStella } from './Icone'

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
  const eliminaFrasi = useStudio((s) => s.eliminaFrasi)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))
  const [creating, setCreating] = useState(false)

  if (!isFav) return <NonPronto cosa="gli stati e i contatori" stato="nessun-file" />
  if (!variables) return <NonPronto cosa="gli stati e i contatori" stato={loading ? 'carico' : 'vuoto'} onRiprova={() => void loadVariables()} />
  if (!variables.ok) return <NonPronto cosa="gli stati e i contatori" stato="errori" onRiprova={() => void loadVariables()} />

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

  // Imposta il valore iniziale di un contatore ('X parte da N.'). N=0 → rimuove la
  // frase 'parte da' se presente (0 è il default, frase ridondante).
  const setCounterInitial = (c: VarCounter, value: number): void => {
    if (value === 0) {
      if (c.initialSpan) void deleteStatement(c.initialSpan)
      return
    }
    void applyStatement({ op: 'counter_init', name: c.name, value }, c.initialSpan ?? undefined)
  }

  // Elimina lo stato/contatore: dichiarazione + valore iniziale + commento, in un passo
  // solo (e annullabile). Le regole che lo citano restano nel testo: se diventano
  // sbagliate, compaiono nei Problemi.
  const eliminaSpans = async (spans: (OutlineSpan | null | undefined)[], etichetta: string): Promise<void> => {
    await eliminaFrasi(spans.filter((x): x is OutlineSpan => !!x), etichetta)
  }

  return (
    <div className="ruled">
      <div className="pannello-testa">
        <h2 className="pannello-titolo">
          Stati <span className="elenco-conto">{states.length}</span>
          <span className="pannello-sep" aria-hidden="true">·</span>
          Contatori <span className="elenco-conto">{counters.length}</span>
        </h2>
        <button className="btn-icona" aria-label="Rileggi" title="Rileggi" onClick={() => void loadVariables()}>
          <IconaAggiorna />
        </button>
        <button className="btn btn-accento btn-piccolo" onClick={() => setCreating(true)}>
          <IconaPiu size={15} />
          Nuovo stato o contatore
        </button>
      </div>

      {creating && <VariableForm onDone={() => setCreating(false)} />}

      <div className="ruled-body">
        {states.length === 0 && counters.length === 0 && (
          <Vuoto titolo="Il mondo non ricorda ancora niente">
            Uno stato ricorda una parola («la porta è socchiusa»), un contatore un numero («fiducia»). Le regole li leggono e li cambiano.
          </Vuoto>
        )}

        {states.map((s) => (
          <div key={'s' + s.name} className="rule-card">
            <div className="rule-head">
              <span className="rule-verb">stato</span>
              <span className="rule-target">{s.name}</span>
              <button
                className="btn-icona"
                aria-label={`Elimina lo stato ${s.name}`}
                title="Elimina questo stato"
                onClick={() => void eliminaSpans([s.declSpan, s.initialSpan, s.valuesComment?.span], `Stato «${s.name}» eliminato`)}
              >
                <IconaChiudi />
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
                className="btn-icona"
                aria-label={`Elimina il contatore ${c.name}`}
                title="Elimina questo contatore"
                onClick={() => void eliminaSpans([c.declSpan, c.initialSpan], `Contatore «${c.name}» eliminato`)}
              >
                <IconaChiudi />
              </button>
            </div>
            <CounterInitial c={c} onSet={setCounterInitial} />
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
        {s.values.length === 0 && <span className="nota-riquadro">nessun valore — aggiungine sotto</span>}
        {s.values.map((v) => {
          const iniziale = v === s.initial
          return (
            <span key={v} className={'objed-chip' + (iniziale ? ' var-initial' : '')}>
              <button
                className="var-chipname"
                aria-pressed={iniziale}
                title={iniziale ? 'Il valore iniziale' : 'Fanne il valore iniziale'}
                onClick={() => !iniziale && onSetInitial(s, v)}
              >
                {v}
                {iniziale && <IconaStella size={13} piena />}
              </button>
              {!iniziale && (
                <button
                  aria-label={`Togli il valore ${v}`}
                  title="Togli dai valori ammessi"
                  onClick={() => onSetValues(s, s.values.filter((x) => x !== v))}
                >
                  <IconaChiudi size={13} />
                </button>
              )}
            </span>
          )
        })}
      </div>
      {s.values.length > 0 && (
        <p className="aiuto">Clicca un valore per farne quello iniziale (la stellina).</p>
      )}
      <div className="objed-add">
        <input
          value={nuovo}
          aria-label={`Un valore nuovo per ${s.name}`}
          placeholder="aggiungi un valore (es. inquieta)"
          onChange={(e) => setNuovo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && aggiungi()}
        />
        <button className="btn btn-quieto btn-piccolo" disabled={!nuovo.trim()} onClick={aggiungi}>
          + valore
        </button>
      </div>
    </div>
  )
}

// Valore iniziale di un contatore, editabile inline («X parte da N.»). 0 = default.
function CounterInitial({
  c,
  onSet
}: {
  c: VarCounter
  onSet: (c: VarCounter, value: number) => void
}): JSX.Element {
  const [v, setV] = useState(String(c.initial))
  useEffect(() => setV(String(c.initial)), [c.initial])
  return (
    <div className="var-values var-counter-init">
      <label className="aiuto">parte da</label>
      <input
        type="number"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = parseInt(v, 10)
          if (!Number.isNaN(n) && n !== c.initial) onSet(c, n)
          else setV(String(c.initial))
        }}
      />
      <span className="aiuto">· usa aumenta / diminuisci / diventa nelle regole</span>
    </div>
  )
}

// Modale di CREAZIONE (stato o contatore). Per gli stati: nome + valore iniziale +
// elenco valori ammessi (scope completo → i dropdown del builder si popolano subito).
function VariableForm({ onDone }: { onDone: () => void }): JSX.Element {
  const appendStatements = useStudio((s) => s.appendStatements)
  const nomiUsati = useStudio((s) => new Set([...(s.variables?.states ?? []).map((x) => x.name), ...(s.variables?.counters ?? []).map((x) => x.name)]))
  const [tipo, setTipo] = useState<'stato' | 'contatore'>('stato')
  const [nome, setNome] = useState('')
  const [iniziale, setIniziale] = useState('')
  const [inizialeCont, setInizialeCont] = useState('0')
  const [valori, setValori] = useState<string[]>([])
  const [nuovoVal, setNuovoVal] = useState('')

  const aggiungiVal = (): void => {
    const v = nuovoVal.trim().toLowerCase()
    if (!v) return
    setValori((prev) => Array.from(new Set([...prev, v])))
    setNuovoVal('')
  }

  const nomeLibero = !nomiUsati.has(nome.trim().toLowerCase())
  const valido = nome.trim().length > 0 && nomeLibero

  const crea = async (): Promise<void> => {
    const name = nome.trim()
    if (!name) return
    // [Studio 1.2] Tutte le frasi in un passo solo (prima erano fino a tre modifiche
    // separate: se una falliva, lo stato restava a metà).
    const specs: SerializeSpec[] = []
    if (tipo === 'contatore') {
      specs.push({ op: 'counter_decl', name })
      const n = parseInt(inizialeCont, 10)
      if (!Number.isNaN(n) && n !== 0) specs.push({ op: 'counter_init', name, value: n })
    } else {
      // Stato: dichiarazione → commento dei valori (se presenti) → valore iniziale.
      specs.push({ op: 'state_decl', name })
      const init = iniziale.trim().toLowerCase()
      const tutti = Array.from(new Set([...valori, ...(init ? [init] : [])]))
      if (tutti.length > 0) specs.push({ op: 'state_values_comment', name, values: tutti })
      if (init) specs.push({ op: 'state_init', name, value: init })
    }
    await appendStatements(specs)
    onDone()
  }

  return (
    <Finestra
      titolo="Uno stato o un contatore nuovo"
      sottotitolo="Ciò che il mondo ricorda: una parola che cambia, o un numero che sale e scende."
      onChiudi={onDone}
      larga
      azioni={
        <>
          <button className="btn btn-quieto" onClick={onDone}>
            Annulla
          </button>
          <button className="btn btn-primario" disabled={!valido} onClick={() => void crea()}>
            Crea {tipo === 'stato' ? 'lo stato' : 'il contatore'}
          </button>
        </>
      }
    >
        <div className="modulo">
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
            <p className="aiuto">
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
              aria-invalid={!nomeLibero}
              placeholder={tipo === 'stato' ? 'es. atmosfera' : 'es. sospetto'}
              onChange={(e) => setNome(e.target.value)}
            />
            {!nomeLibero && <p className="errore-campo">Esiste già uno stato o un contatore con questo nome.</p>}
          </div>

          {tipo === 'contatore' && (
            <div className="objed-field">
              <label>Valore iniziale</label>
              <input
                type="number"
                value={inizialeCont}
                onChange={(e) => setInizialeCont(e.target.value)}
              />
            </div>
          )}

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
                    <span className="nota-riquadro">facoltativo — popolano i menu del builder</span>
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
                  <button className="btn btn-quieto btn-piccolo" disabled={!nuovoVal.trim()} onClick={aggiungiVal}>
                    + valore
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
    </Finestra>
  )
}
