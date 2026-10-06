import { useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BaseEdge,
  EdgeLabelRenderer,
  useNodesState,
  useStore,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useStudio, infoStoria } from '../store'
import type { WorldGraph } from '../../../shared/protocol'
import { ConnessioneStanze, SchedaStanzaMappa } from './ConnessioneStanze'
import Finestra from './Finestra'
import { IconaAllinea, IconaAggiorna, IconaPiu } from './Icone'
import { Vuoto } from './Elenco'

// Posizioni MANUALI delle stanze, ricordate per STORIA (il file principale) nel
// localStorage. Il layout automatico vale solo per le stanze senza posizione salvata.
type PosMap = Record<string, { x: number; y: number }>
function posKey(path: string | null): string | null {
  return path ? 'favella.mapPos:' + path.toLowerCase().replace(/\\/g, '/') : null
}
function loadPositions(path: string | null): PosMap {
  const k = posKey(path)
  if (!k) return {}
  try {
    return JSON.parse(localStorage.getItem(k) || '{}') as PosMap
  } catch {
    return {}
  }
}
function savePosition(path: string | null, id: string, pos: { x: number; y: number }): void {
  const k = posKey(path)
  if (!k) return
  try {
    const all = loadPositions(path)
    all[id] = { x: Math.round(pos.x), y: Math.round(pos.y) }
    localStorage.setItem(k, JSON.stringify(all))
  } catch {
    /* best-effort */
  }
}
function clearPositions(path: string | null): void {
  const k = posKey(path)
  try {
    if (k) localStorage.removeItem(k)
  } catch {
    /* best-effort */
  }
}

// Direzioni di base di FAVELLA, valide senza dichiarazione (finché l'outline non arriva).
const DIREZIONI_NATIVE = ['nord', 'sud', 'est', 'ovest']

// Abbastanza spazio fra le stanze perché le due direzioni di un collegamento (una per capo)
// si leggano senza sovrapporsi.
const GAP_X = 290
const GAP_Y = 150

// Le direzioni mappano su una griglia: x cresce a destra, y in basso. Le verticali (piani
// diversi) e quelle ignote ricadono su una cella libera vicina.
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

interface DatiUscita {
  /** La direzione per chi parte dalla stanza di origine dell'arco (es. «est»). */
  andata?: string
  /** La direzione per chi parte dall'altra stanza (es. «ovest»), se c'è il ritorno. */
  ritorno?: string
}

/** Dove la retta dal centro di `nodo` verso il centro di `altro` esce dal bordo di `nodo`. */
function bordoVerso(
  nodo: { x: number; y: number; w: number; h: number },
  altro: { x: number; y: number; w: number; h: number }
): { x: number; y: number } {
  const w = nodo.w / 2
  const h = nodo.h / 2
  const cx = nodo.x + w
  const cy = nodo.y + h
  const ax = altro.x + altro.w / 2
  const ay = altro.y + altro.h / 2
  const xx1 = (ax - cx) / (2 * w) - (ay - cy) / (2 * h)
  const yy1 = (ax - cx) / (2 * w) + (ay - cy) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1)
  const xx3 = a * xx1
  const yy3 = a * yy1
  return { x: w * (xx3 + yy3) + cx, y: h * (-xx3 + yy3) + cy }
}

/**
 * [Studio 1.2] Un collegamento fra due stanze: una linea dritta da bordo a bordo, con la
 * direzione scritta VICINO alla stanza da cui la si prende («est» accanto all'ingresso,
 * «ovest» accanto alla cucina). Prima l'etichetta era una sola, a metà strada, e le curve
 * partivano dai pallini in alto e in basso anche fra stanze affiancate.
 */
