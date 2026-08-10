import { useState } from 'react'
import { useStudio } from '../store'
import type {
  Rule,
  GameEvent,
  Demon,
  RuleCondition,
  RuleConsequence,
  OutlineSpan
} from '../../../shared/protocol'
import RuleForm from './RuleForm'
import { CMP_LABELS, operandoText, conseqRepresentable } from './logicBuilder'

// --- Riassunti leggibili (sola lettura, 6c.1) ---

/** Avvolge tra parentesi le sotto-condizioni composite (per leggibilità). */
function gruppo(c: RuleCondition): string {
  return c.op === 'and' || c.op === 'or' ? `(${condText(c)})` : condText(c)
}

function condText(c: RuleCondition): string {
  switch (c.op) {
    case 'has':
      return `il giocatore ha ${c.name}`
    case 'prop':
      return `${c.name} è ${c.prop}`
    case 'var':
      return `${c.name} è ${c.value}`
    case 'count':
      return `${c.name} ${CMP_LABELS[c.cmp]} ${operandoText(c.value)}`
    case 'playerIn':
      return `il giocatore è in ${c.name}`
    case 'varEq':
      return `${c.name} è come ${c.other}`
    case 'chance':
      return `càpita (${c.num} su ${c.den})`
    case 'not': {
      const t = c.term
      if (t.op === 'has') return `il giocatore non ha ${t.name}`
      if (t.op === 'prop') return `${t.name} non è ${t.prop}`
      if (t.op === 'var') return `${t.name} non è ${t.value}`
      if (t.op === 'varEq') return `${t.name} non è come ${t.other}`
      if (t.op === 'playerIn') return `il giocatore non è in ${t.name}`
      return `non ${gruppo(t)}`
    }
    case 'and':
      return c.terms.map(gruppo).join(' e ')
    case 'or':
      return c.terms.map(gruppo).join(' oppure ')
    default:
      return '…'
  }
}

// --- Rappresentabilità: una regola si riapre nella modale solo se l'editor sa
// ricostruirla. Altrimenti → «modifica nel testo» (come le descrizioni condizionali).
// I costrutti dei Temi 1-5 (operando dinamico, varEq, chance, varCopy, pick) NON
// sono ancora ricostruibili dalle form → restano in sola lettura per non corromperli. ---

function condRepresentable(c: RuleCondition | null): boolean {
  if (!c) return true
  switch (c.op) {
    case 'has':
    case 'prop':
    case 'var':
    case 'playerIn':
    case 'count': // operando (numero o '[contatore]') editabile via OperandoInput
    case 'varEq': // Tema 3: «X è come Y»
    case 'chance': // Tema 2c: «càpita (N su M)»
      return true
    case 'not':
      return ['has', 'prop', 'var', 'playerIn', 'varEq'].includes(c.term.op)
    case 'and':
    case 'or':
      return c.terms.every(condRepresentable)
    default:
      return false // 'unknown'
  }
}

function ruleRepresentable(r: Rule): boolean {
  return condRepresentable(r.condition) && r.consequences.every(conseqRepresentable)
}

// Un evento è sempre riapribile nella modale se le sue conseguenze sono note
// (rappresentabili): non ha condizione né bersaglio da ricostruire.
function eventRepresentable(e: GameEvent): boolean {
  return e.consequences.every(conseqRepresentable)
}

// Un demone è riapribile se condizione + conseguenze sono ricostruibili.
function demonRepresentable(d: Demon): boolean {
  return condRepresentable(d.condition) && d.consequences.every(conseqRepresentable)
}

function conseqText(c: RuleConsequence): string {
  switch (c.op) {
    case 'prop':
      return `${c.name} → ${c.prop}`
    case 'var':
      return `${c.name} → ${c.value}`
    case 'count':
      return c.mode === 'diventa'
        ? `${c.name} diventa ${operandoText(c.value)}`
        : `${c.mode} ${c.name}${c.value !== 1 ? ' di ' + operandoText(c.value) : ''}`
    case 'move':
      return `sposta ${c.name} → ${c.destName}`
    case 'teleport':
      return `il giocatore → ${c.name}`
    case 'end':
      return c.message ? `${c.outcome} “${c.message}”` : c.outcome
    case 'varCopy':
      return `${c.name} → (come) ${c.from}`
    case 'pick':
      return `${c.name} → uno fra ${c.values.join(', ')}`
    case 'dark':
      return c.dark ? `${c.name} → buia` : `${c.name} → illuminata`
    case 'movePNG':
      return c.adjacent ? `${c.name} → cambia stanza` : `${c.name} → ${c.destName ?? '?'}`
    default:
      return '…'
  }
}

