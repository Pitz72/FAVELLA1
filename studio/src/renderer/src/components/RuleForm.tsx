import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type {
  Rule,
  GameEvent,
  Demon,
  RuleCondition,
  RuleConsequence,
  RulesMenu,
  SerializeRuleTarget,
  OutlineSpan
} from '../../../shared/protocol'
import {
  CondGroup,
  ConsRow,
  CONS_LABEL,
  CONS_GROUPS,
  defaultAtom,
  defaultCons,
  arricchisciCons,
  type ConsKind
} from './logicBuilder'

// Verbi con un EFFETTO di default che «Invece di» sopprime: prendi (→ inventario),
// lascia (→ stanza), metti (→ contenitore/supporto), apri. Una regola su questi verbi
// SOSTITUISCE l'azione normale → se l'autore vuole anche l'effetto, deve ricrearlo in
// una conseguenza. Mostriamo un avviso inline (tranello classico dell'IF). Forme
// canoniche + sinonimi da VERBI_VALIDI.
const VERBI_CON_EFFETTO = new Set([
  'prendi', 'prendere', 'afferra', 'afferrare', 'raccogli', 'raccogliere',
  'lascia', 'lasciare', 'molla', 'mollare', 'posa', 'posare', 'butta', 'buttare',
  'appoggia', 'appoggiare',
  'metti', 'mettere', 'poni', 'porre', 'infila', 'infilare', 'inserisci', 'inserire',
  'apri', 'aprire'
])

// --- Stato iniziale del bersaglio (per la modifica) ---
function initTarget(rule?: Rule | null): { sel: string; prep: string; obj: string } {
  const t = rule?.target
  if (!t) return { sel: '', prep: '', obj: '' }
  if (t.kind === 'object') return { sel: 'o:' + t.id, prep: t.prep ?? '', obj: t.secondaryId ?? '' }
  return { sel: 'd:' + t.name, prep: '', obj: '' }
}

