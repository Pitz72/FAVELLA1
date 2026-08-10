// Costruttori visuali CONDIVISI di condizioni e conseguenze (la «logica senza
// codice»). Estratti da RuleForm (Fase 6c) per essere riusati dall'editor dei
// dialoghi (Fase 6b): le opzioni di dialogo hanno le stesse condizioni e
// conseguenze delle regole. Generici su `LogicMenu` (il sottoinsieme di campi del
// menu che servono qui), così funzionano sia col menu delle regole sia con quello
// dei dialoghi.

import { useEffect, useState } from 'react'
import type {
  RuleCondition,
  RuleConsequence,
  ObjectKind,
  CountCmp,
  Operando
} from '../../../shared/protocol'
import { prepPlace } from '../utils/posizione'

// [v1.0.0 / Tema 2b] Campo dei valori di un'estrazione «uno fra a, b, c». Usa una
// bozza locale (commit all'uscita dal campo) così l'autore può digitare virgole e
// spazi senza che il parsing istantaneo gli mangi la punteggiatura.
function PickValuesInput({
  values,
  onChange
}: {
  values: string[]
  onChange: (v: string[]) => void
}): JSX.Element {
  const [draft, setDraft] = useState(values.join(', '))
  useEffect(() => setDraft(values.join(', ')), [values])
  const commit = (): void => {
    onChange(
      draft
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    )
  }
  return (
    <input
      type="text"
      style={{ flex: 1, minWidth: 160 }}
      placeholder="valori separati da virgola (es. sereno, pioggia, nebbia)"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
    />
  )
}

// Sottoinsieme del menu necessario ai costruttori (oggetti/stanze/stati/contatori
// + valori ammessi degli stati). Sia RulesMenu sia DialoguesMenu lo soddisfano.
export interface LogicMenu {
  objects: { id: string; name: string; kind: ObjectKind }[]
  rooms: { id: string; name: string }[]
  states: string[]
  counters: string[]
  stateValues: Record<string, string[]>
}

// Tipi di conseguenza offerti dal builder.
export type ConsKind =
  | 'prop'
  | 'var'
  | 'count'
  | 'move'
  | 'teleport'
  | 'end'
  | 'varCopy'
  | 'pick'
  | 'dark'
  | 'movePNG'
export const CONS_LABEL: Record<ConsKind, string> = {
  prop: 'cambia una proprietà di un oggetto',
  var: 'cambia il valore di uno stato',
  count: 'aumenta o diminuisci un contatore',
  move: 'sposta un oggetto',
  teleport: 'sposta il giocatore',
  end: 'fine partita',
  varCopy: 'copia uno stato in un altro', // Tema 3
  pick: 'sorteggia il valore di uno stato', // Tema 2b
  dark: 'una stanza diventa buia o si illumina', // Tema 4a
  movePNG: 'sposta un personaggio' // A5
}

// [UX 2026-06-17] Raggruppamento del menu «Fai questo…» per progressive disclosure:
// in cima gli effetti di tutti i giorni, poi le primitive rare dei Temi. Condiviso
// da RuleForm e DialogueForms così l'ordine e i gruppi non divergono mai.
export const CONS_GROUPS: { label: string; kinds: ConsKind[] }[] = [
  { label: 'Effetti comuni', kinds: ['prop', 'var', 'count', 'move', 'teleport', 'end'] },
  { label: 'Il mondo cambia', kinds: ['dark', 'movePNG'] },
  { label: 'Il caso e gli stati che si parlano', kinds: ['pick', 'varCopy'] }
]

// Confronti su contatore (etichette leggibili). Include ≤ (al massimo) e ≠.
export const CMP_LABELS: Record<CountCmp, string> = {
  '==': 'è',
  '!=': 'non è',
  '>=': 'è almeno',
  '>': 'è più di',
  '<': 'è meno di',
  '<=': 'è al massimo'
}

// [v1.0.0 / Tema 1] Rende leggibile la quantità di un contatore: un letterale è il
// numero; le forme dinamiche (introdotte dai Temi) si descrivono a parole.
export function operandoText(v: Operando): string {
  if (typeof v === 'number') return String(v)
  if (v.kind === 'var') return v.name
  return `un numero fra ${v.min} e ${v.max}`
}

