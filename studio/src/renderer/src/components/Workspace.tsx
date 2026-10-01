import { useEffect } from 'react'
import { useStudio } from '../store'
import { defSezione, sezioneDi } from '../sezioni'
import GamePanel from './GamePanel'
import MapView from './MapView'
import StateInspector from './StateInspector'
import DebugPanel from './DebugPanel'
import ObjectsEditor from './ObjectsEditor'
import RoomEditor from './RoomEditor'
import RulesEditor from './RulesEditor'
import VariablesEditor from './VariablesEditor'
import DialoguesEditor from './DialoguesEditor'
import EditorPane from './EditorPane'

// L'area di lavoro delle sezioni visuali (Mondo, Personaggi, Regole, Prova). Prima
// questi pannelli stavano in una colonna stretta a destra del testo; ora occupano
// il centro, e il testo si può AFFIANCARE quando serve vederlo.

function LatoProva(): JSX.Element {
  const rightTab = useStudio((s) => s.rightTab)
  const provaLato = useStudio((s) => s.provaLato)
  const setProvaLato = useStudio((s) => s.setProvaLato)
  // 'stato' e 'debug' possono ancora essere richiesti da fuori (rightTab).
  const lato = rightTab === 'stato' || rightTab === 'debug' ? rightTab : provaLato
  const scegli = (l: 'stato' | 'mappa' | 'debug'): void => {
    setProvaLato(l)
    useStudio.getState().setRightTab('gioca')
  }
  return (
    <div className="prova-lato">
      <div className="segmented" role="tablist" aria-label="Che cosa guardare">
        {(
          [
            ['stato', 'Partita'],
            ['mappa', 'Mappa'],
            ['debug', 'Passo passo']
          ] as const
        ).map(([id, nome]) => (
          <button
            key={id}
            role="tab"
            aria-selected={lato === id}
            className={'seg' + (lato === id ? ' active' : '')}
            onClick={() => scegli(id)}
          >
            {nome}
          </button>
        ))}
      </div>
      <div className="prova-lato-body">
        {lato === 'stato' && <StateInspector />}
        {lato === 'mappa' && <MapView compact />}
        {lato === 'debug' && <DebugPanel />}
      </div>
    </div>
  )
}

export default function Workspace(): JSX.Element | null {
  const tab = useStudio((s) => s.rightTab)
  const editError = useStudio((s) => s.editError)
  const clearEditError = useStudio((s) => s.clearEditError)
  const setRightTab = useStudio((s) => s.setRightTab)
  const affianca = useStudio((s) => s.affiancaTesto)
  const setAffianca = useStudio((s) => s.setAffiancaTesto)
  const provaLato = useStudio((s) => s.provaLato)
  const loadGraph = useStudio((s) => s.loadWorldGraph)
  const loadSnapshot = useStudio((s) => s.loadWorldSnapshot)
  const loadDebug = useStudio((s) => s.loadDebugHistory)
  const loadOutline = useStudio((s) => s.loadOutline)
  const loadRules = useStudio((s) => s.loadRules)
  const loadVariables = useStudio((s) => s.loadVariables)
  const loadDialogues = useStudio((s) => s.loadDialogues)
  const gameRunning = useStudio((s) => s.gameRunning)
  const activeContent = useStudio((s) => s.openFiles.find((f) => f.path === s.activePath)?.content)

  // Il lato della Prova effettivamente visibile (per sapere che cosa ricaricare).
  const latoProva = tab === 'stato' || tab === 'debug' ? tab : provaLato

  // All'apertura di ogni vista aggiorna i dati: Mappa → topologia, Partita →
  // snapshot live, Passo passo → history dei turni, gli editor → il loro modello.
  useEffect(() => {
    if (tab === 'mappa') void loadGraph()
    if (tab === 'oggetti' || tab === 'stanze') void loadOutline()
    if (tab === 'regole') void loadRules()
    if (tab === 'stati') void loadVariables()
    if (tab === 'dialoghi') void loadDialogues()
    if (tab === 'gioca' || tab === 'stato' || tab === 'debug') {
      if (latoProva === 'stato') void loadSnapshot()
      if (latoProva === 'mappa') void loadGraph()
      if (latoProva === 'debug') void loadDebug()
    }
  }, [tab, latoProva, loadGraph, loadSnapshot, loadDebug, loadOutline, loadRules, loadVariables, loadDialogues])

  // Auto-refresh della Mappa MENTRE SI DIGITA (debounce): la topologia segue il
  // testo senza dover riaprire la scheda. Solo in anteprima (nessuna partita in corso).
  useEffect(() => {
    if (tab !== 'mappa' || gameRunning) return
    const t = setTimeout(() => {
      void loadGraph()
      void loadOutline()
    }, 500)
    return () => clearTimeout(t)
  }, [tab, activeContent, gameRunning, loadGraph, loadOutline])

  if (tab === null) return null
  const sezione = defSezione(sezioneDi(tab))
  const inProva = sezione.id === 'prova'

  return (
    <section className={'workspace sezione-' + sezione.id}>
      <header className="ws-head">
        <div className="ws-title">
          <h1>{sezione.titolo}</h1>
          <p>{sezione.descrizione}</p>
        </div>

        {sezione.sotto.length > 1 && (
          <div className="segmented" role="tablist" aria-label={`Parti di ${sezione.titolo}`}>
            {sezione.sotto.map((x) => (
              <button
                key={x.tab}
                role="tab"
                aria-selected={tab === x.tab}
                className={'seg' + (tab === x.tab ? ' active' : '')}
                onClick={() => setRightTab(x.tab)}
                title={x.aiuto}
              >
                {x.titolo}
              </button>
            ))}
          </div>
        )}

        <div className="ws-spacer" />

        {!inProva && (
          <label className="switch" title="Mostra il testo della storia accanto a questo pannello">
            <input type="checkbox" checked={affianca} onChange={(e) => setAffianca(e.target.checked)} />
            <span className="switch-track" aria-hidden="true" />
            <span className="switch-label">Mostra il testo accanto</span>
          </label>
        )}
      </header>

      {/* Errore dell'ultima azione di un editor, mostrato qui dove l'azione è nata. */}
      {editError && !inProva && (
        <div className="ws-error" role="alert">
          <span>⚠ {editError}</span>
          <button className="icon-btn" title="Nascondi" onClick={clearEditError}>
            ✕
          </button>
        </div>
      )}

      <div className={'ws-body' + (affianca && !inProva ? ' con-testo' : '')}>
        <div className="ws-panel">
          {inProva ? (
            <div className="prova">
              <div className="prova-gioco">
                <GamePanel />
              </div>
              <LatoProva />
            </div>
          ) : (
            <>
              {tab === 'mappa' && <MapView editable />}
              {tab === 'oggetti' && <ObjectsEditor />}
              {tab === 'stanze' && <RoomEditor />}
              {tab === 'regole' && <RulesEditor />}
              {tab === 'stati' && <VariablesEditor />}
              {tab === 'dialoghi' && <DialoguesEditor />}
            </>
          )}
        </div>
        {affianca && !inProva && (
          <div className="ws-text" aria-label="Testo della storia">
            <EditorPane />
          </div>
        )}
      </div>
    </section>
  )
}