export default function RuleForm({
  menu,
  rule,
  event,
  demon,
  span,
  onDone
}: {
  menu: RulesMenu
  rule?: Rule | null
  event?: GameEvent | null
  demon?: Demon | null
  span?: OutlineSpan | null
  onDone: () => void
}): JSX.Element {
  const applyStatement = useStudio((s) => s.applyStatement)
  const inModifica = !!rule || !!event || !!demon
  // 'rule' = «Invece di…», 'event' = «Al turno N / Ogni N turni», 'demon' = sentinella
  // «Ogni turno se…»/«Quando… diventa vera». In modifica il tipo è fisso.
  const [kind, setKind] = useState<'rule' | 'event' | 'demon'>(
    demon ? 'demon' : event ? 'event' : 'rule'
  )
  const [demonMode, setDemonMode] = useState<'ogni' | 'quando'>(demon?.mode ?? 'quando')

  const t0 = initTarget(rule)
  const [verb, setVerb] = useState(rule?.verb ?? menu.verbs[0] ?? '')
  const [targetSel, setTargetSel] = useState(t0.sel) // '' = globale, 'o:<id>', 'd:<dir>'
  const [secPrep, setSecPrep] = useState(t0.prep)
  const [secObj, setSecObj] = useState(t0.obj)
  // Tempistica dell'evento: 'al' = al turno N (una volta), 'ogni' = ogni N turni (ripetuto).
  const [evMode, setEvMode] = useState<'al' | 'ogni'>(event?.mode ?? 'ogni')
  const [evN, setEvN] = useState<number>(event?.n ?? 1)
  const [response, setResponse] = useState(
    event?.response ?? rule?.response ?? demon?.response ?? ''
  )
  const [cons, setCons] = useState<RuleConsequence[]>(
    arricchisciCons((event ?? rule ?? demon)?.consequences ?? [], menu)
  )
  const [condition, setCondition] = useState<RuleCondition | null>(
    rule?.condition ?? demon?.condition ?? null
  )
  const [addKind, setAddKind] = useState<ConsKind>('prop')

  // Esc chiude la modale.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  const targetIsObject = targetSel.startsWith('o:')

  const aggiungiCons = (): void => {
    const c = defaultCons(addKind, menu)
    if (!c) return
    setCons((prev) => [...prev, c])
  }
  const aggiornaCons = (i: number, c: RuleConsequence): void => {
    setCons((prev) => prev.map((x, j) => (j === i ? c : x)))
  }
  const rimuoviCons = (i: number): void => {
    setCons((prev) => prev.filter((_, j) => j !== i))
  }

  const aggiungiCondizione = (): void => {
    const a = defaultAtom(menu)
    if (a) setCondition({ op: 'and', terms: [a] })
  }

  // Evento: risposta + N≥1. Demone: risposta + condizione (sorveglia sempre una
  // condizione). Regola: verbo + risposta.
  const valido =
    kind === 'event'
      ? response.trim().length > 0 && Number.isInteger(evN) && evN >= 1
      : kind === 'demon'
        ? response.trim().length > 0 && condition !== null
        : verb.trim().length > 0 && response.trim().length > 0

  const salva = async (): Promise<void> => {
    if (!valido) return
    if (kind === 'event') {
      await applyStatement(
        {
          op: 'event',
          mode: evMode,
          n: evN,
          response: response.trim(),
          consequences: cons
        },
        span ?? undefined
      )
      onDone()
      return
    }
    if (kind === 'demon') {
      await applyStatement(
        {
          op: 'demon',
          mode: demonMode,
          condition: condition ?? null,
          response: response.trim(),
          consequences: cons
        },
        span ?? undefined
      )
      onDone()
      return
    }
    let target: SerializeRuleTarget | null = null
    if (targetSel.startsWith('o:')) {
      const o = menu.objects.find((x) => x.id === targetSel.slice(2))
      if (o) {
        const sec = secObj ? menu.objects.find((x) => x.id === secObj) : null
        target = {
          kind: 'object',
          name: o.name,
          prep: sec && secPrep ? secPrep : null,
          secondaryName: sec && secPrep ? sec.name : null
        }
      }
    } else if (targetSel.startsWith('d:')) {
      target = { kind: 'direction', name: targetSel.slice(2), prep: null, secondaryName: null }
    }
    await applyStatement(
      {
        op: 'rule',
        verb: verb.trim(),
        target,
        condition: condition ?? null,
        response: response.trim(),
        consequences: cons
      },
      span ?? undefined
    )
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
        <h2 className="modal-title">
          {inModifica
            ? kind === 'event'
              ? 'Modifica evento'
              : kind === 'demon'
                ? 'Modifica demone'
                : 'Modifica regola'
            : 'Nuova regola, evento o demone'}
        </h2>
        <div className="rule-modal-body">
          {!inModifica && (
            <div className="objed-field">
              <label>Tipo</label>
              <div className="objed-seg">
                <button className={kind === 'rule' ? 'on' : ''} onClick={() => setKind('rule')}>
                  Regola (reazione a un'azione)
                </button>
                <button className={kind === 'event' ? 'on' : ''} onClick={() => setKind('event')}>
                  Evento (a tempo)
                </button>
                <button className={kind === 'demon' ? 'on' : ''} onClick={() => setKind('demon')}>
                  Demone (sorveglia una condizione)
                </button>
              </div>
            </div>
          )}

          {kind === 'demon' && (
            <div className="objed-field">
              <label>Quando scatta (sentinella)</label>
              <div className="objed-seg">
                <button
                  className={demonMode === 'quando' ? 'on' : ''}
                  onClick={() => setDemonMode('quando')}
                >
                  appena la condizione diventa vera (una volta)
                </button>
                <button
                  className={demonMode === 'ogni' ? 'on' : ''}
                  onClick={() => setDemonMode('ogni')}
                >
                  ogni turno in cui è vera (ripetuto)
                </button>
              </div>
            </div>
          )}

          {kind === 'event' && (
            <div className="objed-field">
              <label>Quando (tempistica)</label>
              <div className="ruleform-when">
                <select value={evMode} onChange={(e) => setEvMode(e.target.value as 'al' | 'ogni')}>
                  <option value="al">al turno (una volta sola)</option>
                  <option value="ogni">ogni N turni (ripetuto)</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={evN}
                  onChange={(e) => setEvN(parseInt(e.target.value, 10) || 1)}
                  style={{ width: 80 }}
                />
                <span className="cons-arrow">{evMode === 'al' ? 'º turno' : 'turni'}</span>
              </div>
            </div>
          )}

          {kind === 'rule' && (
          <>
          <div className="objed-field">
            <label>Quando il giocatore…</label>
            <div className="ruleform-when">
              <select value={verb} onChange={(e) => setVerb(e.target.value)}>
                {menu.verbs.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <select value={targetSel} onChange={(e) => setTargetSel(e.target.value)}>
                <option value="">— senza bersaglio (globale) —</option>
                <optgroup label="su un oggetto">
                  {menu.objects.map((o) => (
                    <option key={o.id} value={'o:' + o.id}>
                      {o.name}
                    </option>
                  ))}
                </optgroup>
                {menu.directions.length > 0 && (
                  <optgroup label="in una direzione">
                    {menu.directions.map((d) => (
                      <option key={d} value={'d:' + d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            {targetIsObject && (
              <div className="ruleform-when">
                <select value={secPrep} onChange={(e) => setSecPrep(e.target.value)}>
                  <option value="">— (un solo oggetto) —</option>
                  {['con', 'su', 'contro', 'in'].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select value={secObj} onChange={(e) => setSecObj(e.target.value)} disabled={!secPrep}>
                  <option value="">— secondo oggetto —</option>
                  {menu.objects.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {VERBI_CON_EFFETTO.has(verb) && (
              <p className="ruleform-warn">
                ⚠️ «Invece di {verb}» <b>sostituisce</b> l'azione normale: la regola viene
                eseguita <i>al posto</i> di «{verb}». Se vuoi che l'effetto avvenga comunque
                (es. l'oggetto finisca in inventario), aggiungilo come conseguenza qui sotto
                (es. <b>sposta un oggetto → in inventario</b>).
              </p>
            )}
          </div>
          </>
          )}

          {(kind === 'rule' || kind === 'demon') && (
            <div className="objed-field">
              <label>
                {kind === 'demon' ? 'Solo se… (per il demone è obbligatoria)' : 'Solo se… (condizione)'}
              </label>
              {condition === null ? (
                <button
                  className="modal-btn ghost"
                  onClick={aggiungiCondizione}
                  disabled={!defaultAtom(menu)}
                >
                  + aggiungi condizione
                </button>
              ) : (
                <CondGroup
                  node={condition as Extract<RuleCondition, { op: 'and' | 'or' }>}
                  menu={menu}
                  onChange={(n) => setCondition(n)}
                  onRemove={() => setCondition(null)}
                  isRoot
                />
              )}
            </div>
          )}

          <div className="objed-field">
            <label>Di’ al giocatore (obbligatorio)</label>
            <textarea
              rows={2}
              placeholder="es. Click! Si accende la luce."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
          </div>

          <div className="objed-field">
            <label>Fai questo… (conseguenze)</label>
            {cons.length === 0 && <span className="insp-none">nessuna conseguenza</span>}
            {cons.map((c, i) => (
              <ConsRow key={i} c={c} menu={menu} onChange={(nc) => aggiornaCons(i, nc)} onRemove={() => rimuoviCons(i)} />
            ))}
            <div className="objed-add">
              <select value={addKind} onChange={(e) => setAddKind(e.target.value as ConsKind)}>
                {CONS_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.kinds.map((k) => (
                      <option key={k} value={k}>
                        {CONS_LABEL[k]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button className="modal-btn ghost" onClick={aggiungiCons}>
                + conseguenza
              </button>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="modal-btn ghost" onClick={onDone}>
            Annulla
          </button>
          <button className="modal-btn primary" disabled={!valido} onClick={() => void salva()}>
            {(inModifica ? 'Salva ' : 'Crea ') +
              (kind === 'event' ? 'evento' : kind === 'demon' ? 'demone' : 'regola')}
          </button>
        </div>
      </div>
    </div>
  )
}
