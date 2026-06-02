import { useEffect } from 'react'
import { useStudio, type RightTab } from '../store'
import GamePanel from './GamePanel'
import MapView from './MapView'
import StateInspector from './StateInspector'
import DebugPanel from './DebugPanel'

const TABS: Array<{ id: Exclude<RightTab, null>; label: string }> = [
  { id: 'gioca', label: '▶ Gioca' },
  { id: 'mappa', label: '🗺 Mappa' },
  { id: 'stato', label: '🔎 Stato' },
  { id: 'debug', label: '🐞 Debug' }
]

export default function RightDock(): JSX.Element | null {
  const tab = useStudio((s) => s.rightTab)
  const setTab = useStudio((s) => s.setRightTab)
  const closeDock = useStudio((s) => s.closeDock)
  const loadGraph = useStudio((s) => s.loadWorldGraph)
  const loadSnapshot = useStudio((s) => s.loadWorldSnapshot)
  const loadDebug = useStudio((s) => s.loadDebugHistory)

  // All'apertura di ogni scheda aggiorna i dati: Mappa → topologia, Stato →
  // snapshot live, Debug → history dei turni (la partita può girare nella finestra
  // di gioco, quindi si rilegge dal sidecar condiviso).
  useEffect(() => {
    if (tab === 'mappa') void loadGraph()
    if (tab === 'stato') void loadSnapshot()
    if (tab === 'debug') void loadDebug()
  }, [tab, loadGraph, loadSnapshot, loadDebug])

  if (tab === null) return null

  return (
    <aside className="rightdock">
      <div className="dock-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'dock-tab' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <span className="dock-spacer" />
        <button className="icon-btn" title="Chiudi pannello" onClick={closeDock}>
          ✕
        </button>
      </div>

      <div className="dock-body">
        {tab === 'gioca' && <GamePanel />}
        {tab === 'mappa' && <MapView />}
        {tab === 'stato' && <StateInspector />}
        {tab === 'debug' && <DebugPanel />}
      </div>
    </aside>
  )
}