export default function RulesEditor(): JSX.Element {
  const rules = useStudio((s) => s.rules)
  const loading = useStudio((s) => s.rulesLoading)
  const loadRules = useStudio((s) => s.loadRules)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const requestReveal = useStudio((s) => s.requestReveal)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))
  // null = modale chiusa; tutto-null = creazione; {rule}/{event}/{demon} = modifica.
  const [editing, setEditing] = useState<{
    rule?: Rule | null
    event?: GameEvent | null
    demon?: Demon | null
    span: OutlineSpan | null
  } | null>(null)

  if (!isFav) {
    return <div className="insp-empty">Apri un file .fav per vedere le regole e gli eventi.</div>
  }
  if (!rules) {
    return (
      <div className="insp-empty">
        {loading ? 'Carico le regole…' : 'Nessuna regola caricata.'}
        {!loading && (
          <button className="map-reload" onClick={() => void loadRules()}>
            ⟳ Carica
          </button>
        )}
      </div>
    )
  }
  if (!rules.ok) {
    return (
      <div className="insp-empty">
        Il file contiene errori: correggili per vedere le regole.
        <button className="map-reload" onClick={() => void loadRules()}>
          ⟳ Riprova
        </button>
      </div>
    )
  }

  const { rules: regole, events, demons } = rules

  return (
    <div className="ruled">
      <div className="insp-top">
        <span className="debug-title">
          Regole<span className="debug-count"> · {regole.length}</span> · Eventi
          <span className="debug-count"> · {events.length}</span> · Demoni
          <span className="debug-count"> · {demons.length}</span>
        </span>
        <div>
          <button
            className="icon-btn"
            title="Nuova regola, evento o demone"
            onClick={() =>
              setEditing((v) => (v ? null : { rule: null, event: null, demon: null, span: null }))
            }
          >
            ➕
          </button>
          <button className="icon-btn" title="Aggiorna" onClick={() => void loadRules()}>
            ⟳
          </button>
        </div>
      </div>

      {editing && (
        <RuleForm
          menu={rules.menu}
          rule={editing.rule}
          event={editing.event}
          demon={editing.demon}
          span={editing.span}
          onDone={() => setEditing(null)}
        />
      )}

      <div className="ruled-body">
        {regole.length === 0 && events.length === 0 && demons.length === 0 && (
          <p className="insp-none">nessuna regola, evento o demone — creane uno con ➕</p>
        )}

        {regole.map((r, i) => (
          <div key={'r' + i} className="rule-card">
            <div className="rule-head">
              <span className="rule-verb">{r.verb}</span>
              {r.target ? (
                <span className="rule-target">
                  {r.target.name}
                  {r.target.prep && r.target.secondaryName
                    ? ` ${r.target.prep} ${r.target.secondaryName}`
                    : ''}
                </span>
              ) : (
                <span className="rule-global">(globale)</span>
              )}
              {r.span &&
                (ruleRepresentable(r) ? (
                  <button
                    className="rule-edit"
                    title="Modifica questa regola"
                    onClick={() => setEditing({ rule: r, span: r.span })}
                  >
                    ✎
                  </button>
                ) : (
                  <button
                    className="rule-edit"
                    title="Troppo complessa per l’editor: modificala nel testo"
                    onClick={() => requestReveal(r.span!.file, r.span!.line, 1)}
                  >
                    ✎ testo
                  </button>
                ))}
              {r.span && (
                <button
                  className="rule-del"
                  title="Elimina questa regola"
                  onClick={() => void deleteStatement(r.span!)}
                >
                  ×
                </button>
              )}
            </div>
            {r.condition && <div className="rule-when">se {condText(r.condition)}</div>}
            <div className="rule-say">di’ “{r.response}”</div>
            {r.consequences.length > 0 && (
              <div className="rule-then">
                {r.consequences.map((c, j) => (
                  <span key={j} className="rule-chip">
                    {conseqText(c)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {events.map((e, i) => (
          <div key={'e' + i} className="rule-card event">
            <div className="rule-head">
              <span className="rule-verb">
                {e.mode === 'al' ? `al turno ${e.n}` : `ogni ${e.n} turni`}
              </span>
              {e.span &&
                (eventRepresentable(e) ? (
                  <button
                    className="rule-edit"
                    title="Modifica questo evento"
                    onClick={() => setEditing({ event: e, span: e.span })}
                  >
                    ✎
                  </button>
                ) : (
                  <button
                    className="rule-edit"
                    title="Troppo complesso per l’editor: modificalo nel testo"
                    onClick={() => requestReveal(e.span!.file, e.span!.line, 1)}
                  >
                    ✎ testo
                  </button>
                ))}
              {e.span && (
                <button
                  className="rule-del"
                  title="Elimina questo evento"
                  onClick={() => void deleteStatement(e.span!)}
                >
                  ×
                </button>
              )}
            </div>
            <div className="rule-say">di’ “{e.response}”</div>
            {e.consequences.length > 0 && (
              <div className="rule-then">
                {e.consequences.map((c, j) => (
                  <span key={j} className="rule-chip">
                    {conseqText(c)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {demons.map((d, i) => (
          <div key={'d' + i} className="rule-card demon">
            <div className="rule-head">
              <span className="rule-verb">
                {d.mode === 'ogni' ? 'ogni turno se' : 'quando diventa vero'}
              </span>
              {d.condition && <span className="rule-target">{condText(d.condition)}</span>}
              {d.span &&
                (demonRepresentable(d) ? (
                  <button
                    className="rule-edit"
                    title="Modifica questo demone"
                    onClick={() => setEditing({ demon: d, span: d.span })}
                  >
                    ✎
                  </button>
                ) : (
                  <button
                    className="rule-edit"
                    title="Troppo complesso per l’editor: modificalo nel testo"
                    onClick={() => requestReveal(d.span!.file, d.span!.line, 1)}
                  >
                    ✎ testo
                  </button>
                ))}
              {d.span && (
                <button
                  className="rule-del"
                  title="Elimina questo demone"
                  onClick={() => void deleteStatement(d.span!)}
                >
                  ×
                </button>
              )}
            </div>
            <div className="rule-say">di’ “{d.response}”</div>
            {d.consequences.length > 0 && (
              <div className="rule-then">
                {d.consequences.map((c, j) => (
                  <span key={j} className="rule-chip">
                    {conseqText(c)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