function ArcoUscita(props: EdgeProps<DatiUscita>): JSX.Element | null {
  const { id, source, target, data, selected } = props
  const nodoA = useStore((s) => s.nodeInternals.get(source))
  const nodoB = useStore((s) => s.nodeInternals.get(target))
  if (!nodoA || !nodoB || !nodoA.width || !nodoA.height || !nodoB.width || !nodoB.height) return null
  const ra = { x: nodoA.positionAbsolute?.x ?? nodoA.position.x, y: nodoA.positionAbsolute?.y ?? nodoA.position.y, w: nodoA.width, h: nodoA.height }
  const rb = { x: nodoB.positionAbsolute?.x ?? nodoB.position.x, y: nodoB.positionAbsolute?.y ?? nodoB.position.y, w: nodoB.width, h: nodoB.height }
  const pa = bordoVerso(ra, rb)
  const pb = bordoVerso(rb, ra)
  const dx = pb.x - pa.x
  const dy = pb.y - pa.y
  const lung = Math.hypot(dx, dy) || 1
  // Le etichette stanno a una distanza fissa dal bordo (non a una frazione della linea).
  const passo = Math.min(30, lung * 0.32)
  const vicinoA = { x: pa.x + (dx / lung) * passo, y: pa.y + (dy / lung) * passo }
  const vicinoB = { x: pb.x - (dx / lung) * passo, y: pb.y - (dy / lung) * passo }
  const unaVia = !data?.ritorno
  return (
    <>
      <BaseEdge
        id={id}
        path={`M ${pa.x},${pa.y} L ${pb.x},${pb.y}`}
        interactionWidth={24}
        style={{
          stroke: selected ? 'var(--mappa-linea-scelta)' : 'var(--mappa-linea)',
          strokeWidth: selected ? 3 : 2,
          // Un'uscita senza ritorno (a senso unico) è tratteggiata.
          strokeDasharray: unaVia ? '7 6' : undefined
        }}
      />
      <EdgeLabelRenderer>
        {data?.andata && (
          <div className="arco-etichetta" style={{ transform: `translate(-50%, -50%) translate(${vicinoA.x}px, ${vicinoA.y}px)` }}>
            {data.andata}
          </div>
        )}
        {data?.ritorno && (
          <div className="arco-etichetta" style={{ transform: `translate(-50%, -50%) translate(${vicinoB.x}px, ${vicinoB.y}px)` }}>
            {data.ritorno}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}

const TIPI_ARCO = { uscita: ArcoUscita }

/** Unisce andata e ritorno fra due stanze in un solo arco con due etichette. */
function costruisciArchi(graph: WorldGraph): Edge<DatiUscita>[] {
  const aggregati = new Map<string, { a: string; b: string; daA?: string; daB?: string }>()
  for (const e of graph.edges) {
    const [a, b] = [e.from, e.to].sort()
    const k = `${a}|${b}`
    const agg = aggregati.get(k) ?? { a, b }
    if (e.from === a) agg.daA = e.direction
    else agg.daB = e.direction
    aggregati.set(k, agg)
  }
  const archi: Edge<DatiUscita>[] = []
  for (const [k, agg] of aggregati) {
    // L'origine dell'arco è la stanza da cui c'è l'andata; il ritorno, se c'è, sta dall'altra parte.
    const daA = agg.daA !== undefined
    archi.push({
      id: k,
      type: 'uscita',
      source: daA ? agg.a : agg.b,
      target: daA ? agg.b : agg.a,
      data: { andata: daA ? agg.daA : agg.daB, ritorno: daA ? agg.daB : undefined }
    })
  }
  return archi
}

/** I colori della mappa vengono dai token CSS del tema (letti quando l'aspetto cambia). */
function useColoriMappa(): { punti: string; stanza: string; attuale: string; maschera: string; fondo: string } {
  const aspetto = useStudio((s) => s.aspetto)
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement)
    const v = (n: string, def: string): string => cs.getPropertyValue(n).trim() || def
    return {
      punti: v('--mappa-punti', '#1e3a52'),
      stanza: v('--mappa-mini-stanza', '#22d3ee'),
      attuale: v('--mappa-mini-attuale', '#f59e0b'),
      maschera: v('--mappa-mini-maschera', 'rgba(3,6,13,0.7)'),
      fondo: v('--superficie-1', '#0b1726')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspetto])
}

interface MapViewProps {
  // In modalità compatta (riquadri piccoli: la Prova, la finestra di gioco) niente minimappa.
  compact?: boolean
  // Modifica visuale (solo nell'IDE, non nella finestra di gioco).
  editable?: boolean
}

export default function MapView({ compact = false, editable = false }: MapViewProps): JSX.Element {
  const graph = useStudio((s) => s.worldGraph)
  const snapshot = useStudio((s) => s.worldSnapshot)
  const loading = useStudio((s) => s.worldLoading)
  const loadGraph = useStudio((s) => s.loadWorldGraph)
  const loadOutline = useStudio((s) => s.loadOutline)
  const outline = useStudio((s) => s.outline)
  const addConnection = useStudio((s) => s.mapAddConnection)
  const addRoom = useStudio((s) => s.mapAddRoom)
  const nomeOccupato = useStudio((s) => s.nomeOccupato)
  // Le posizioni manuali si ricordano per storia (il file principale), solo nell'IDE.
  const radice = useStudio((s) => (editable ? (infoStoria(s)?.radice ?? null) : null))
  const colori = useColoriMappa()

  const [picker, setPicker] = useState<{ from: string; to: string } | null>(null)
  const [arcoSel, setArcoSel] = useState<{ a: string; b: string } | null>(null)
  const [nodoSel, setNodoSel] = useState<string | null>(null)
  const [nuovaStanza, setNuovaStanza] = useState<string | null>(null)
  const [nuovaDir, setNuovaDir] = useState(false)
  const [ndNome, setNdNome] = useState('')
  const [ndOpp, setNdOpp] = useState('')

  const attivo = editable

  // Da editabile serve l'outline (per gli span delle frasi da cambiare o togliere).
  useEffect(() => {
    if (attivo) void loadOutline()
  }, [attivo, loadOutline])

  const current = snapshot?.currentRoom ?? null
  const edges = useMemo(() => (graph ? costruisciArchi(graph) : []), [graph])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  useEffect(() => {
    if (!graph || graph.rooms.length === 0) {
      setNodes([])
      return
    }
    const auto = disponiStanze(graph)
    const saved = loadPositions(radice)
    const next: Node[] = graph.rooms.map((r) => {
      const sp = saved[r.id]
      const ap = auto.get(r.id) ?? { x: 0, y: 0 }
      const flags = [r.isStart ? 'partenza' : '', r.id === current ? 'attuale' : ''].filter(Boolean)
      return {
        id: r.id,
        position: sp ?? { x: ap.x * GAP_X, y: ap.y * GAP_Y },
        data: { label: r.name },
        className: ['stanza-mappa', ...flags].join(' '),
        ariaLabel: `${r.name}${r.isStart ? ', partenza' : ''}${r.id === current ? ', sei qui' : ''}`
      }
    })
    setNodes(next)
  }, [graph, current, radice, setNodes])

  if (!graph || !graph.ok) {
    const msg = graph?.errors?.[0]?.message
    return (
      <Vuoto
        titolo={loading ? 'Disegno la mappa…' : msg ? 'La mappa non si può disegnare' : 'Nessuna mappa'}
        azione={
          !loading && (
            <button className="btn btn-quieto" onClick={() => void loadGraph()}>
              <IconaAggiorna />
              Riprova
            </button>
          )
        }
      >
        {loading ? undefined : msg ?? 'Apri una storia o avvia una partita per vedere la mappa.'}
      </Vuoto>
    )
  }

  if (graph.rooms.length === 0) {
    return <Vuoto titolo="Ancora nessuna stanza">Crea la prima stanza: comparirà qui.</Vuoto>
  }

  const nomeStanza = (id: string): string => graph.rooms.find((r) => r.id === id)?.name ?? id
  const direzioniOfferte = outline?.directions ?? DIREZIONI_NATIVE

  const onConnect = (c: Connection): void => {
    if (!attivo || !c.source || !c.target || c.source === c.target) return
    setPicker({ from: c.source, to: c.target })
  }
  const chiudiPicker = (): void => {
    setPicker(null)
    setNuovaDir(false)
    setNdNome('')
    setNdOpp('')
  }
  const confermaDirezione = async (dir: string): Promise<void> => {
    const d = dir.trim().toLowerCase()
    if (!picker || !d) return
    const p = picker
    chiudiPicker()
    await addConnection(p.from, d, p.to)
  }
  const ndN = ndNome.trim().toLowerCase()
  const ndO = ndOpp.trim().toLowerCase()
  const ndValido = !!ndN && !!ndO && !ndN.includes(' ') && !ndO.includes(' ') && ndN !== ndO
  const confermaNuovaDir = async (): Promise<void> => {
    if (!picker || !ndValido) return
    const p = picker
    chiudiPicker()
    await addConnection(p.from, ndN, p.to, ndO)
  }
  const erroreNuova = nuovaStanza?.trim() ? nomeOccupato(nuovaStanza) : null
  const confermaNuovaStanza = async (): Promise<void> => {
    const nome = (nuovaStanza ?? '').trim()
    if (!nome || erroreNuova) return
    setNuovaStanza(null)
    await addRoom(nome)
  }
  const riallinea = (): void => {
    clearPositions(radice)
    if (!graph) return
    const auto = disponiStanze(graph)
    setNodes((ns) =>
      ns.map((n) => {
        const ap = auto.get(n.id) ?? { x: 0, y: 0 }
        return { ...n, position: { x: ap.x * GAP_X, y: ap.y * GAP_Y } }
      })
    )
  }

  const usciteDi = picker ? (outline?.rooms.find((r) => r.id === picker.from)?.exits.map((e) => e.direction) ?? []) : []

  return (
    <div className={'mappa' + (compact ? ' mappa-compatta' : '')}>
      {editable && (
        <div className="mappa-barra">
          <button className="btn btn-quieto btn-piccolo" onClick={() => setNuovaStanza('')}>
            <IconaPiu />
            Stanza
          </button>
          <button className="btn btn-quieto btn-piccolo" onClick={riallinea} title="Ridisponi le stanze da sole (dimentica le posizioni che hai scelto)">
            <IconaAllinea />
            Riallinea
          </button>
          <p className="mappa-aiuto">
            Trascina da un pallino a un’altra stanza per collegarle · clicca un collegamento per cambiarlo · clicca una
            stanza per le sue uscite
          </p>
        </div>
      )}
      <div className="mappa-tela">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          edgeTypes={TIPI_ARCO}
          onNodesChange={onNodesChange}
          onNodeDragStop={(_e, node) => savePosition(radice, node.id, node.position)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable={attivo}
          elementsSelectable={attivo}
          onConnect={onConnect}
          onEdgeClick={(_e, edge) => {
            if (!attivo) return
            setNodoSel(null)
            setArcoSel({ a: edge.source, b: edge.target })
          }}
          onNodeClick={(_e, node) => attivo && setNodoSel(node.id)}
          onPaneClick={() => setNodoSel(null)}
          minZoom={0.2}
          maxZoom={2.5}
        >
          <Background color={colori.punti} gap={22} size={1.4} />
          <Controls showInteractive={false} />
          {!compact && (
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => (n.className?.includes('attuale') ? colori.attuale : colori.stanza)}
              maskColor={colori.maschera}
              style={{ background: colori.fondo }}
              ariaLabel="La mappa in piccolo"
            />
          )}
        </ReactFlow>
        {nodoSel && attivo && <SchedaStanzaMappa id={nodoSel} onChiudi={() => setNodoSel(null)} />}
      </div>

      {picker && (
        <Finestra
          titolo="Un collegamento nuovo"
          sottotitolo={`${nomeStanza(picker.from)} → ${nomeStanza(picker.to)}. Il ritorno si scrive da solo.`}
          onChiudi={chiudiPicker}
          azioni={
            nuovaDir ? (
              <>
                <button className="btn btn-quieto" onClick={() => setNuovaDir(false)}>
                  Indietro
                </button>
                <button className="btn btn-primario" disabled={!ndValido} onClick={() => void confermaNuovaDir()}>
                  Crea e collega
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-quieto" onClick={chiudiPicker}>
                  Annulla
                </button>
                <button className="btn" onClick={() => setNuovaDir(true)}>
                  Una direzione nuova…
                </button>
              </>
            )
          }
        >
          {!nuovaDir ? (
            <div className="griglia-direzioni" role="group" aria-label={`Da ${nomeStanza(picker.from)}, verso`}>
              {direzioniOfferte.map((d) => {
                const usata = usciteDi.includes(d)
                return (
                  <button key={d} className="btn" disabled={usata} title={usata ? 'Già usata da questa stanza' : undefined} onClick={() => void confermaDirezione(d)}>
                    {d}
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <p>Una parola per andare e la sua opposta per tornare: «botola» e «scala», «fessura» e «pertugio».</p>
              <div className="riga-campi">
                <label className="campo">
                  <span className="campo-etichetta">Per andare</span>
                  <input type="text" autoFocus placeholder="botola" value={ndNome} onChange={(e) => setNdNome(e.target.value)} />
                </label>
                <label className="campo">
                  <span className="campo-etichetta">Per tornare</span>
                  <input
                    type="text"
                    placeholder="scala"
                    value={ndOpp}
                    onChange={(e) => setNdOpp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && ndValido) void confermaNuovaDir()
                    }}
                  />
                </label>
              </div>
            </>
          )}
        </Finestra>
      )}

      {arcoSel && <ConnessioneStanze aId={arcoSel.a} bId={arcoSel.b} onChiudi={() => setArcoSel(null)} />}

      {nuovaStanza !== null && (
        <Finestra
          titolo="Una stanza nuova"
          onChiudi={() => setNuovaStanza(null)}
          azioni={
            <>
              <button className="btn btn-quieto" onClick={() => setNuovaStanza(null)}>
                Annulla
              </button>
              <button className="btn btn-primario" disabled={!nuovaStanza.trim() || !!erroreNuova} onClick={() => void confermaNuovaStanza()}>
                Crea la stanza
              </button>
            </>
          }
        >
          <label className="campo">
            <span className="campo-etichetta">Il nome, con l’articolo</span>
            <input
              type="text"
              autoFocus
              placeholder="La cantina"
              value={nuovaStanza}
              aria-invalid={!!erroreNuova}
              onChange={(e) => setNuovaStanza(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void confermaNuovaStanza()
              }}
            />
          </label>
          {erroreNuova && <p className="errore-campo">{erroreNuova}</p>}
        </Finestra>
      )}
    </div>
  )
}
