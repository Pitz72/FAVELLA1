import { useCallback, useEffect } from 'react'
import { useStudio, type RightTab } from '../store'
import GamePanel from './GamePanel'
import MapView from './MapView'
import StateInspector from './StateInspector'
import DebugPanel from './DebugPanel'
import ObjectsEditor from './ObjectsEditor'
import RoomEditor from './RoomEditor'
import RulesEditor from './RulesEditor'
import VariablesEditor from './VariablesEditor'
import DialoguesEditor from './DialoguesEditor'

// Titoli mostrati nell'header del dock (le tab vere sono nella titlebar: fila unica).
// «🔎 Partita» = istantanea del gioco in corso (sola lettura), distinta da «⚖ Stati»
// che è l'editor degli stati/contatori del mondo: due nomi, due ruoli, niente omografia.
const TITOLI: Record<Exclude<RightTab, null>, string> = {
  // Costruisci il mondo
  mappa: '🗺 Mappa',
  stanze: '🏠 Stanze',
  oggetti: '📦 Oggetti',
  dialoghi: '💬 Dialoghi',
  stati: '⚖ Stati',
  regole: '⚙ Regole',
  // Prova e osserva
  gioca: '▶ Gioca',
  stato: '🔎 Partita',
  debug: '🐞 Debug'
}

export default function RightDock(): JSX.Element | null {
  const tab = useStudio((s) => s.rightTab)
  const closeDock = useStudio((s) => s.closeDock)
  const editError = useStudio((s) => s.editError)
  const clearEditError = useStudio((s) => s.clearEditError)
  const loadGraph = useStudio((s) => s.loadWorldGraph)
  const loadSnapshot = useStudio((s) => s.loadWorldSnapshot)
  const loadDebug = useStudio((s) => s.loadDebugHistory)
  const dockWidth = useStudio((s) => s.dockWidth)
  const setDockWidth = useStudio((s) => s.setDockWidth)
  const loadOutline = useStudio((s) => s.loadOutline)
  const loadRules = useStudio((s) => s.loadRules)
  const loadVariables = useStudio((s) => s.loadVariables)
  const loadDialogues = useStudio((s) => s.loadDialogues)
  const gameRunning = useStudio((s) => s.gameRunning)
  const activeContent = useStudio((s) => s.openFiles.find((f) => f.path === s.activePath)?.content)

  // All'apertura di ogni scheda aggiorna i dati: Mappa → topologia, Stato →
  // snapshot live, Debug → history dei turni (la partita può girare nella finestra
  // di gioco, quindi si rilegge dal sidecar condiviso).
  useEffect(() => {
    if (tab === 'mappa') void loadGraph()
    if (tab === 'stato') void loadSnapshot()
    if (tab === 'debug') void loadDebug()
    if (tab === 'oggetti') void loadOutline()
    if (tab === 'stanze') void loadOutline()
    if (tab === 'regole') void loadRules()
    if (tab === 'stati') void loadVariables()
    if (tab === 'dialoghi') void loadDialogues()
  }, [tab, loadGraph, loadSnapshot, loadDebug, loadOutline, loadRules, loadVariables, loadDialogues])

  // Auto-refresh della Mappa MENTRE SI DIGITA (debounce, come l'auto-compile):
  // la topologia segue il testo senza dover riaprire la scheda. Solo in anteprima
  // (nessuna partita in corso): durante il gioco la mappa riflette il mondo giocato.
  // La mappa nel dock è sempre editabile (T5) → ricarica anche l'outline per gli span.
  useEffect(() => {
    if (tab !== 'mappa' || gameRunning) return
    const t = setTimeout(() => {
      void loadGraph()
      void loadOutline()
    }, 500)
    return () => clearTimeout(t)
  }, [tab, activeContent, gameRunning, loadGraph, loadOutline])

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

      {/* [T6] Errore dell'ultima azione di un editor, mostrato qui dove l'azione è
          nata (e non solo nel toast globale). Si pulisce all'azione riuscita o con la ✕. */}
      {editError && tab !== 'gioca' && tab !== 'stato' && tab !== 'debug' && (
        <div className="dock-error" role="alert">
          <span className="dock-error-text">⚠️ {editError}</span>
          <button className="icon-btn" title="Nascondi" onClick={clearEditError}>
            ✕
          </button>
        </div>
      )}

      <div className="dock-body">
        {tab === 'gioca' && <GamePanel />}
        {tab === 'mappa' && <MapView editable />}
        {tab === 'stato' && <StateInspector />}
        {tab === 'debug' && <DebugPanel />}
        {tab === 'oggetti' && <ObjectsEditor />}
        {tab === 'stanze' && <RoomEditor />}
        {tab === 'regole' && <RulesEditor />}
        {tab === 'stati' && <VariablesEditor />}
        {tab === 'dialoghi' && <DialoguesEditor />}
      </div>
    </aside>
  )
}
