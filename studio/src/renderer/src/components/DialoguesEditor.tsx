import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type {
  RuleCondition,
  RuleConsequence,
  DialoguesMenu,
  DialogueNode,
  DialogueOptionView,
  SerializeSpec,
  OutlineSpan
} from '../../../shared/protocol'
import { DialogueNodeForm, DialogueOptionForm } from './DialogueForms'
import { CMP_LABELS, operandoText, conseqRepresentable } from './logicBuilder'

// --- Riassunti leggibili delle condizioni/conseguenze (per le righe in sola lettura) ---

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

function condRepresentable(c: RuleCondition | null): boolean {
  if (!c) return true
  switch (c.op) {
    case 'has':
    case 'prop':
    case 'var':
    case 'playerIn':
    case 'count':
    case 'varEq':
    case 'chance':
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

// Un'opzione è modificabile in-place solo se l'editor sa rigenerarla; i costrutti
// dei Temi 1-5 (operando dinamico, varEq, chance, varCopy, pick) non lo sono ancora
// → resta in sola lettura con «✎ testo» per modificarla a mano senza corromperla.
function optionRepresentable(o: DialogueOptionView): boolean {
  return condRepresentable(o.condition) && o.consequences.every(conseqRepresentable)
}

// Costruisce la frase-opzione completa, sovrascrivendo solo i campi indicati
// (così l'editing inline di testo/esito NON perde condizione e conseguenze).
function optionSpec(
  o: DialogueOptionView,
  nodeLabel: string,
  ov: { text?: string; outcome?: 'conduce' | 'chiude'; dest?: string }
): SerializeSpec {
  const outcome = ov.outcome ?? o.outcome
  return {
    op: 'dialogue_option',
    node: nodeLabel,
    text: (ov.text ?? o.text).trim(),
    condition: o.condition,
    outcome,
    dest: outcome === 'conduce' ? (ov.dest ?? o.dest ?? '').trim() : undefined,
    consequences: o.consequences
  }
}

// === Riga di una RISPOSTA (opzione), editabile in-place ========================

function OptionRow({
  option,
  nodeLabel,
  menu,
  onAdvanced
}: {
  option: DialogueOptionView
  nodeLabel: string
  menu: DialoguesMenu
  onAdvanced: () => void
}): JSX.Element {
  const applyStatement = useStudio((s) => s.applyStatement)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const requestReveal = useStudio((s) => s.requestReveal)
  const [text, setText] = useState(option.text)
  useEffect(() => setText(option.text), [option.text])

  const editable = optionRepresentable(option)
  const span = option.span ?? undefined

  const salva = (ov: { text?: string; outcome?: 'conduce' | 'chiude'; dest?: string }): void => {
    void applyStatement(optionSpec(option, nodeLabel, ov), span)
  }

  if (!editable) {
    return (
      <div className="dlg-opt-row">
        <span className="dlg-opt-text">› “{option.text}”</span>
        {option.condition && <span className="dlg-opt-if">se {condText(option.condition)}</span>}
        <span className="dlg-opt-outcome">
          {option.outcome === 'chiude' ? 'chiude' : `→ ${option.dest ?? '?'}`}
        </span>
        {option.consequences.map((c, k) => (
          <span key={k} className="rule-chip">
            {conseqText(c)}
          </span>
        ))}
        {span && (
          <button
            className="rule-edit"
            title="Troppo complessa per l’editor: modificala nel testo"
            onClick={() => requestReveal(span.file, span.line, 1)}
          >
            ✎ testo
          </button>
        )}
        {span && (
          <button className="rule-del" title="Elimina" onClick={() => void deleteStatement(span)}>
            ×
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="dlg-opt-row">
      <span className="dlg-bullet">›</span>
      <input
        className="dlg-opt-input"
        type="text"
        value={text}
        placeholder="testo della risposta"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text.trim() && text !== option.text) salva({ text })
          else setText(option.text)
        }}
      />
      <div className="objed-seg dlg-opt-esito">
        <button
          className={option.outcome === 'chiude' ? 'on' : ''}
          onClick={() => option.outcome !== 'chiude' && salva({ outcome: 'chiude' })}
        >
          chiude
        </button>
        <button
          className={option.outcome === 'conduce' ? 'on' : ''}
          onClick={() =>
            option.outcome !== 'conduce' &&
            salva({ outcome: 'conduce', dest: option.dest ?? menu.nodeLabels[0] ?? '' })
          }
        >
          → nodo
        </button>
      </div>
      {option.outcome === 'conduce' && (
        <>
          <input
            className="dlg-opt-dest"
            type="text"
            list="dlg-node-labels"
            value={option.dest ?? ''}
            placeholder="nodo (anche nuovo)"
            onChange={(e) => salva({ outcome: 'conduce', dest: e.target.value })}
          />
        </>
      )}
      {(option.condition || option.consequences.length > 0) && (
        <span className="dlg-opt-adv-summary">
          {option.condition && <span className="dlg-opt-if">se {condText(option.condition)}</span>}
          {option.consequences.map((c, k) => (
            <span key={k} className="rule-chip">
              {conseqText(c)}
            </span>
          ))}
        </span>
      )}
      <button className="rule-edit" title="Condizione / conseguenze (avanzate)" onClick={onAdvanced}>
        ⚙
      </button>
      {span && (
        <button className="rule-del" title="Elimina la risposta" onClick={() => void deleteStatement(span)}>
          ×
        </button>
      )}
    </div>
  )
}

// === Scheda di un NODO, editabile in-place =====================================

function NodeCard({
  node,
  menu,
  isEntry,
  npcName,
  npcStartSpan,
  onOption
}: {
  node: DialogueNode
  menu: DialoguesMenu
  isEntry: boolean
  npcName: string | null
  npcStartSpan: OutlineSpan | null
  onOption: (option: DialogueOptionView | null) => void
}): JSX.Element {
  const applyStatement = useStudio((s) => s.applyStatement)
  const appendStatements = useStudio((s) => s.appendStatements)
  const renameDialogueNode = useStudio((s) => s.renameDialogueNode)
  const deleteDialogueNode = useStudio((s) => s.deleteDialogueNode)

  const [line, setLine] = useState(node.line)
  useEffect(() => setLine(node.line), [node.line])
  const [editLabel, setEditLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(node.label)
  // Bozza per «aggiungi battuta» quando il nodo esiste solo come destinazione.
  const [newSpeaker, setNewSpeaker] = useState(menu.npcs[0]?.id ?? menu.objects[0]?.id ?? '')
  const [newLine, setNewLine] = useState('')

  const speakerName = node.speaker?.name ?? ''

  const salvaBattuta = (): void => {
    if (node.lineSpan && node.speaker && line.trim() && line !== node.line) {
      void applyStatement(
        { op: 'node_line', speaker: node.speaker.name, node: node.label, line: line.trim() },
        node.lineSpan
      )
    } else if (line !== node.line) {
      setLine(node.line)
    }
  }

  const cambiaSpeaker = async (id: string): Promise<void> => {
    const o = menu.objects.find((x) => x.id === id)
    if (!o || !node.lineSpan) return
    // Se il nuovo speaker non è ancora un personaggio, prima lo promuove (append in
    // fondo → non sposta lo span della battuta), poi riscrive la battuta.
    if (!menu.npcs.some((n) => n.id === id)) await appendStatements([{ op: 'npc_decl', name: o.name }])
    await applyStatement(
      { op: 'node_line', speaker: o.name, node: node.label, line: node.line },
      node.lineSpan
    )
  }

  const confermaRename = (): void => {
    setEditLabel(false)
    if (labelDraft.trim() && labelDraft.trim() !== node.label) {
      void renameDialogueNode(node.label, labelDraft.trim())
    } else {
      setLabelDraft(node.label)
    }
  }

  const toggleEntry = (): void => {
    if (!npcName) return
    void applyStatement(
      { op: 'dialogue_start', name: npcName, node: node.label },
      npcStartSpan ?? undefined
    )
  }

  const aggiungiBattuta = (): void => {
    const o = menu.objects.find((x) => x.id === newSpeaker)
    if (!o || !newLine.trim()) return
    const specs: SerializeSpec[] = []
    if (!menu.npcs.some((n) => n.id === newSpeaker)) specs.push({ op: 'npc_decl', name: o.name })
    specs.push({ op: 'node_line', speaker: o.name, node: node.label, line: newLine.trim() })
    void appendStatements(specs)
    setNewLine('')
  }

  return (
    <div className="dlg-node">
      <div className="dlg-node-head">
        <span className="dlg-node-mark">◈</span>
        {editLabel ? (
          <input
            className="dlg-label-input"
            type="text"
            value={labelDraft}
            autoFocus
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={confermaRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confermaRename()
              if (e.key === 'Escape') {
                setEditLabel(false)
                setLabelDraft(node.label)
              }
            }}
          />
        ) : (
          <button
            className="dlg-label"
            title="Rinomina il nodo (aggiorna tutti i riferimenti)"
            onClick={() => {
              setLabelDraft(node.label)
              setEditLabel(true)
            }}
          >
            {node.label} <span className="dlg-pencil">✎</span>
          </button>
        )}

        {node.speaker ? (
          <select
            className="dlg-speaker"
            value={node.speaker.id}
            title="Chi parla a questo nodo"
            onChange={(e) => void cambiaSpeaker(e.target.value)}
          >
            {menu.objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="rule-global">(senza battuta)</span>
        )}

        {npcName && (
          <button
            className={'dlg-star' + (isEntry ? ' on' : '')}
            title={isEntry ? `Nodo d’ingresso di ${npcName}` : `Rendi nodo d’ingresso di ${npcName}`}
            onClick={toggleEntry}
          >
            {isEntry ? '★' : '☆'}
          </button>
        )}

        <button
          className="rule-del"
          title="Elimina l’intero nodo (battuta + risposte)"
          onClick={() => void deleteDialogueNode(node.label)}
        >
          🗑
        </button>
      </div>

      {node.lineSpan ? (
        <textarea
          className="dlg-battuta"
          rows={2}
          value={line}
          placeholder="battuta del personaggio"
          onChange={(e) => setLine(e.target.value)}
          onBlur={salvaBattuta}
        />
      ) : (
        <div className="dlg-addline">
          <span className="insp-none">Questo nodo è citato ma non ha battuta.</span>
          <div className="ruleform-when">
            <select value={newSpeaker} onChange={(e) => setNewSpeaker(e.target.value)}>
              {menu.objects.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="scrivi la battuta…"
              value={newLine}
              onChange={(e) => setNewLine(e.target.value)}
            />
            <button className="modal-btn ghost" disabled={!newLine.trim()} onClick={aggiungiBattuta}>
              + battuta
            </button>
          </div>
        </div>
      )}

      <div className="dlg-options">
        {node.options.map((o, j) => (
          <OptionRow
            key={j}
            option={o}
            nodeLabel={node.label}
            menu={menu}
            onAdvanced={() => onOption(o)}
          />
        ))}
        <button
          className="modal-btn ghost dlg-add-opt"
          title="Aggiungi una risposta del giocatore"
          onClick={() =>
            void applyStatement({
              op: 'dialogue_option',
              node: node.label,
              text: 'Nuova risposta',
              outcome: 'chiude',
              consequences: []
            })
          }
        >
          + risposta
        </button>
      </div>
    </div>
  )
}

// === Pannello principale =======================================================

export default function DialoguesEditor(): JSX.Element {
  const dialogues = useStudio((s) => s.dialogues)
  const loading = useStudio((s) => s.dialoguesLoading)
  const loadDialogues = useStudio((s) => s.loadDialogues)
  const applyStatement = useStudio((s) => s.applyStatement)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))

  const [nodeModal, setNodeModal] = useState(false)
  const [optionModal, setOptionModal] = useState<{
    nodeLabel: string
    option: DialogueOptionView | null
    span: OutlineSpan | null
  } | null>(null)
  const [promote, setPromote] = useState('')

  if (!isFav) {
    return <div className="insp-empty">Apri un file .fav per vedere i dialoghi e i personaggi.</div>
  }
  if (!dialogues) {
    return (
      <div className="insp-empty">
        {loading ? 'Carico i dialoghi…' : 'Nessun dialogo caricato.'}
        {!loading && (
          <button className="map-reload" onClick={() => void loadDialogues()}>
            ⟳ Carica
          </button>
        )}
      </div>
    )
  }
  if (!dialogues.ok) {
    return (
      <div className="insp-empty">
        Il file contiene errori: correggili per vedere i dialoghi.
        <button className="map-reload" onClick={() => void loadDialogues()}>
          ⟳ Riprova
        </button>
      </div>
    )
  }

  const { npcs, nodes, menu } = dialogues
  const npcById = new Map(npcs.map((n) => [n.id, n]))
  const nonNpc = menu.objects.filter((o) => !npcById.has(o.id))

  return (
    <div className="ruled">
      <div className="insp-top">
        <span className="debug-title">
          Personaggi<span className="debug-count"> · {npcs.length}</span> · Nodi
          <span className="debug-count"> · {nodes.length}</span>
        </span>
        <div>
          <button className="icon-btn" title="Nuovo nodo di dialogo" onClick={() => setNodeModal(true)}>
            ➕
          </button>
          <button className="icon-btn" title="Aggiorna" onClick={() => void loadDialogues()}>
            ⟳
          </button>
        </div>
      </div>

      <datalist id="dlg-node-labels">
        {menu.nodeLabels.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>

      {nodeModal && <DialogueNodeForm menu={menu} onDone={() => setNodeModal(false)} />}
      {optionModal && (
        <DialogueOptionForm
          menu={menu}
          nodeLabel={optionModal.nodeLabel}
          option={optionModal.option}
          span={optionModal.span}
          onDone={() => setOptionModal(null)}
        />
      )}

      <div className="ruled-body">
        {/* ① PERSONAGGI */}
        <div className="dlg-section-title">① Personaggi</div>
        {npcs.length === 0 && <p className="insp-none">nessun personaggio</p>}
        {npcs.map((n, i) => (
          <div key={'npc' + i} className="dlg-npc">
            <span className="dlg-npc-name">👤 {n.name}</span>
            <span className="dlg-opt-outcome">ingresso:</span>
            <select
              value={n.startNode ?? ''}
              onChange={(e) =>
                e.target.value &&
                void applyStatement(
                  { op: 'dialogue_start', name: n.name, node: e.target.value },
                  n.startSpan ?? undefined
                )
              }
            >
              <option value="">— scegli —</option>
              {menu.nodeLabels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            {n.defSpan && (
              <button
                className="rule-del"
                title="Non è più un personaggio (l’oggetto resta)"
                onClick={() => void deleteStatement(n.defSpan!)}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {nonNpc.length > 0 && (
          <div className="ruleform-when dlg-promote">
            <select value={promote} onChange={(e) => setPromote(e.target.value)}>
              <option value="">— rendi personaggio un oggetto —</option>
              {nonNpc.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <button
              className="modal-btn ghost"
              disabled={!promote}
              onClick={() => {
                const o = nonNpc.find((x) => x.id === promote)
                if (o) void applyStatement({ op: 'npc_decl', name: o.name })
                setPromote('')
              }}
            >
              + personaggio
            </button>
          </div>
        )}

        {/* ② NODI / COPIONE */}
        <div className="dlg-section-title">② Copione (nodi)</div>
        {nodes.length === 0 && (
          <p className="insp-none">
            nessun nodo — crea il primo con ➕ (chi parla, un’etichetta e la prima battuta)
          </p>
        )}
        {nodes.map((nd) => {
          const npc = nd.speaker ? npcById.get(nd.speaker.id) : undefined
          return (
            <NodeCard
              key={nd.label}
              node={nd}
              menu={menu}
              isEntry={!!npc && npc.startNode === nd.label}
              npcName={npc?.name ?? null}
              npcStartSpan={npc?.startSpan ?? null}
              onOption={(o) => setOptionModal({ nodeLabel: nd.label, option: o, span: o?.span ?? null })}
            />
          )
        })}
      </div>
    </div>
  )
}
