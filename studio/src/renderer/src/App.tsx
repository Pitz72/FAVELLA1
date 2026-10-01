import { useEffect, useState, useCallback } from 'react'
import './monaco/setup' // side-effect: configura worker + loader Monaco (offline)
import { useStudio } from './store'
import Explorer from './components/Explorer'
import TabBar from './components/TabBar'
import EditorPane from './components/EditorPane'
import ProblemsPanel from './components/ProblemsPanel'
import StatusBar from './components/StatusBar'
import TopBar from './components/TopBar'
import Rail from './components/Rail'
import Workspace from './components/Workspace'
import { Benvenuto, ScegliStoria } from './components/Accoglienza'
import { sezioneDi, SEZIONI } from './sezioni'
import UnsavedDialog from './components/UnsavedDialog'
import type { EngineEvent, EngineLexicon } from '../../shared/protocol'

interface Toast {
  id: number
  text: string
}

export default function App(): JSX.Element {
  const setLexicon = useStudio((s) => s.setLexicon)
  const setSidecarStatus = useStudio((s) => s.setSidecarStatus)
  const saveAll = useStudio((s) => s.saveAll)
  const salvaConNome = useStudio((s) => s.salvaConNome)
  const riordinaStoria = useStudio((s) => s.riordinaStoria)
  const openProject = useStudio((s) => s.openProject)
  const compileActive = useStudio((s) => s.compileActive)
  const rightTab = useStudio((s) => s.rightTab)
  const activePath = useStudio((s) => s.activePath)
  // Sale a ogni cambio del testo (digitato o fatto da un pannello, in qualunque file della storia).
  const revisione = useStudio((s) => s.revisione)
  const sidecarStatus = useStudio((s) => s.sidecarStatus)
  const [toasts, setToasts] = useState<Toast[]>([])

  const pushToast = useCallback((text: string) => {
    const id = Date.now() + Math.floor(performance.now())
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  // Gli avvisi degli editor visuali (gameNotice nello store: riordino, errori di
  // serializzazione, edit cross-file…) diventano toast anche nell'IDE.
  const gameNotice = useStudio((s) => s.gameNotice)
  const clearGameNotice = useStudio((s) => s.clearGameNotice)
  useEffect(() => {
    if (gameNotice) {
      pushToast(gameNotice)
      clearGameNotice()
    }
  }, [gameNotice, pushToast, clearGameNotice])

  const loadLexicon = useCallback(async () => {
    try {
      const lex = await window.favella.rpc<EngineLexicon>('engine.lexicon')
      setLexicon(lex)
    } catch {
      /* il motore potrebbe non essere ancora pronto: riprova all'evento ready */
    }
  }, [setLexicon])

  useEffect(() => {
    const unsub = window.favella.onEngineEvent((event: EngineEvent) => {
      if (event.kind === 'status') {
        setSidecarStatus(event.status)
        if (event.status === 'restarting') pushToast('Il motore si è chiuso: riavvio in corso…')
        if (event.status === 'crashed') {
          // Mostra anche la causa (ultima riga del traceback Python, passata nel
          // detail): un errore senza il perché non è diagnosticabile dall'utente.
          pushToast(
            'Il motore FAVELLA è andato in errore' +
              (event.detail ? `: ${event.detail}` : '.')
          )
          // Il traceback completo va in console (DevTools) per le segnalazioni.
          void window.favella.sidecarLastError().then((tail) => {
            if (tail) console.error('[motore FAVELLA — stderr]\n' + tail)
          })
        }
      } else if (event.kind === 'ready') {
        setSidecarStatus('ready')
        if (event.data.engineLoaded) {
          pushToast('Motore FAVELLA connesso.')
          void loadLexicon()
        } else {
          pushToast('Motore non caricato: ' + (event.data.engineError ?? '?'))
        }
      }
    })
    window.favella.sidecarStatus().then(setSidecarStatus)
    void loadLexicon()
    return unsub
  }, [loadLexicon, pushToast, setSidecarStatus])

  // Auto-compile (Fase 2): compila la storia (il file principale coi suoi moduli, sui
  // buffer aperti) all'apertura, a ogni modifica (debounced) e quando il motore diventa
  // pronto. Diagnostica sempre fresca senza bisogno di salvare.
  useEffect(() => {
    if (!activePath || !activePath.toLowerCase().endsWith('.fav')) return
    if (sidecarStatus !== 'ready') return
    const t = setTimeout(() => void compileActive(), 600)
    return () => clearTimeout(t)
  }, [activePath, revisione, sidecarStatus, compileActive])

  // Guardia «modifiche non salvate» in uscita: quando il main chiede di chiudere,
  // se ci sono file sporchi mostra il dialogo nativo Salva/Non salvare/Annulla.
  useEffect(() => {
    const unsub = window.favella.onRequestClose(async () => {
      const sporchi = useStudio
        .getState()
        .openFiles.filter((f) => f.content !== f.savedContent)
      if (sporchi.length === 0) {
        void window.favella.confirmClose()
        return
      }
      const scelta = await useStudio.getState().askUnsaved(sporchi.map((f) => f.name))
      if (scelta === 'cancel') return
      if (scelta === 'save') await useStudio.getState().saveAll()
      void window.favella.confirmClose()
    })
    return unsub
  }, [])

  // Sincronizzazione live: quando la finestra di gioco avanza (turno/avvio/reset),
  // ricarica i pannelli aperti leggendo dal sidecar condiviso. Così Stato/Debug/
  // Mappa dell'IDE riflettono la partita giocata nella finestra dedicata.
  useEffect(() => {
    const unsub = window.favella.onGameAdvanced(() => {
      const s = useStudio.getState()
      void s.loadWorldSnapshot()
      if (s.rightTab === 'debug' || (s.rightTab === 'gioca' && s.provaLato === 'debug')) void s.loadDebugHistory()
    })
    return unsub
  }, [])

  // Scorciatoie globali: Ctrl+S salva (tutti i file cambiati), Ctrl+Maiusc+S salva con nome,
  // Ctrl+O apre una cartella, Ctrl+Alt+R riordina il testo, F5 prova la storia, Ctrl+1…5
  // cambia sezione, Ctrl +/−/0 la grandezza dell'interfaccia.
  const startGame = useStudio((s) => s.startGame)
  const setSezione = useStudio((s) => s.setSezione)
  const setZoom = useStudio((s) => s.setZoom)
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (e.shiftKey) void salvaConNome()
        else void saveAll()
      }
      if (ctrl && e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        void riordinaStoria()
      }
      if (ctrl && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        void openProject()
      }
      if (e.key === 'F5') {
        e.preventDefault()
        if (useStudio.getState().activePath?.toLowerCase().endsWith('.fav')) void startGame()
      }
      if (ctrl && !e.shiftKey && !e.altKey) {
        const sez = SEZIONI.find((d) => d.tasto === e.key)
        if (sez && useStudio.getState().projectRoot) {
          e.preventDefault()
          setSezione(sez.id)
        }
        const z = useStudio.getState().zoom
        if (e.key === '+' || e.key === '=') {
          e.preventDefault()
          setZoom(z + 0.1)
        } else if (e.key === '-') {
          e.preventDefault()
          setZoom(z - 0.1)
        } else if (e.key === '0') {
          e.preventDefault()
          setZoom(1.1)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saveAll, salvaConNome, riordinaStoria, openProject, startGame, setSezione, setZoom])

  const projectRoot = useStudio((s) => s.projectRoot)
  const sezione = sezioneDi(rightTab)
  const zoom = useStudio((s) => s.zoom)
  const problemiAperti = useStudio((s) => s.problemiAperti)
  const esploraAperto = useStudio((s) => s.esploraAperto)
  const setEsploraAperto = useStudio((s) => s.setEsploraAperto)
  const haFile = useStudio((s) => s.openFiles.length > 0)

  // Leggibilità: lo zoom scelto vale per tutta l'interfaccia e si ricorda.
  useEffect(() => {
    window.favella.setZoom(zoom)
  }, [zoom])

  return (
    <div className="app">
      <TopBar />

      {!projectRoot ? (
        <Benvenuto />
      ) : (
        <div className="body">
          <Rail />
          {sezione === 'storia' ? (
            <div className="storia">
              {esploraAperto ? (
                <div className="storia-lato">
                  <Explorer />
                  <button
                    className="lato-chiudi"
                    onClick={() => setEsploraAperto(false)}
                    title="Nascondi l'elenco dei file"
                    aria-label="Nascondi l'elenco dei file"
                  >
                    ‹
                  </button>
                </div>
              ) : (
                <button
                  className="lato-apri"
                  onClick={() => setEsploraAperto(true)}
                  title="Mostra l'elenco dei file"
                  aria-label="Mostra l'elenco dei file"
                >
                  ›
                </button>
              )}
              <main className="editor-area">
                <TabBar />
                <div className="editor-host">{haFile ? <EditorPane /> : <ScegliStoria />}</div>
                {problemiAperti && <ProblemsPanel />}
              </main>
            </div>
          ) : (
            <Workspace />
          )}
        </div>
      )}

      <StatusBar />

      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.text}
          </div>
        ))}
      </div>

      <UnsavedDialog />
    </div>
  )
}
