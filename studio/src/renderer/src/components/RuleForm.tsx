import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type {
  Rule,
  GameEvent,
  RuleCondition,
  RuleConsequence,
  RulesMenu,
  SerializeRuleTarget,
  OutlineSpan
} from '../../../shared/protocol'
import { prepPlace } from '../utils/posizione'

// Tipi di conseguenza offerti dal builder. Con 6c.3 arriva anche lo spostamento
// (`move`), che genera la preposizione concordata come l'op 'position'.
type ConsKind = 'prop' | 'var' | 'count' | 'move' | 'end'
const CONS_LABEL: Record<ConsKind, string> = {
  prop: 'proprietà di un oggetto',
  var: 'valore di uno stato',
  count: 'contatore',
  move: 'sposta un oggetto',
  end: 'fine partita'
}

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

// --- Spostamento: dal bersaglio scelto alla conseguenza `move` con prep/place ---
// destSel codificato: 'sp:inventario' | 'sp:nulla' | 'r:<idStanza>' | 'o:<idOggetto>'.

function buildMove(objId: string, destSel: string, menu: RulesMenu): RuleConsequence | null {
  const o = menu.objects.find((x) => x.id === objId)
  if (!o) return null
  const base = { op: 'move' as const, id: o.id, name: o.name }
  if (destSel === 'sp:inventario')
    return { ...base, dest: 'inventario', destName: 'inventario', prep: 'in', place: 'inventario' }
  if (destSel === 'sp:nulla')
    return { ...base, dest: 'nulla', destName: 'nulla', prep: 'nel', place: 'nulla' }
  if (destSel.startsWith('r:')) {
    const r = menu.rooms.find((x) => x.id === destSel.slice(2))
    if (r) return { ...base, dest: r.id, destName: r.name, ...prepPlace({ name: r.name, kind: 'stanza' }) }
  }
  if (destSel.startsWith('o:')) {
    const t = menu.objects.find((x) => x.id === destSel.slice(2))
    if (t) return { ...base, dest: t.id, destName: t.name, ...prepPlace({ name: t.name, kind: t.kind }) }
  }
  return null
}

/** Valore corrente del select destinazione a partire da una conseguenza move. */
function destSelOf(c: Extract<RuleConsequence, { op: 'move' }>, menu: RulesMenu): string {
  if (c.dest === 'inventario') return 'sp:inventario'
  if (c.dest === 'nulla') return 'sp:nulla'
  if (menu.rooms.some((r) => r.id === c.dest)) return 'r:' + c.dest
  if (menu.objects.some((o) => o.id === c.dest)) return 'o:' + c.dest
  return ''
}

/** Ricalcola prep/place sulle conseguenze move (le regole lette non li portano):
 * preserva lo stile articolato quando la regola viene risalvata in modifica. */
function arricchisciCons(cons: RuleConsequence[], menu: RulesMenu): RuleConsequence[] {
  return cons.map((c) => (c.op === 'move' ? buildMove(c.id, destSelOf(c, menu), menu) ?? c : c))
}

/** Conseguenza di default del tipo scelto (null se mancano gli ingredienti). */
function defaultCons(kind: ConsKind, menu: RulesMenu): RuleConsequence | null {
  if (kind === 'prop') {
    const o = menu.objects[0]
    return o ? { op: 'prop', id: o.id, name: o.name, prop: '' } : null
  }
  if (kind === 'var') {
    const s = menu.states[0]
    return s ? { op: 'var', name: s, value: '', kind: 'stato' } : null
  }
  if (kind === 'count') {
    const c = menu.counters[0]
    return c ? { op: 'count', name: c, mode: 'aumenta', value: 1 } : null
  }
  if (kind === 'move') {
    const o = menu.objects[0]
    return o ? buildMove(o.id, 'sp:nulla', menu) : null
  }
  return { op: 'end', outcome: 'vinci' }
}

// --- Condizioni: atomi di default ---
type AtomKind = 'has' | 'prop' | 'var' | 'count'

function defaultAtomOfKind(kind: AtomKind, menu: RulesMenu): RuleCondition | null {
  if (kind === 'has') {
    const o = menu.objects[0]
    return o ? { op: 'has', id: o.id, name: o.name } : null
  }
  if (kind === 'prop') {
    const o = menu.objects[0]
    return o ? { op: 'prop', id: o.id, name: o.name, prop: '' } : null
  }
  if (kind === 'var') {
    const s = menu.states[0]
    return s ? { op: 'var', name: s, value: '', kind: 'stato' } : null
  }
  const c = menu.counters[0]
  return c ? { op: 'count', name: c, cmp: '>=', value: 1 } : null
}

