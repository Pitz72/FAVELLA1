import { useState } from 'react'
import { useStudio } from '../store'
import type { RuleCondition, RuleConsequence } from '../../../shared/protocol'
import RuleForm from './RuleForm'

// --- Riassunti leggibili (sola lettura, 6c.1) ---

const CMP_LABEL: Record<'==' | '>=' | '>' | '<', string> = {
  '==': 'è',
  '>=': 'è almeno',
  '>': 'è più di',
  '<': 'è meno di'
}

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
      return `${c.name} ${CMP_LABEL[c.cmp]} ${c.value}`
    case 'not': {
      const t = c.term
      if (t.op === 'has') return `il giocatore non ha ${t.name}`
      if (t.op === 'prop') return `${t.name} non è ${t.prop}`
      if (t.op === 'var') return `${t.name} non è ${t.value}`
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

function conseqText(c: RuleConsequence): string {
  switch (c.op) {
    case 'prop':
      return `${c.name} → ${c.prop}`
    case 'var':
      return `${c.name} → ${c.value}`
    case 'count':
      return c.mode === 'diventa'
        ? `${c.name} diventa ${c.value}`
        : `${c.mode} ${c.name}${c.value !== 1 ? ' di ' + c.value : ''}`
    case 'move':
      return `sposta ${c.name} → ${c.destName}`
    case 'end':
      return c.outcome
    default:
      return '…'
  }
}

export default function RulesEditor(): JSX.Element {
  const rules = useStudio((s) => s.rules)
  const loading = useStudio((s) => s.rulesLoading)
  const loadRules = useStudio((s) => s.loadRules)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))
  const [creando, setCreando] = useState(false)

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

  const { rules: regole, events } = rules

  return (
    <div className="ruled">
      <div className="insp-top">
        <span className="debug-title">
          Regole<span className="debug-count"> · {regole.length}</span> · Eventi
          <span className="debug-count"> · {events.length}</span>
        </span>
        <div>
          <button
            className="icon-btn"
            title="Nuova regola"
            onClick={() => setCreando((v) => !v)}
          >
            ➕
          </button>
          <button className="icon-btn" title="Aggiorna" onClick={() => void loadRules()}>
            ⟳
          </button>
        </div>
      </div>

      {creando && <RuleForm menu={rules.menu} onDone={() => setCreando(false)} />}

      <div className="ruled-body">
        {regole.length === 0 && events.length === 0 && (
          <p className="insp-none">
            nessuna regola né evento — la creazione visuale arriva nel prossimo step
          </p>
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
      </div>
    </div>
  )
}