// [v1.0.0] Una conseguenza è ricostruibile dalla form solo se l'editor visuale sa
// rigenerarla. I costrutti dei Temi (varCopy, pick) e i contatori con quantità
// dinamica NON lo sono ancora → restano in sola lettura («✎ testo») per non
// corromperli al salvataggio. Condiviso da Regole, Eventi, Demoni e Dialoghi.
export function conseqRepresentable(c: RuleConsequence): boolean {
  // Solo i costrutti che NESSUNA form sa ancora ricostruire restano in sola lettura.
  // 'unknown' = buio/movimento PNG (non ancora coperti). Tutto il resto — operando
  // dinamico, varCopy, pick — è ora editabile dalle form (v0.9.22).
  return c.op !== 'unknown'
}

// [v1.0.0 / Tema 1] Widget della QUANTITÀ di un contatore: un numero, il valore di
// un altro contatore ('[forza]'), o (solo nelle conseguenze) un'estrazione casuale
// ('un numero fra A e B'). `allowRand` è false nei confronti di condizione, dove la
// grammatica (operando_confronto) non ammette la forma casuale.
export function OperandoInput({
  value,
  menu,
  allowRand,
  onChange
}: {
  value: Operando
  menu: LogicMenu
  allowRand: boolean
  onChange: (v: Operando) => void
}): JSX.Element {
  const kind = typeof value === 'number' ? 'num' : value.kind
  const setKind = (k: 'num' | 'var' | 'rand'): void => {
    if (k === 'num') onChange(0)
    else if (k === 'var') onChange({ kind: 'var', name: menu.counters[0] ?? '' })
    else onChange({ kind: 'rand', min: 1, max: 6 })
  }
  return (
    <>
      <select value={kind} onChange={(e) => setKind(e.target.value as 'num' | 'var' | 'rand')}>
        <option value="num">un numero</option>
        {menu.counters.length > 0 && <option value="var">il valore di…</option>}
        {allowRand && <option value="rand">a caso fra…</option>}
      </select>
      {kind === 'num' && (
        <input
          type="number"
          style={{ width: 80 }}
          value={typeof value === 'number' ? value : 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
      )}
      {kind === 'var' && (
        <select
          value={typeof value === 'object' && value.kind === 'var' ? value.name : ''}
          onChange={(e) => onChange({ kind: 'var', name: e.target.value })}
        >
          {menu.counters.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}
      {kind === 'rand' && typeof value === 'object' && value.kind === 'rand' && (
        <>
          <input
            type="number"
            style={{ width: 64 }}
            value={value.min}
            onChange={(e) => onChange({ kind: 'rand', min: Number(e.target.value) || 0, max: value.max })}
          />
          <span className="cons-arrow">e</span>
          <input
            type="number"
            style={{ width: 64 }}
            value={value.max}
            onChange={(e) => onChange({ kind: 'rand', min: value.min, max: Number(e.target.value) || 0 })}
          />
        </>
      )}
    </>
  )
}

// --- Spostamento: dal bersaglio scelto alla conseguenza `move` con prep/place ---
// destSel codificato: 'sp:inventario' | 'sp:nulla' | 'r:<idStanza>' | 'o:<idOggetto>'.

export function buildMove(objId: string, destSel: string, menu: LogicMenu): RuleConsequence | null {
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
export function destSelOf(c: Extract<RuleConsequence, { op: 'move' }>, menu: LogicMenu): string {
  if (c.dest === 'inventario') return 'sp:inventario'
  if (c.dest === 'nulla') return 'sp:nulla'
  if (menu.rooms.some((r) => r.id === c.dest)) return 'r:' + c.dest
  if (menu.objects.some((o) => o.id === c.dest)) return 'o:' + c.dest
  return ''
}

/** Ricalcola prep/place sulle conseguenze move (le letture non li portano):
 * preserva lo stile articolato quando si risalva in modifica. */
export function arricchisciCons(cons: RuleConsequence[], menu: LogicMenu): RuleConsequence[] {
  return cons.map((c) => {
    if (c.op === 'move') return buildMove(c.id, destSelOf(c, menu), menu) ?? c
    // movePNG deterministico: la lettura porta dest/destName ma non prep/place → li
    // ricalcolo dalla stanza così il risalvataggio resta valido.
    if (c.op === 'movePNG' && !c.adjacent && c.dest) {
      const r = menu.rooms.find((x) => x.id === c.dest)
      if (r) return { ...c, ...prepPlace({ name: r.name, kind: 'stanza' }) }
    }
    return c
  })
}

/** Conseguenza di default del tipo scelto (null se mancano gli ingredienti). */
export function defaultCons(kind: ConsKind, menu: LogicMenu): RuleConsequence | null {
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
  if (kind === 'teleport') {
    const r = menu.rooms[0]
    return r ? { op: 'teleport', room: r.id, name: r.name } : null
  }
  if (kind === 'varCopy') {
    const s = menu.states[0]
    return s ? { op: 'varCopy', name: s, from: menu.states[1] ?? s } : null
  }
  if (kind === 'pick') {
    const s = menu.states[0]
    if (!s) return null
    // Parte dai valori noti dello stato (dal commento canonico o osservati); se
    // mancano, l'autore li aggiunge nel campo. Almeno uno serve per salvare.
    const vals = (menu.stateValues?.[s] ?? []).slice()
    return { op: 'pick', name: s, values: vals, kind: 'stato' }
  }
  if (kind === 'dark') {
    const r = menu.rooms[0]
    return r ? { op: 'dark', room: r.id, name: r.name, dark: true } : null
  }
  if (kind === 'movePNG') {
    const png = menu.objects[0]
    if (!png) return null
    const r = menu.rooms[0]
    if (r) {
      return {
        op: 'movePNG',
        png: png.id,
        name: png.name,
        adjacent: false,
        dest: r.id,
        destName: r.name,
        ...prepPlace({ name: r.name, kind: 'stanza' })
      }
    }
    // Senza stanze, solo il movimento adiacente è possibile.
    return { op: 'movePNG', png: png.id, name: png.name, adjacent: true, dest: null, destName: null }
  }
  return { op: 'end', outcome: 'vinci' }
}

// --- Condizioni: atomi di default ---
export type AtomKind = 'has' | 'prop' | 'var' | 'count' | 'playerIn' | 'varEq' | 'chance'

// Atomi negabili (negazione infissa «non»): la grammatica la ammette solo su
// possesso/proprietà/stato/posizione e sul confronto stato↔stato (varEq). I
// contatori si negano col confronto «non è» (cmp '!='), non con «non»; «càpita»
// non è negabile.
export const NEGATABLE: ReadonlySet<string> = new Set(['has', 'prop', 'var', 'playerIn', 'varEq'])

export function defaultAtomOfKind(kind: AtomKind, menu: LogicMenu): RuleCondition | null {
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
  if (kind === 'playerIn') {
    const r = menu.rooms[0]
    return r ? { op: 'playerIn', room: r.id, name: r.name } : null
  }
  if (kind === 'varEq') {
    const s = menu.states[0]
    return s ? { op: 'varEq', name: s, other: menu.states[1] ?? s } : null
  }
  if (kind === 'chance') {
    return { op: 'chance', num: 1, den: 2 }
  }
  const c = menu.counters[0]
  return c ? { op: 'count', name: c, cmp: '>=', value: 1 } : null
}

/** Primo atomo costruibile con gli ingredienti disponibili (oggetti → stati → contatori). */
export function defaultAtom(menu: LogicMenu): RuleCondition | null {
  return (
    defaultAtomOfKind('has', menu) ??
    defaultAtomOfKind('var', menu) ??
    defaultAtomOfKind('count', menu)
  )
}

// === Costruttore di CONDIZIONI annidate (AND/OR/NOT + parentesi) ===============
// Un GRUPPO è un nodo and/oppure con N termini; ogni termine è un atomo o un altro
// gruppo (le parentesi). Vincoli grammaticali: NOT è infisso e vale SOLO su
// has/prop/var; contatori e gruppi non sono negabili.

export function CondGroup({
  node,
  menu,
  onChange,
  onRemove,
  isRoot
}: {
  node: Extract<RuleCondition, { op: 'and' | 'or' }>
  menu: LogicMenu
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
  menu: LogicMenu
  onChange: (n: RuleCondition) => void
  onRemove: () => void
}): JSX.Element {
  const negated = node.op === 'not'
  const atom = (negated ? (node as Extract<RuleCondition, { op: 'not' }>).term : node) as RuleCondition
  const kind = atom.op as AtomKind

  // Riavvolge l'atomo nella negazione se era negato (solo per gli atomi negabili).
  const emit = (a: RuleCondition): void => {
    onChange(negated && NEGATABLE.has(a.op) ? { op: 'not', term: a } : a)
  }
  const setKind = (k: AtomKind): void => {
    const a = defaultAtomOfKind(k, menu)
    if (!a) return
    onChange(negated && NEGATABLE.has(k) ? { op: 'not', term: a } : a)
  }
  const toggleNon = (): void => {
    if (!NEGATABLE.has(kind)) return
    onChange(negated ? atom : { op: 'not', term: atom })
  }

  return (
    <div className="cond-atom">
      <select value={kind} onChange={(e) => setKind(e.target.value as AtomKind)}>
        <optgroup label="Le più usate">
          <option value="has">il giocatore ha…</option>
          <option value="playerIn">il giocatore è in…</option>
          <option value="prop">un oggetto è…</option>
          <option value="var">uno stato è…</option>
        </optgroup>
        <optgroup label="Avanzate">
          <option value="count">un contatore…</option>
          {menu.states.length > 0 && <option value="varEq">uno stato è come un altro…</option>}
          <option value="chance">càpita (probabilità)…</option>
        </optgroup>
      </select>
      {NEGATABLE.has(kind) && (
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

      {atom.op === 'playerIn' && (
        <select
          value={atom.room}
          onChange={(e) => {
            const r = menu.rooms.find((x) => x.id === e.target.value)
            if (r) emit({ op: 'playerIn', room: r.id, name: r.name })
          }}
        >
          {menu.rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
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
          <select value={atom.cmp} onChange={(e) => emit({ ...atom, cmp: e.target.value as CountCmp })}>
            <option value="==">è</option>
            <option value="!=">non è</option>
            <option value=">=">è almeno</option>
            <option value=">">è più di</option>
            <option value="<">è meno di</option>
            <option value="<=">è al massimo</option>
          </select>
          {/* operando_confronto: niente estrazione casuale nei confronti */}
          <OperandoInput
            value={atom.value}
            menu={menu}
            allowRand={false}
            onChange={(v) => emit({ ...atom, value: v })}
          />
        </>
      )}

      {atom.op === 'varEq' && (
        <>
          <select value={atom.name} onChange={(e) => emit({ ...atom, name: e.target.value })}>
            {menu.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="cons-arrow">è come</span>
          <select value={atom.other} onChange={(e) => emit({ ...atom, other: e.target.value })}>
            {menu.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </>
      )}

      {atom.op === 'chance' && (
        <>
          <span className="cons-arrow">càpita (</span>
          <input
            type="number"
            min={1}
            style={{ width: 56 }}
            value={atom.num}
            onChange={(e) => emit({ ...atom, num: Number(e.target.value) || 1 })}
          />
          <span className="cons-arrow">su</span>
          <input
            type="number"
            min={1}
            style={{ width: 56 }}
            value={atom.den}
            onChange={(e) => emit({ ...atom, den: Number(e.target.value) || 1 })}
          />
          <span className="cons-arrow">)</span>
        </>
      )}

      <button className="cons-del" title="Rimuovi" onClick={onRemove}>
        ×
      </button>
    </div>
  )
}

// Editor di una singola conseguenza (riga). I campi cambiano col tipo.
export function ConsRow({
  c,
  menu,
  onChange,
  onRemove
}: {
  c: RuleConsequence
  menu: LogicMenu
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
          {c.mode !== 'diventa' && <span className="cons-arrow">di</span>}
          <OperandoInput
            value={c.value}
            menu={menu}
            allowRand={true}
            onChange={(v) => onChange({ ...c, value: v })}
          />
        </>
      )}
      {c.op === 'varCopy' && (
        <>
          <select value={c.name} onChange={(e) => onChange({ ...c, name: e.target.value })}>
            {menu.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="cons-arrow">→ diventa (come)</span>
          <select value={c.from} onChange={(e) => onChange({ ...c, from: e.target.value })}>
            {menu.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </>
      )}
      {c.op === 'pick' && (
        <>
          <select value={c.name} onChange={(e) => onChange({ ...c, name: e.target.value })}>
            {menu.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="cons-arrow">→ uno fra</span>
          <PickValuesInput values={c.values} onChange={(vals) => onChange({ ...c, values: vals })} />
        </>
      )}
      {c.op === 'dark' && (
        <>
          <select
            value={c.room}
            onChange={(e) => {
              const r = menu.rooms.find((x) => x.id === e.target.value)
              if (r) onChange({ op: 'dark', room: r.id, name: r.name, dark: c.dark })
            }}
          >
            {menu.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <span className="cons-arrow">→</span>
          <div className="objed-seg">
            <button className={c.dark ? 'on' : ''} onClick={() => onChange({ ...c, dark: true })}>
              diventa buia
            </button>
            <button className={!c.dark ? 'on' : ''} onClick={() => onChange({ ...c, dark: false })}>
              si illumina
            </button>
          </div>
        </>
      )}
      {c.op === 'movePNG' && (
        <>
          <select
            value={c.png}
            onChange={(e) => {
              const o = menu.objects.find((x) => x.id === e.target.value)
              if (o) onChange({ ...c, png: o.id, name: o.name })
            }}
          >
            {menu.objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <div className="objed-seg">
            <button
              className={!c.adjacent ? 'on' : ''}
              onClick={() => {
                const r = menu.rooms[0]
                if (r)
                  onChange({
                    ...c,
                    adjacent: false,
                    dest: r.id,
                    destName: r.name,
                    ...prepPlace({ name: r.name, kind: 'stanza' })
                  })
                else onChange({ ...c, adjacent: false })
              }}
            >
              va in…
            </button>
            <button
              className={c.adjacent ? 'on' : ''}
              onClick={() =>
                onChange({ ...c, adjacent: true, dest: null, destName: null, prep: undefined, place: undefined })
              }
            >
              cambia stanza (a caso)
            </button>
          </div>
          {!c.adjacent && (
            <select
              value={c.dest ?? ''}
              onChange={(e) => {
                const r = menu.rooms.find((x) => x.id === e.target.value)
                if (r)
                  onChange({
                    ...c,
                    dest: r.id,
                    destName: r.name,
                    ...prepPlace({ name: r.name, kind: 'stanza' })
                  })
              }}
            >
              {menu.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
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
      {c.op === 'teleport' && (
        <>
          <span className="cons-arrow">il giocatore →</span>
          <select
            value={c.room}
            onChange={(e) => {
              const r = menu.rooms.find((x) => x.id === e.target.value)
              if (r) onChange({ op: 'teleport', room: r.id, name: r.name })
            }}
          >
            {menu.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </>
      )}
      {c.op === 'end' && (
        <>
          <select
            value={c.outcome}
            onChange={(e) =>
              onChange({
                op: 'end',
                outcome: e.target.value as 'vinci' | 'perdi' | 'termina',
                message: c.message ?? null
              })
            }
          >
            <option value="vinci">vinci</option>
            <option value="perdi">perdi</option>
            <option value="termina">termina</option>
          </select>
          <input
            type="text"
            placeholder="testo d’esito (opzionale)"
            value={c.message ?? ''}
            onChange={(e) => onChange({ op: 'end', outcome: c.outcome, message: e.target.value || null })}
          />
        </>
      )}
      <button className="cons-del" title="Rimuovi" onClick={onRemove}>
        ×
      </button>
    </div>
  )
}
