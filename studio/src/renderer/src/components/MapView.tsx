import { useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Connection,
  type Edge as RFEdge,
  type Node,
  type Edge
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useStudio } from '../store'
import type { WorldGraph } from '../../../shared/protocol'

// Direzioni offerte dal selettore quando si traccia una connessione. FAVELLA crea
// da sé il ritorno opposto, quindi se ne sceglie una sola.
const DIREZIONI_COMUNI = ['nord', 'sud', 'est', 'ovest', 'alto', 'basso']

const GAP_X = 200
const GAP_Y = 130

// Le direzioni di FAVELLA mappano naturalmente su una griglia: è il modo in cui
// si disegnano da sempre le mappe delle avventure testuali. x cresce a destra,
// y cresce in basso. Le direzioni verticali (piani diversi) e quelle ignote
// ricadono su una cella libera vicina (vedi cellaLibera).
const DIR_OFFSET: Record<string, [number, number]> = {
  nord: [0, -1], n: [0, -1],
  sud: [0, 1], s: [0, 1],
  est: [1, 0], e: [1, 0],
  ovest: [-1, 0], o: [-1, 0],
  nordest: [1, -1], nordovest: [-1, -1],
  sudest: [1, 1], sudovest: [-1, 1],
  alto: [1, -1], su: [1, -1], 'sù': [1, -1], sopra: [1, -1],
  basso: [-1, 1], giu: [-1, 1], 'giù': [-1, 1], sotto: [-1, 1]
}

/** Posiziona le stanze su una griglia via BFS seguendo le direzioni delle uscite. */
function disponiStanze(graph: WorldGraph): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>()
  const occupate = new Set<string>()
  const chiave = (x: number, y: number): string => `${x},${y}`

  // Adiacenze: stanza -> [(direzione, destinazione)]
  const usciteDi = new Map<string, Array<[string, string]>>()
  for (const e of graph.edges) {
    if (!usciteDi.has(e.from)) usciteDi.set(e.from, [])
    usciteDi.get(e.from)!.push([e.direction, e.to])
  }

  const cellaLibera = (x: number, y: number): { x: number; y: number } => {
    if (!occupate.has(chiave(x, y))) return { x, y }
    for (let r = 1; r < 50; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue
          if (!occupate.has(chiave(x + dx, y + dy))) return { x: x + dx, y: y + dy }
        }
      }
    }
    return { x, y }
  }

  const piazza = (id: string, x: number, y: number): void => {
    const c = cellaLibera(x, y)
    pos.set(id, c)
    occupate.add(chiave(c.x, c.y))
  }

  const start = graph.rooms.find((r) => r.isStart)?.id ?? graph.rooms[0]?.id
  const coda: string[] = []
  if (start) {
    piazza(start, 0, 0)
    coda.push(start)
  }
  while (coda.length) {
    const id = coda.shift()!
    const { x, y } = pos.get(id)!
    for (const [dir, to] of usciteDi.get(id) ?? []) {
      if (pos.has(to)) continue
      const off = DIR_OFFSET[dir] ?? [1, 0]
      piazza(to, x + off[0], y + off[1])
      coda.push(to)
    }
  }

  // Stanze non raggiungibili dalla partenza: impilate sotto il grafo principale.
  let yLibera = Math.max(0, ...[...pos.values()].map((p) => p.y)) + 2
  for (const r of graph.rooms) {
    if (!pos.has(r.id)) {
      piazza(r.id, 0, yLibera)
      yLibera += 1
    }
  }
  return pos
}

