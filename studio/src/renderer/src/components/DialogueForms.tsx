import { useState } from 'react'
import { useStudio } from '../store'
import type {
  DialoguesMenu,
  DialogueNode,
  DialogueOptionView,
  RuleCondition,
  RuleConsequence,
  SerializeSpec,
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
  comeGruppo,
  semplifica,
  type ConsKind
} from './logicBuilder'
import Finestra from './Finestra'

// === Modale: crea un NODO di dialogo (battuta) o ne modifica la battuta =========
// In creazione genera, in un solo blocco: l'eventuale «X è un personaggio.», la
// battuta «X al nodo "n" dice "…".» e, se spuntato, «Il dialogo di X comincia con
// "n".». In modifica sostituisce solo la frase della battuta (lineSpan).

export function DialogueNodeForm({
  menu,
  node,
  onDone
}: {
  menu: DialoguesMenu
  node?: DialogueNode | null
  onDone: () => void
}): JSX.Element {
  const applyStatement = useStudio((s) => s.applyStatement)
  const appendStatements = useStudio((s) => s.appendStatements)
  const inModifica = !!node

  const npcIds = new Set(menu.npcs.map((n) => n.id))
  const defaultSpeaker = node?.speaker?.id ?? menu.npcs[0]?.id ?? menu.objects[0]?.id ?? ''
  const [speakerId, setSpeakerId] = useState(defaultSpeaker)
  const [label, setLabel] = useState(node?.label ?? '')
  const [line, setLine] = useState(node?.line ?? '')
  const [entry, setEntry] = useState(false)

  const speakerObj = menu.objects.find((o) => o.id === speakerId)
  const speakerName = node?.speaker?.name ?? speakerObj?.name ?? ''
  const isNpc = inModifica ? true : npcIds.has(speakerId)

  const valido =
    speakerName.trim().length > 0 && label.trim().length > 0 && line.trim().length > 0

  const salva = async (): Promise<void> => {
    if (!valido) return
    if (inModifica && node?.lineSpan) {
      await applyStatement(
        { op: 'node_line', speaker: speakerName, node: node.label, line: line.trim() },
        node.lineSpan
      )
      onDone()
      return
    }
    const specs: SerializeSpec[] = []
    if (!isNpc) specs.push({ op: 'npc_decl', name: speakerName })
    specs.push({ op: 'node_line', speaker: speakerName, node: label.trim(), line: line.trim() })
    if (entry) specs.push({ op: 'dialogue_start', name: speakerName, node: label.trim() })
    await appendStatements(specs)
    onDone()
  }

  return (
    <Finestra
      titolo={inModifica ? 'Modifica la battuta' : 'Un nodo di dialogo nuovo'}
      sottotitolo="Un nodo è un momento della conversazione: chi parla, che cosa dice, e poi le risposte del giocatore."
      onChiudi={onDone}
      larga
      azioni={
        <>
          <button className="btn btn-quieto" onClick={onDone}>
            Annulla
          </button>
          <button className="btn btn-primario" disabled={!valido} onClick={() => void salva()}>
            {inModifica ? 'Scrivi la battuta' : 'Crea il nodo'}
          </button>
        </>
      }
    >
        <div className="modulo">
          <div className="objed-field">
            <label>Chi parla (personaggio)</label>
            {menu.objects.length === 0 ? (
              <span className="nota-riquadro">
                crea prima un oggetto/personaggio (scheda 📦 Oggetti)
              </span>
            ) : inModifica ? (
              <input type="text" value={speakerName} disabled />
            ) : (
              <>
                <select value={speakerId} onChange={(e) => setSpeakerId(e.target.value)}>
                  {menu.npcs.length > 0 && (
                    <optgroup label="Personaggi">
                      {menu.npcs.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Altri oggetti (li rende personaggi)">
                    {menu.objects
                      .filter((o) => !npcIds.has(o.id))
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
                {!isNpc && speakerName && (
                  <p className="aiuto">
                    «{speakerName}» diventerà un personaggio (verrà aggiunto «è un personaggio»).
                  </p>
                )}
              </>
            )}
          </div>

          <div className="objed-field">
            <label>Etichetta del nodo (un nome breve, lo scegli tu)</label>
            {inModifica ? (
              <input type="text" value={label} disabled />
            ) : (
              <input
                type="text"
                placeholder="es. accoglienza"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            )}
          </div>

          <div className="objed-field">
            <label>Battuta (cosa dice il personaggio a questo nodo)</label>
            <textarea
              rows={3}
              placeholder="es. Cosa diavolo vuoi?"
              value={line}
              onChange={(e) => setLine(e.target.value)}
            />
          </div>

          {!inModifica && (
            <label className="spunta" title="Il nodo da cui comincia la conversazione">
              <input type="checkbox" checked={entry} onChange={(e) => setEntry(e.target.checked)} />
              <span>Il dialogo comincia qui (quando il giocatore scrive «parla con {speakerName || '…'}»)</span>
            </label>
          )}
        </div>
    </Finestra>
  )
}

// === Modale: crea o modifica una OPZIONE del giocatore =========================
// Genera «Al nodo "n" l'opzione "t" [se …] conduce al nodo "d" | chiude il dialogo
// [e adesso …].». Condizione e conseguenze riusano i costruttori condivisi.

export function DialogueOptionForm({
  menu,
  nodeLabel,
  option,
  span,
  onDone
}: {
  menu: DialoguesMenu
  nodeLabel: string
  option?: DialogueOptionView | null
  span?: OutlineSpan | null
  onDone: () => void
}): JSX.Element {
  const applyStatement = useStudio((s) => s.applyStatement)
  const inModifica = !!option
  const [text, setText] = useState(option?.text ?? '')
  const [outcome, setOutcome] = useState<'conduce' | 'chiude'>(option?.outcome ?? 'chiude')
  const [dest, setDest] = useState(option?.dest ?? menu.nodeLabels[0] ?? '')
  const [condition, setCondition] = useState<RuleCondition | null>(
    option?.condition ? comeGruppo(option.condition) : null
  )
  const [cons, setCons] = useState<RuleConsequence[]>(
    option ? arricchisciCons(option.consequences, menu) : []
  )
  const [addKind, setAddKind] = useState<ConsKind>('prop')

  const aggiungiCondizione = (): void => {
    const a = defaultAtom(menu)
    if (a) setCondition({ op: 'and', terms: [a] })
  }
  const aggiungiCons = (): void => {
    const c = defaultCons(addKind, menu)
    if (c) setCons((prev) => [...prev, c])
  }
  const aggiornaCons = (i: number, c: RuleConsequence): void => {
    setCons((prev) => prev.map((x, j) => (j === i ? c : x)))
  }
  const rimuoviCons = (i: number): void => {
    setCons((prev) => prev.filter((_, j) => j !== i))
  }

  const valido = text.trim().length > 0 && (outcome === 'chiude' || dest.trim().length > 0)

  const salva = async (): Promise<void> => {
    if (!valido) return
    const spec: SerializeSpec = {
      op: 'dialogue_option',
      node: nodeLabel,
      text: text.trim(),
      condition: semplifica(condition),
      outcome,
      dest: outcome === 'conduce' ? dest.trim() : undefined,
      consequences: cons
    }
    await applyStatement(spec, span ?? undefined)
    onDone()
  }

  return (
    <Finestra
      titolo={inModifica ? 'Modifica la risposta' : 'Una risposta nuova'}
      sottotitolo={`Al nodo «${nodeLabel}»: che cosa può dire il giocatore, e che cosa succede dopo.`}
      onChiudi={onDone}
      larga
      azioni={
        <>
          <button className="btn btn-quieto" onClick={onDone}>
            Annulla
          </button>
          <button className="btn btn-primario" disabled={!valido} onClick={() => void salva()}>
            {inModifica ? 'Scrivi la risposta' : 'Crea la risposta'}
          </button>
        </>
      }
    >
        <div className="modulo">
          <div className="objed-field">
            <label>Testo dell’opzione (cosa può scegliere il giocatore)</label>
            <input
              type="text"
              placeholder="es. Vorrei un aumento."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="objed-field">
            <label>Cosa fa questa scelta</label>
            <div className="objed-seg">
              <button className={outcome === 'chiude' ? 'on' : ''} onClick={() => setOutcome('chiude')}>
                chiude il dialogo
              </button>
              <button className={outcome === 'conduce' ? 'on' : ''} onClick={() => setOutcome('conduce')}>
                porta a un altro nodo
              </button>
            </div>
            {outcome === 'conduce' && (
              <div className="ruleform-when">
                <span className="cons-arrow">→ nodo</span>
                <input
                  type="text"
                  list="dlg-node-labels"
                  placeholder="etichetta del nodo (anche nuova)"
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="objed-field">
            <label>Solo se… (condizione, opzionale)</label>
            {condition === null ? (
              <button
                className="btn btn-quieto btn-piccolo"
                onClick={aggiungiCondizione}
                disabled={!defaultAtom(menu)}
              >
                + aggiungi condizione
              </button>
            ) : (
              <CondGroup
                node={comeGruppo(condition)}
                menu={menu}
                onChange={(n) => setCondition(n)}
                onRemove={() => setCondition(null)}
                isRoot
              />
            )}
          </div>

          <div className="objed-field">
            <label>Fai questo… (conseguenze, opzionale)</label>
            {cons.length === 0 && <span className="nota-riquadro">nessuna conseguenza</span>}
            {cons.map((c, i) => (
              <ConsRow
                key={i}
                c={c}
                menu={menu}
                onChange={(nc) => aggiornaCons(i, nc)}
                onRemove={() => rimuoviCons(i)}
              />
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
              <button className="btn btn-quieto btn-piccolo" onClick={aggiungiCons}>
                + conseguenza
              </button>
            </div>
          </div>
        </div>
    </Finestra>
  )
}
