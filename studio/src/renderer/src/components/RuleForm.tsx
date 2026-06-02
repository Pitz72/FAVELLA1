import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type { RuleConsequence, RulesMenu, SerializeRuleTarget } from '../../../shared/protocol'

// Tipi di conseguenza offerti dal builder (6c.2). Lo spostamento (`move`) arriva
// con 6c.3 (preposizione concordata); qui non è ancora proposto.
type ConsKind = 'prop' | 'var' | 'count' | 'end'
const CONS_LABEL: Record<ConsKind, string> = {
  prop: 'proprietà di un oggetto',
  var: 'valore di uno stato',
  count: 'contatore',
  end: 'fine partita'
}

/** Conseguenza di default del tipo scelto (null se mancano gli ingredienti, es.
 * nessuno stato dichiarato per una conseguenza di tipo stato). */
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
  return { op: 'end', outcome: 'vinci' }
}

export default function RuleForm({ menu, onDone }: { menu: RulesMenu; onDone: () => void }): JSX.Element {
  const applyStatement = useStudio((s) => s.applyStatement)

  const [verb, setVerb] = useState(menu.verbs[0] ?? '')
  const [targetSel, setTargetSel] = useState('') // '' = globale, 'o:<id>', 'd:<dir>'
  const [secPrep, setSecPrep] = useState('')
  const [secObj, setSecObj] = useState('')
  const [response, setResponse] = useState('')
  const [cons, setCons] = useState<RuleConsequence[]>([])
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

  const crea = async (): Promise<void> => {
    if (!verb.trim() || !response.trim()) return
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
    await applyStatement({
      op: 'rule',
      verb: verb.trim(),
      target,
      response: response.trim(),
      consequences: cons
    })
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
        <h2 className="modal-title">Nuova regola</h2>
        <div className="rule-modal-body">
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
      </div>

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
            {(['prop', 'var', 'count', 'end'] as ConsKind[]).map((k) => (
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
          <button
            className="modal-btn primary"
            disabled={!verb.trim() || !response.trim()}
            onClick={() => void crea()}
          >
            Crea regola
          </button>
        </div>
      </div>
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
            placeholder="valore (es. accesa)"
            value={c.value}
            onChange={(e) => onChange({ ...c, value: e.target.value })}
          />
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
