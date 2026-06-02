import { useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useStudio } from '../store'
import type { WorldGraph } from '../../../shared/protocol'

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
}

export default function MapView({ compact = false }: MapViewProps): JSX.Element {
  const graph = useStudio((s) => s.worldGraph)
  const snapshot = useStudio((s) => s.worldSnapshot)
  const loading = useStudio((s) => s.worldLoading)
  const loadGraph = useStudio((s) => s.loadWorldGraph)

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

  return (
    <div className="map-host">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
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
    </div>
  )
}