/** Primo atomo costruibile con gli ingredienti disponibili (oggetti → stati → contatori). */
function defaultAtom(menu: RulesMenu): RuleCondition | null {
  return (
    defaultAtomOfKind('has', menu) ??
    defaultAtomOfKind('var', menu) ??
    defaultAtomOfKind('count', menu)
  )
}

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
  span,
  onDone
}: {
  menu: RulesMenu
  rule?: Rule | null
  event?: GameEvent | null
  span?: OutlineSpan | null
  onDone: () => void
}): JSX.Element {
  const applyStatement = useStudio((s) => s.applyStatement)
  const inModifica = !!rule || !!event
  // 'rule' = «Invece di…», 'event' = «Al turno N / Ogni N turni». In modifica il
  // tipo è fisso (lo determina ciò che si sta editando); in creazione è scelto col toggle.
  const [kind, setKind] = useState<'rule' | 'event'>(event ? 'event' : 'rule')

  const t0 = initTarget(rule)
  const [verb, setVerb] = useState(rule?.verb ?? menu.verbs[0] ?? '')
  const [targetSel, setTargetSel] = useState(t0.sel) // '' = globale, 'o:<id>', 'd:<dir>'
  const [secPrep, setSecPrep] = useState(t0.prep)
  const [secObj, setSecObj] = useState(t0.obj)
  // Tempistica dell'evento: 'al' = al turno N (una volta), 'ogni' = ogni N turni (ripetuto).
  const [evMode, setEvMode] = useState<'al' | 'ogni'>(event?.mode ?? 'ogni')
  const [evN, setEvN] = useState<number>(event?.n ?? 1)
  const [response, setResponse] = useState(event?.response ?? rule?.response ?? '')
  const [cons, setCons] = useState<RuleConsequence[]>(
    event ? arricchisciCons(event.consequences, menu) : rule ? arricchisciCons(rule.consequences, menu) : []
  )
  const [condition, setCondition] = useState<RuleCondition | null>(rule?.condition ?? null)
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

  // Un evento è valido con risposta + N≥1; una regola con verbo + risposta.
  const valido =
    kind === 'event'
      ? response.trim().length > 0 && Number.isInteger(evN) && evN >= 1
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
              : 'Modifica regola'
            : 'Nuova regola o evento'}
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
                  Evento (a tempo, sui turni)
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
            <label>Quando il giocatore fa…</label>
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

          <div className="objed-field">
            <label>Solo se… (condizione)</label>
            {condition === null ? (
              <button className="modal-btn ghost" onClick={aggiungiCondizione} disabled={!defaultAtom(menu)}>
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
          </>
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
            <label>E adesso… (conseguenze)</label>
            {cons.length === 0 && <span className="insp-none">nessuna conseguenza</span>}
            {cons.map((c, i) => (
              <ConsRow key={i} c={c} menu={menu} onChange={(nc) => aggiornaCons(i, nc)} onRemove={() => rimuoviCons(i)} />
            ))}
            <div className="objed-add">
              <select value={addKind} onChange={(e) => setAddKind(e.target.value as ConsKind)}>
                {(['prop', 'var', 'count', 'move', 'end'] as ConsKind[]).map((k) => (
                  <option key={k} value={k}>
                    {CONS_LABEL[k]}
                  </option>
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
            {inModifica
              ? kind === 'event'
                ? 'Salva evento'
                : 'Salva regola'
              : kind === 'event'
                ? 'Crea evento'
                : 'Crea regola'}
          </button>
        </div>
      </div>
    </div>
  )
}

// === Costruttore di CONDIZIONI annidate (AND/OR/NOT + parentesi) ===============
// Un GRUPPO è un nodo and/oppure con N termini; ogni termine è un atomo o un altro
// gruppo (le parentesi). Vincoli grammaticali: NOT è infisso e vale SOLO su
// has/prop/var; contatori e gruppi non sono negabili.

function CondGroup({
  node,
  menu,
  onChange,
  onRemove,
  isRoot
}: {
  node: Extract<RuleCondition, { op: 'and' | 'or' }>
  menu: RulesMenu
  onChange: (n: RuleCondition) => void
  onRemove: () => void
  isRoot?: boolean
}): JSX.Element {
  const setTerm = (i: number, t: RuleCondition): void =>
    onChange({ ...node, terms: node.terms.map((x, j) => (j === i ? t : x)) })
  const removeTerm = (i: number): void => {
    const terms = node.terms.filter((_, j) => j !== i)
    if (terms.length === 0) {
      onRemove()
      return
    }
    // Un gruppo annidato con un solo termine si collassa nel termine (niente
    // parentesi inutili); il gruppo radice resta gruppo.
    if (terms.length === 1 && !isRoot) {
      onChange(terms[0])
      return
    }
    onChange({ ...node, terms })
  }
  const addAtom = (): void => {
    const a = defaultAtom(menu)
    if (a) onChange({ ...node, terms: [...node.terms, a] })
  }
  const addGroup = (): void => {
    const a = defaultAtom(menu)
    if (a) onChange({ ...node, terms: [...node.terms, { op: 'and', terms: [a] }] })
  }

  return (
    <div className="cond-group">
      <div className="cond-group-head">
        <div className="objed-seg cond-conn">
          <button className={node.op === 'and' ? 'on' : ''} onClick={() => onChange({ ...node, op: 'and' })}>
            tutte vere (e)
          </button>
          <button className={node.op === 'or' ? 'on' : ''} onClick={() => onChange({ ...node, op: 'or' })}>
            almeno una (oppure)
          </button>
        </div>
        {!isRoot && (
          <button className="cons-del" title="Rimuovi gruppo" onClick={onRemove}>
            ×
          </button>
        )}
      </div>
      <div className="cond-terms">
        {node.terms.map((t, i) =>
          t.op === 'and' || t.op === 'or' ? (
            <CondGroup
              key={i}
              node={t}
              menu={menu}
              onChange={(nt) => setTerm(i, nt)}
              onRemove={() => removeTerm(i)}
            />
          ) : (
            <CondAtomRow
              key={i}
              node={t}
              menu={menu}
              onChange={(nt) => setTerm(i, nt)}
              onRemove={() => removeTerm(i)}
            />
          )
        )}
      </div>
      <div className="objed-add cond-add">
        <button className="modal-btn ghost" onClick={addAtom}>
          + condizione
        </button>
        <button className="modal-btn ghost" onClick={addGroup}>
          + gruppo ( )
        </button>
      </div>
    </div>
  )
}

// Riga di un atomo (eventualmente negato). Mostra il selettore di tipo, la
// casella «non» (solo has/prop/var) e gli operandi del tipo scelto.
function CondAtomRow({
  node,
  menu,
  onChange,
  onRemove
}: {
  node: RuleCondition
  menu: RulesMenu
  onChange: (n: RuleCondition) => void
  onRemove: () => void
}): JSX.Element {
  const negated = node.op === 'not'
  const atom = (negated ? (node as Extract<RuleCondition, { op: 'not' }>).term : node) as RuleCondition
  const kind = atom.op as AtomKind

  // Riavvolge l'atomo nella negazione se era negato (mai per i contatori).
  const emit = (a: RuleCondition): void => {
    onChange(negated && a.op !== 'count' ? { op: 'not', term: a } : a)
  }
  const setKind = (k: AtomKind): void => {
    const a = defaultAtomOfKind(k, menu)
    if (!a) return
    onChange(negated && k !== 'count' ? { op: 'not', term: a } : a)
  }
  const toggleNon = (): void => {
    if (kind === 'count') return
    onChange(negated ? atom : { op: 'not', term: atom })
  }

  return (
    <div className="cond-atom">
      <select value={kind} onChange={(e) => setKind(e.target.value as AtomKind)}>
        <option value="has">il giocatore ha…</option>
        <option value="prop">un oggetto è…</option>
        <option value="var">uno stato è…</option>
        <option value="count">un contatore…</option>
      </select>
      {kind !== 'count' && (
        <label className="cond-non" title="Negazione (non…)">
          <input type="checkbox" checked={negated} onChange={toggleNon} />
          non
        </label>
      )}

      {atom.op === 'has' && (
        <select
          value={atom.id}
          onChange={(e) => {
            const o = menu.objects.find((x) => x.id === e.target.value)
            if (o) emit({ op: 'has', id: o.id, name: o.name })
          }}
        >
          {menu.objects.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      )}

      {atom.op === 'prop' && (
        <>
          <select
            value={atom.id}
            onChange={(e) => {
              const o = menu.objects.find((x) => x.id === e.target.value)
              if (o) emit({ op: 'prop', id: o.id, name: o.name, prop: atom.prop })
            }}
          >
            {menu.objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <span className="cons-arrow">è</span>
          <input
            type="text"
            placeholder="proprietà (es. aperta)"
            value={atom.prop}
            onChange={(e) => emit({ ...atom, prop: e.target.value })}
          />
        </>
      )}

      {atom.op === 'var' && (
        <>
          <select value={atom.name} onChange={(e) => emit({ ...atom, name: e.target.value })}>
            {menu.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="cons-arrow">è</span>
          <input
            type="text"
            list={`sv-${atom.name}`}
            placeholder="valore (es. svelata)"
            value={atom.value}
            onChange={(e) => emit({ ...atom, value: e.target.value })}
          />
          <datalist id={`sv-${atom.name}`}>
            {(menu.stateValues?.[atom.name] ?? []).map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </>
      )}

      {atom.op === 'count' && (
        <>
          <select value={atom.name} onChange={(e) => emit({ ...atom, name: e.target.value })}>
            {menu.counters.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={atom.cmp}
            onChange={(e) => emit({ ...atom, cmp: e.target.value as '==' | '>=' | '>' | '<' })}
          >
            <option value="==">è</option>
            <option value=">=">è almeno</option>
            <option value=">">è più di</option>
            <option value="<">è meno di</option>
          </select>
          <input
            type="number"
            value={atom.value}
            onChange={(e) => emit({ ...atom, value: Number(e.target.value) || 0 })}
          />
        </>
      )}

      <button className="cons-del" title="Rimuovi" onClick={onRemove}>
        ×
      </button>
    </div>
  )
}

// Editor di una singola conseguenza (riga). I campi cambiano col tipo.
function ConsRow({
  c,
  menu,
  onChange,
  onRemove
}: {
  c: RuleConsequence
  menu: RulesMenu
  onChange: (c: RuleConsequence) => void
  onRemove: () => void
}): JSX.Element {
  return (
    <div className="cons-row">
      {c.op === 'prop' && (
        <>
          <select
            value={c.id}
            onChange={(e) => {
              const o = menu.objects.find((x) => x.id === e.target.value)
              if (o) onChange({ op: 'prop', id: o.id, name: o.name, prop: c.prop })
            }}
          >
            {menu.objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <span className="cons-arrow">→</span>
          <input
            type="text"
            placeholder="proprietà (es. accesa)"
            value={c.prop}
            onChange={(e) => onChange({ ...c, prop: e.target.value })}
          />
        </>
      )}
      {c.op === 'var' && (
        <>
          <select value={c.name} onChange={(e) => onChange({ ...c, name: e.target.value })}>
            {menu.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="cons-arrow">→</span>
          <input
            type="text"
            list={`sv-${c.name}`}
            placeholder="valore (es. accesa)"
            value={c.value}
            onChange={(e) => onChange({ ...c, value: e.target.value })}
          />
          <datalist id={`sv-${c.name}`}>
            {(menu.stateValues?.[c.name] ?? []).map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </>
      )}
      {c.op === 'count' && (
        <>
          <select
            value={c.mode}
            onChange={(e) => onChange({ ...c, mode: e.target.value as 'aumenta' | 'diminuisci' | 'diventa' })}
          >
            <option value="aumenta">aumenta</option>
            <option value="diminuisci">diminuisci</option>
            <option value="diventa">diventa</option>
          </select>
          <select value={c.name} onChange={(e) => onChange({ ...c, name: e.target.value })}>
            {menu.counters.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={c.value}
            onChange={(e) => onChange({ ...c, value: Number(e.target.value) || 0 })}
          />
        </>
      )}
      {c.op === 'move' && (
        <>
          <select
            value={c.id}
            onChange={(e) => {
              const m = buildMove(e.target.value, destSelOf(c, menu), menu)
              if (m) onChange(m)
            }}
          >
            {menu.objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <span className="cons-arrow">→</span>
          <select
            value={destSelOf(c, menu)}
            onChange={(e) => {
              const m = buildMove(c.id, e.target.value, menu)
              if (m) onChange(m)
            }}
          >
            <optgroup label="Speciali">
              <option value="sp:nulla">nel nulla (sparisce)</option>
              <option value="sp:inventario">in inventario</option>
            </optgroup>
            {menu.rooms.length > 0 && (
              <optgroup label="Stanze">
                {menu.rooms.map((r) => (
                  <option key={r.id} value={'r:' + r.id}>
                    {r.name}
                  </option>
                ))}
              </optgroup>
            )}
            {menu.objects.filter((o) => o.kind === 'contenitore' && o.id !== c.id).length > 0 && (
              <optgroup label="Dentro un contenitore">
                {menu.objects
                  .filter((o) => o.kind === 'contenitore' && o.id !== c.id)
                  .map((o) => (
                    <option key={o.id} value={'o:' + o.id}>
                      {o.name}
                    </option>
                  ))}
              </optgroup>
            )}
            {menu.objects.filter((o) => o.kind === 'supporto' && o.id !== c.id).length > 0 && (
              <optgroup label="Sopra un supporto">
                {menu.objects
                  .filter((o) => o.kind === 'supporto' && o.id !== c.id)
                  .map((o) => (
                    <option key={o.id} value={'o:' + o.id}>
                      {o.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </>
      )}
      {c.op === 'end' && (
        <select
          value={c.outcome}
          onChange={(e) => onChange({ op: 'end', outcome: e.target.value as 'vinci' | 'perdi' | 'termina' })}
        >
          <option value="vinci">vinci</option>
          <option value="perdi">perdi</option>
          <option value="termina">termina</option>
        </select>
      )}
      <button className="cons-del" title="Rimuovi" onClick={onRemove}>
        ×
      </button>
    </div>
  )
}
