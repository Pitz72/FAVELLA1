import { useState } from 'react'
import { useStudio } from '../store'
import type {
  Rule,
  GameEvent,
  Demon,
  RuleCondition,
  RuleConsequence,
  ProcedureDef,
  RulesMenu,
  OutlineSpan
} from '../../../shared/protocol'
import RuleForm from './RuleForm'
import Finestra from './Finestra'
import {
  CMP_LABELS,
  operandoText,
  conseqRepresentable,
  conseqText,
  ConsRow,
  consGroups,
  CONS_LABEL,
  defaultCons,
  arricchisciCons,
  type ConsKind
} from './logicBuilder'
import { NonPronto, Vuoto } from './Elenco'
import { IconaAggiorna, IconaChiudi, IconaMatita, IconaPiu } from './Icone'

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
    // [motore 1.3] «X è in Y» / «X è qui», «il personaggio ha X» (si modificano nel testo).
    case 'objIn' as RuleCondition['op']: {
      const o = c as unknown as { name: string; place: string; placeName: string }
      return o.place === 'qui' ? `${o.name} è qui` : `${o.name} è in ${o.placeName}`
    }
    case 'npcHas' as RuleCondition['op']: {
      const o = c as unknown as { npcName: string; name: string }
      return `${o.npcName} ha ${o.name}`
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
  return (
    condRepresentable(r.condition) &&
    r.consequences.every(conseqRepresentable) &&
    (!r.otherwise || r.otherwise.consequences.every(conseqRepresentable))
  )
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

/** [1.2.3 / motore 1.5] Le code di un ramo, come stanno nel testo: «e poi dire "…"» e
 * «e basta». Si leggono qui e si cambiano nel testo (i moduli le conservano). */
function CodaRamo({ thenSay, stops }: { thenSay?: string | null; stops?: boolean }): JSX.Element | null {
  if (!thenSay && !stops) return null
  return (
    <>
      {thenSay && <div className="rule-say">poi di’ “{thenSay}”</div>}
      {stops && (
        <div className="rule-then">
          <span className="rule-chip" title="La regola ferma l’azione: dopo di lei non succede altro">
            e basta
          </span>
        </div>
      )}
    </>
  )
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
  // [1.6.0 / C1] La modale delle procedure (null = chiusa; proc=null = creazione).
  const [editingProc, setEditingProc] = useState<{ proc: ProcedureDef | null; span: OutlineSpan | null } | null>(null)

  if (!isFav) return <NonPronto cosa="le regole" stato="nessun-file" />
  if (!rules) return <NonPronto cosa="le regole" stato={loading ? 'carico' : 'vuoto'} onRiprova={() => void loadRules()} />
  if (!rules.ok) return <NonPronto cosa="le regole" stato="errori" onRiprova={() => void loadRules()} />

  const { rules: regole, events, demons } = rules
  const procedures = rules.procedures ?? []

  return (
    <div className="ruled">
      <div className="pannello-testa">
        <h2 className="pannello-titolo">
          Regole <span className="elenco-conto">{regole.length}</span>
          <span className="pannello-sep" aria-hidden="true">·</span>
          Eventi <span className="elenco-conto">{events.length}</span>
          <span className="pannello-sep" aria-hidden="true">·</span>
          Demoni <span className="elenco-conto">{demons.length}</span>
          <span className="pannello-sep" aria-hidden="true">·</span>
          Procedure <span className="elenco-conto">{procedures.length}</span>
        </h2>
        <button className="btn-icona" aria-label="Rileggi le regole" title="Rileggi" onClick={() => void loadRules()}>
          <IconaAggiorna />
        </button>
        <button
          className="btn btn-quieto btn-piccolo"
          title="Una procedura raccoglie più conseguenze sotto un nome, da richiamare con «esegui»"
          onClick={() => setEditingProc((v) => (v ? null : { proc: null, span: null }))}
        >
          <IconaPiu size={15} />
          Nuova procedura
        </button>
        <button
          className="btn btn-accento btn-piccolo"
          onClick={() => setEditing((v) => (v ? null : { rule: null, event: null, demon: null, span: null }))}
        >
          <IconaPiu size={15} />
          Nuova regola
        </button>
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

      {editingProc && (
        <ProcedureForm
          menu={rules.menu}
          proc={editingProc.proc}
          span={editingProc.span}
          nomiUsati={procedures.map((p) => p.name)}
          onDone={() => setEditingProc(null)}
        />
      )}

      <div className="ruled-body">
        {regole.length === 0 && events.length === 0 && demons.length === 0 && procedures.length === 0 && (
          <Vuoto titolo="Ancora nessuna regola">
            Una regola dice che cosa succede quando il giocatore fa qualcosa: «Invece di apri la porta: …». Creane una con «Nuova regola».
          </Vuoto>
        )}

        {procedures.map((p, i) => {
          const editabile = p.consequences.every(conseqRepresentable)
          return (
            <div key={'p' + i} className="rule-card procedura">
              <div className="rule-head">
                <span className="rule-verb">procedura</span>
                <span className="rule-target">{p.name}</span>
                {p.span &&
                  (editabile ? (
                    <button className="btn btn-quieto btn-piccolo" onClick={() => setEditingProc({ proc: p, span: p.span })}>
                      <IconaMatita />
                      Modifica
                    </button>
                  ) : (
                    <button className="btn btn-quieto btn-piccolo" title="Troppo complessa per l’editor: modificala nel testo" onClick={() => requestReveal(p.span!.file, p.span!.line, 1)}>
                      <IconaMatita />
                      Nel testo
                    </button>
                  ))}
                {p.span && (
                  <button className="btn-icona" aria-label={`Elimina la procedura ${p.name}`} title="Elimina questa procedura" onClick={() => void deleteStatement(p.span!, `Procedura «${p.name}» tolta`)}>
                    <IconaChiudi />
                  </button>
                )}
              </div>
              <div className="rule-then">
                {p.consequences.map((c, j) => (
                  <span key={j} className="rule-chip">
                    {conseqText(c)}
                  </span>
                ))}
              </div>
            </div>
          )
        })}

        {regole.map((r, i) => (
          <div key={'r' + i} className="rule-card">
            <div className="rule-head">
              <span className={'rule-phase fase-' + (r.phase ?? 'invece')}>
                {r.phase === 'prima' ? 'prima di' : r.phase === 'dopo' ? 'dopo di' : 'invece di'}
              </span>
              <span className="rule-verb">{(r.verbs && r.verbs.length > 1 ? r.verbs : [r.verb]).join(' oppure ')}</span>
              {r.target ? (
                <span className="rule-target">
                  {r.target.name}
                  {r.target.prep && r.target.secondaryName
                    ? ` ${r.target.prep} ${r.target.secondaryName}`
                    : ''}
                </span>
              ) : (
                <span className="rule-global">(qualunque cosa)</span>
              )}
              {r.span &&
                (ruleRepresentable(r) ? (
                  <button className="btn btn-quieto btn-piccolo" onClick={() => setEditing({ rule: r, span: r.span })}>
                    <IconaMatita />
                    Modifica
                  </button>
                ) : (
                  <button className="btn btn-quieto btn-piccolo" title="Troppo complessa per l’editor: modificala nel testo" onClick={() => requestReveal(r.span!.file, r.span!.line, 1)}>
                    <IconaMatita />
                    Nel testo
                  </button>
                ))}
              {r.span && (
                <button className="btn-icona" aria-label="Elimina questa regola" title="Elimina questa regola" onClick={() => void deleteStatement(r.span!, 'Regola tolta')}>
                  <IconaChiudi />
                </button>
              )}
            </div>
            {r.firstTime && <div className="rule-when">per la prima volta</div>}
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
            <CodaRamo thenSay={r.thenSay} stops={r.stops} />
            {r.otherwise && (
              <div className="rule-else">
                <div className="rule-when">altrimenti</div>
                <div className="rule-say">di’ “{r.otherwise.response}”</div>
                {r.otherwise.consequences.length > 0 && (
                  <div className="rule-then">
                    {r.otherwise.consequences.map((c, j) => (
                      <span key={j} className="rule-chip">
                        {conseqText(c)}
                      </span>
                    ))}
                  </div>
                )}
                <CodaRamo thenSay={r.otherwise.thenSay} stops={r.otherwise.stops} />
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
                  <button className="btn btn-quieto btn-piccolo" onClick={() => setEditing({ event: e, span: e.span })}>
                    <IconaMatita />
                    Modifica
                  </button>
                ) : (
                  <button className="btn btn-quieto btn-piccolo" title="Troppo complesso per l’editor: modificalo nel testo" onClick={() => requestReveal(e.span!.file, e.span!.line, 1)}>
                    <IconaMatita />
                    Nel testo
                  </button>
                ))}
              {e.span && (
                <button className="btn-icona" aria-label="Elimina questo evento" title="Elimina questo evento" onClick={() => void deleteStatement(e.span!, 'Evento tolto')}>
                  <IconaChiudi />
                </button>
              )}
            </div>
            {e.response && <div className="rule-say">di’ “{e.response}”</div>}
            {e.consequences.length > 0 && (
              <div className="rule-then">
                {e.consequences.map((c, j) => (
                  <span key={j} className="rule-chip">
                    {conseqText(c)}
                  </span>
                ))}
              </div>
            )}
            <CodaRamo thenSay={e.thenSay} />
          </div>
        ))}

        {demons.map((d, i) => (
          <div key={'d' + i} className="rule-card demon">
            <div className="rule-head">
              <span className="rule-verb">
                {d.mode === 'ogni' ? 'ogni turno se' : 'quando diventa vero'}
              </span>
              {d.condition && <span className="rule-target">{condText(d.condition)}</span>}
              {d.firstTime && <span className="rule-global">per la prima volta</span>}
              {d.span &&
                (demonRepresentable(d) ? (
                  <button className="btn btn-quieto btn-piccolo" onClick={() => setEditing({ demon: d, span: d.span })}>
                    <IconaMatita />
                    Modifica
                  </button>
                ) : (
                  <button className="btn btn-quieto btn-piccolo" title="Troppo complesso per l’editor: modificalo nel testo" onClick={() => requestReveal(d.span!.file, d.span!.line, 1)}>
                    <IconaMatita />
                    Nel testo
                  </button>
                ))}
              {d.span && (
                <button className="btn-icona" aria-label="Elimina questo demone" title="Elimina questo demone" onClick={() => void deleteStatement(d.span!, 'Demone tolto')}>
                  <IconaChiudi />
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
            <CodaRamo thenSay={d.thenSay} />
          </div>
        ))}
      </div>
    </div>
  )
}

// [1.6.0 / C1] La modale per creare/riscrivere una procedura nominata: un nome e una
// catena di conseguenze (lo stesso builder delle regole). «esegui <procedura>» può
// richiamarne un'altra. Round-trip via l'op procedure_def (sostituisce lo span).
function ProcedureForm({
  menu,
  proc,
  span,
  nomiUsati,
  onDone
}: {
  menu: RulesMenu
  proc: ProcedureDef | null
  span: OutlineSpan | null
  nomiUsati: string[]
  onDone: () => void
}): JSX.Element {
  const applyStatement = useStudio((s) => s.applyStatement)
  const inModifica = !!proc
  const [nome, setNome] = useState(proc?.name ?? '')
  const [cons, setCons] = useState<RuleConsequence[]>(arricchisciCons(proc?.consequences ?? [], menu))
  const [addKind, setAddKind] = useState<ConsKind>('prop')

  const nomeNorm = nome.trim().toLowerCase()
  // In creazione il nome dev'essere libero; in modifica è fisso (così gli «esegui» non si rompono).
  const nomeLibero = inModifica || (!!nomeNorm && !nomiUsati.map((n) => n.toLowerCase()).includes(nomeNorm))
  const valido = nome.trim().length > 0 && cons.length > 0 && nomeLibero

  const aggiungi = (): void => {
    const c = defaultCons(addKind, menu)
    if (c) setCons((prev) => [...prev, c])
  }
  const salva = async (): Promise<void> => {
    if (!valido) return
    await applyStatement({ op: 'procedure_def', name: nome.trim(), consequences: cons }, span ?? undefined)
    onDone()
  }

  return (
    <Finestra
      titolo={inModifica ? 'Modifica la procedura' : 'Una procedura nuova'}
      sottotitolo="Una procedura raccoglie più conseguenze sotto un nome; le regole la richiamano con «esegui»."
      onChiudi={onDone}
      larga
      azioni={
        <>
          <button className="btn btn-quieto" onClick={onDone}>
            Annulla
          </button>
          <button className="btn btn-primario" disabled={!valido} onClick={() => void salva()}>
            {inModifica ? 'Scrivi la procedura' : 'Crea la procedura'}
          </button>
        </>
      }
    >
      <div className="modulo">
        <div className="objed-field">
          <label>Nome</label>
          <input
            autoFocus={!inModifica}
            value={nome}
            disabled={inModifica}
            aria-invalid={!nomeLibero}
            placeholder="es. riposa un poco"
            onChange={(e) => setNome(e.target.value)}
          />
          {inModifica ? (
            <p className="aiuto">Il nome non si cambia qui: rinominarlo scollegherebbe gli «esegui» che lo citano.</p>
          ) : (
            !nomeLibero && nomeNorm && <p className="errore-campo">Esiste già una procedura con questo nome.</p>
          )}
        </div>

        <div className="objed-field">
          <label>Fai questo… (almeno una conseguenza)</label>
          {cons.length === 0 && <span className="nota-riquadro">nessuna conseguenza</span>}
          {cons.map((c, i) => (
            <ConsRow
              key={i}
              c={c}
              menu={menu}
              onChange={(nc) => setCons((prev) => prev.map((x, j) => (j === i ? nc : x)))}
              onRemove={() => setCons((prev) => prev.filter((_, j) => j !== i))}
            />
          ))}
          <div className="objed-add">
            <select value={addKind} onChange={(e) => setAddKind(e.target.value as ConsKind)}>
              {consGroups(menu).map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.kinds.map((k) => (
                    <option key={k} value={k}>
                      {CONS_LABEL[k]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button className="btn btn-quieto btn-piccolo" onClick={aggiungi}>
              + conseguenza
            </button>
          </div>
        </div>
      </div>
    </Finestra>
  )
}
