import { useEffect } from 'react'
import { useStudio, type RightTab } from '../store'
import GamePanel from './GamePanel'
import MapView from './MapView'
import StateInspector from './StateInspector'

const TABS: Array<{ id: Exclude<RightTab, null>; label: string }> = [
  { id: 'gioca', label: '▶ Gioca' },
  { id: 'mappa', label: '🗺 Mappa' },
  { id: 'stato', label: '🔎 Stato' }
]

export default function RightDock(): JSX.Element | null {
  const tab = useStudio((s) => s.rightTab)
  const setTab = useStudio((s) => s.setRightTab)
  const closeDock = useStudio((s) => s.closeDock)
  const loadGraph = useStudio((s) => s.loadWorldGraph)
  const loadSnapshot = useStudio((s) => s.loadWorldSnapshot)

  // All'apertura della Mappa carica la topologia (mondo giocato o buffer attivo);
  // all'apertura dello Stato aggiorna lo snapshot live.
  useEffect(() => {
    if (tab === 'mappa') void loadGraph()
    if (tab === 'stato') void loadSnapshot()
  }, [tab, loadGraph, loadSnapshot])

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
      </div>
    </aside>
  )
}
