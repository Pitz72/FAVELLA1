import { useCallback, useEffect } from 'react'
import { useStudio, type RightTab } from '../store'
import GamePanel from './GamePanel'
import MapView from './MapView'
import StateInspector from './StateInspector'
import DebugPanel from './DebugPanel'

// Titoli mostrati nell'header del dock (le tab vere sono nella titlebar: fila unica).
const TITOLI: Record<Exclude<RightTab, null>, string> = {
  gioca: '▶ Gioca',
  mappa: '🗺 Mappa',
  stato: '🔎 Stato',
  debug: '🐞 Debug'
}

export default function RightDock(): JSX.Element | null {
  const tab = useStudio((s) => s.rightTab)
  const closeDock = useStudio((s) => s.closeDock)
  const loadGraph = useStudio((s) => s.loadWorldGraph)
  const loadSnapshot = useStudio((s) => s.loadWorldSnapshot)
  const loadDebug = useStudio((s) => s.loadDebugHistory)
  const dockWidth = useStudio((s) => s.dockWidth)
  const setDockWidth = useStudio((s) => s.setDockWidth)

  // All'apertura di ogni scheda aggiorna i dati: Mappa → topologia, Stato →
  // snapshot live, Debug → history dei turni (la partita può girare nella finestra
  // di gioco, quindi si rilegge dal sidecar condiviso).
  useEffect(() => {
    if (tab === 'mappa') void loadGraph()
    if (tab === 'stato') void loadSnapshot()
    if (tab === 'debug') void loadDebug()
  }, [tab, loadGraph, loadSnapshot, loadDebug])

  // Ridimensionamento: trascinando la maniglia sul bordo sinistro. Il dock è a
  // destra, quindi la larghezza è (larghezza finestra − x del puntatore).
  const onResizeStart = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault()
      const onMove = (ev: MouseEvent): void => setDockWidth(window.innerWidth - ev.clientX)
      const onUp = (): void => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
      }
      document.body.style.cursor = 'col-resize'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [setDockWidth]
  )

  if (tab === null) return null

  return (
    <aside className="rightdock" style={{ flexBasis: dockWidth, width: dockWidth }}>
      <div className="dock-resizer" onMouseDown={onResizeStart} title="Trascina per ridimensionare" />
      <div className="dock-head">
        <span className="dock-title">{TITOLI[tab]}</span>
        <button className="icon-btn" title="Chiudi pannello" onClick={closeDock}>
          ✕
        </button>
      </div>

      <div className="dock-body">
        {tab === 'gioca' && <GamePanel />}
        {tab === 'mappa' && <MapView editable />}
        {tab === 'stato' && <StateInspector />}
        {tab === 'debug' && <DebugPanel />}
      </div>
    </aside>
  )
}