/** Unisce gli archi reciproci (auto-ritorno nord/sud) in un solo arco bidirezionale. */
function costruisciArchi(graph: WorldGraph): Edge[] {
  interface Agg { a: string; b: string; fwd?: string; bwd?: string }
  const aggregati = new Map<string, Agg>()
  for (const e of graph.edges) {
    const [a, b] = [e.from, e.to].sort()
    const k = `${a}|${b}`
    const agg = aggregati.get(k) ?? { a, b }
    if (e.from === a) agg.fwd = e.direction
    else agg.bwd = e.direction
    aggregati.set(k, agg)
  }

  const archi: Edge[] = []
  for (const [k, agg] of aggregati) {
    const bidir = agg.fwd && agg.bwd
    const source = agg.fwd ? agg.a : agg.b
    const target = agg.fwd ? agg.b : agg.a
    const label = agg.fwd ?? agg.bwd
    archi.push({
      id: k,
      source,
      target,
      label,
      type: 'smoothstep',
      labelStyle: { fill: '#9ca3af', fontSize: 11 },
      labelBgStyle: { fill: '#24242b' },
      style: { stroke: '#4e9aec', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#4e9aec' },
      ...(bidir
        ? { markerStart: { type: MarkerType.ArrowClosed, color: '#4e9aec' } }
        : {})
    })
  }
  return archi
}

interface MapViewProps {
  // In modalità compatta (riquadri piccoli, es. la finestra di gioco) la
  // minimappa coprirebbe il grafo: la nascondiamo e teniamo solo i controlli.
  compact?: boolean
  // [Fase 6a] Abilita la modifica visuale (solo nell'IDE, non in finestra gioco).
  editable?: boolean
}

export default function MapView({ compact = false, editable = false }: MapViewProps): JSX.Element {
  const graph = useStudio((s) => s.worldGraph)
  const snapshot = useStudio((s) => s.worldSnapshot)
  const loading = useStudio((s) => s.worldLoading)
  const loadGraph = useStudio((s) => s.loadWorldGraph)
  const editMode = useStudio((s) => s.mapEditMode)
  const setEditMode = useStudio((s) => s.setMapEditMode)
  const loadOutline = useStudio((s) => s.loadOutline)
  const addConnection = useStudio((s) => s.mapAddConnection)
  const deleteConnection = useStudio((s) => s.mapDeleteConnection)
  const addRoom = useStudio((s) => s.mapAddRoom)

  // Selettore di direzione per una nuova connessione (drag fra due stanze).
  const [picker, setPicker] = useState<{ from: string; to: string } | null>(null)
  const [dirLibera, setDirLibera] = useState('')
  // Connessione selezionata per l'eliminazione (click su un arco in modifica).
  const [archoSel, setArcoSel] = useState<{ a: string; b: string; label?: string } | null>(null)
  // Modale «nuova stanza»: nome digitato dall'autore.
  const [nuovaStanza, setNuovaStanza] = useState<string | null>(null)

  const attivo = editable && editMode

  // In modifica serve l'outline (per gli span delle frasi da eliminare).
  useEffect(() => {
    if (attivo) void loadOutline()
  }, [attivo, loadOutline])

  const current = snapshot?.currentRoom ?? null

  const { nodes, edges } = useMemo(() => {
    if (!graph || graph.rooms.length === 0) return { nodes: [] as Node[], edges: [] as Edge[] }
    const pos = disponiStanze(graph)
    const nodes: Node[] = graph.rooms.map((r) => {
      const p = pos.get(r.id) ?? { x: 0, y: 0 }
      const flags = [r.isStart ? 'start' : '', r.id === current ? 'current' : ''].filter(Boolean)
      return {
        id: r.id,
        position: { x: p.x * GAP_X, y: p.y * GAP_Y },
        data: { label: r.name },
        className: ['rf-room', ...flags].join(' '),
        sourcePosition: undefined,
        targetPosition: undefined
      }
    })
    return { nodes, edges: costruisciArchi(graph) }
  }, [graph, current])

  if (!graph || !graph.ok) {
    const msg = graph?.errors?.[0]?.message
    return (
      <div className="map-empty">
        {loading
          ? 'Carico la mappa…'
          : msg
            ? 'Mappa non disponibile: ' + msg
            : 'Apri un file .fav o avvia una partita per vedere la mappa.'}
        {!loading && (
          <button className="map-reload" onClick={() => void loadGraph()}>
            ⟳ Aggiorna
          </button>
        )}
      </div>
    )
  }

  if (graph.rooms.length === 0) {
    return <div className="map-empty">Nessuna stanza nel mondo.</div>
  }

  const nomeStanza = (id: string): string =>
    graph.rooms.find((r) => r.id === id)?.name ?? id

  const onConnect = (c: Connection): void => {
    if (!attivo || !c.source || !c.target || c.source === c.target) return
    setPicker({ from: c.source, to: c.target })
  }
  const onEdgeClick = (_e: React.MouseEvent, edge: RFEdge): void => {
    if (!attivo) return
    setArcoSel({
      a: edge.source,
      b: edge.target,
      label: typeof edge.label === 'string' ? edge.label : undefined
    })
  }
  const confermaDirezione = async (dir: string): Promise<void> => {
    const d = dir.trim().toLowerCase()
    if (!picker || !d) return
    const p = picker
    setPicker(null)
    setDirLibera('')
    await addConnection(p.from, d, p.to)
  }
  const confermaElimina = async (): Promise<void> => {
    if (!archoSel) return
    const a = archoSel
    setArcoSel(null)
    await deleteConnection(a.a, a.b)
  }
  const confermaNuovaStanza = async (): Promise<void> => {
    const nome = (nuovaStanza ?? '').trim()
    if (!nome) return
    setNuovaStanza(null)
    await addRoom(nome)
  }

  return (
    <div className={'map-host' + (attivo ? ' editing' : '')}>
      {editable && (
        <div className="map-toolbar">
          <button
            className={'map-edit-toggle' + (editMode ? ' on' : '')}
            onClick={() => setEditMode(!editMode)}
            title="Attiva/disattiva la modifica visuale della mappa"
          >
            {editMode ? '✏️ Modifica attiva' : '✏️ Modifica'}
          </button>
          {editMode && (
            <>
              <button className="map-edit-toggle" onClick={() => setNuovaStanza('')}>
                ➕ Stanza
              </button>
              <span className="map-edit-hint">
                Trascina da un pallino di una stanza a un’altra per collegarle · clicca una
                connessione per eliminarla
              </span>
            </>
          )}
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={attivo}
        elementsSelectable={attivo}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#34343d" gap={20} />
        <Controls showInteractive={false} />
        {!compact && (
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => (n.className?.includes('current') ? '#ffcb6b' : '#4e9aec')}
            maskColor="rgba(20,20,24,0.7)"
            style={{ background: '#1a1a1e' }}
          />
        )}
      </ReactFlow>

      {picker && (
        <div className="modal-backdrop" onClick={() => setPicker(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Nuova connessione</h2>
            <p className="modal-body">
              In che direzione va <b>{nomeStanza(picker.from)}</b> →{' '}
              <b>{nomeStanza(picker.to)}</b>?
              <br />
              <span className="modal-hint">Il ritorno opposto è creato automaticamente.</span>
            </p>
            <div className="dir-grid">
              {DIREZIONI_COMUNI.map((d) => (
                <button key={d} className="dir-btn" onClick={() => void confermaDirezione(d)}>
                  {d}
                </button>
              ))}
            </div>
            <div className="dir-libera">
              <input
                type="text"
                placeholder="direzione personalizzata…"
                value={dirLibera}
                onChange={(e) => setDirLibera(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void confermaDirezione(dirLibera)
                }}
              />
              <button
                className="modal-btn primary"
                disabled={!dirLibera.trim()}
                onClick={() => void confermaDirezione(dirLibera)}
              >
                Collega
              </button>
            </div>
            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={() => setPicker(null)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {archoSel && (
        <div className="modal-backdrop" onClick={() => setArcoSel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Eliminare la connessione?</h2>
            <p className="modal-body">
              {nomeStanza(archoSel.a)} ↔ {nomeStanza(archoSel.b)}
              {archoSel.label ? ` (${archoSel.label})` : ''}
              <br />
              <span className="modal-hint">La frase «collega» verrà rimossa dal sorgente.</span>
            </p>
            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={() => setArcoSel(null)}>
                Annulla
              </button>
              <button className="modal-btn danger" onClick={() => void confermaElimina()}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {nuovaStanza !== null && (
        <div className="modal-backdrop" onClick={() => setNuovaStanza(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Nuova stanza</h2>
            <p className="modal-body">
              Nome della stanza (con l’articolo, come lo scrivi nella storia):
              <br />
              <span className="modal-hint">Es. «La cantina», «Lo studio».</span>
            </p>
            <div className="dir-libera">
              <input
                type="text"
                autoFocus
                placeholder="La cantina"
                value={nuovaStanza}
                onChange={(e) => setNuovaStanza(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void confermaNuovaStanza()
                  if (e.key === 'Escape') setNuovaStanza(null)
                }}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={() => setNuovaStanza(null)}>
                Annulla
              </button>
              <button
                className="modal-btn primary"
                disabled={!nuovaStanza.trim()}
                onClick={() => void confermaNuovaStanza()}
              >
                Crea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
