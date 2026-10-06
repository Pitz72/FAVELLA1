import { useEffect, useCallback } from 'react'
import './monaco/setup' // side-effect: configura worker + loader Monaco (offline)
import { useStudio, QUESTA_FINESTRA } from './store'
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
import UpdateDialog from './components/UpdateDialog'
import Avvisi from './components/Avvisi'
import ConsensoAggiornamenti from './components/ConsensoAggiornamenti'
import Riparo from './components/Riparo'
import { IconaChevron } from './components/Icone'
import { applicaAspetto } from './aspetto'
import type { EngineEvent, EngineLexicon } from '../../shared/protocol'

/** Il fuoco è in un campo di testo (o nell'editor)? Allora le scorciatoie «nude» tacciono. */
function staScrivendo(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  if (el.closest('.monaco-editor')) return true
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export default function App(): JSX.Element {
  const setLexicon = useStudio((s) => s.setLexicon)
  const setSidecarStatus = useStudio((s) => s.setSidecarStatus)
  const saveAll = useStudio((s) => s.saveAll)
  const salvaConNome = useStudio((s) => s.salvaConNome)
  const riordinaStoria = useStudio((s) => s.riordinaStoria)
  const openProject = useStudio((s) => s.openProject)
  const openStory = useStudio((s) => s.openStory)
  const compileActive = useStudio((s) => s.compileActive)
  const rightTab = useStudio((s) => s.rightTab)
  const activePath = useStudio((s) => s.activePath)
  // Sale a ogni cambio del testo (digitato o fatto da un pannello, in qualunque file della storia).
  const revisione = useStudio((s) => s.revisione)
  const sidecarStatus = useStudio((s) => s.sidecarStatus)
  const setUpdaterStatus = useStudio((s) => s.setUpdaterStatus)
  const avvisa = useStudio((s) => s.avvisa)
  const aspetto = useStudio((s) => s.aspetto)

  // Gli avvisi degli editor visuali (gameNotice: riordino, esportazione, rinomina…)
  // diventano avvisi in basso a destra.
  const gameNotice = useStudio((s) => s.gameNotice)
  const clearGameNotice = useStudio((s) => s.clearGameNotice)
  useEffect(() => {
    if (gameNotice) {
      avvisa(gameNotice)
      clearGameNotice()
    }
  }, [gameNotice, avvisa, clearGameNotice])

  // Tema e contrasto (Leggibilità): sul documento intero.
  useEffect(() => applicaAspetto(aspetto), [aspetto])

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
        if (event.status === 'restarting') avvisa('Il motore si è chiuso: lo riavvio…', { tipo: 'errore' })
        if (event.status === 'crashed') {
          // La causa (l'ultima riga del traceback Python) insieme al messaggio.
          avvisa('Il motore FAVELLA è andato in errore' + (event.detail ? `: ${event.detail}` : '.'), {
            tipo: 'errore',
            durata: 10000
          })
          void window.favella.sidecarLastError().then((tail) => {
            if (tail) console.error('[motore FAVELLA — stderr]\n' + tail)
          })
        }
      } else if (event.kind === 'ready') {
        setSidecarStatus('ready')
        if (event.data.engineLoaded) void loadLexicon()
        else avvisa('Il motore non si è caricato: ' + (event.data.engineError ?? '?'), { tipo: 'errore', durata: 10000 })
      }
    })
    window.favella.sidecarStatus().then(setSidecarStatus)
    void loadLexicon()
    return unsub
  }, [loadLexicon, avvisa, setSidecarStatus])

  // Aggiornamenti: lo stato arriva dal main; la prima volta si chiede il permesso.
  useEffect(() => {
    const unsub = window.favella.onUpdaterStatus((status) => {
      setUpdaterStatus(status)
      if (status.type === 'available' && !status.manual) {
        avvisa(`C’è una versione nuova di Favella Studio: la ${status.version}.`, {
          azione: { etichetta: 'Vedi', esegui: () => useStudio.getState().setUpdateModalOpen(true) },
          durata: 12000
        })
      }
    })
    void window.favella.getUpdaterStatus().then(setUpdaterStatus)
    void window.favella.getAutoUpdates().then((v) => useStudio.getState().setAggiornamentiAuto(v))
    return unsub
  }, [setUpdaterStatus, avvisa])

  // Una sola partita nel motore: se la prende la finestra di gioco, la Prova qui si ferma.
  useEffect(() => {
    return window.favella.onGameOwner((chi) => useStudio.getState().setPartitaAltrove(chi !== QUESTA_FINESTRA))
  }, [])

  // Auto-compile (Fase 2): compila la storia (il file principale coi suoi moduli, sui
  // buffer aperti) all'apertura, a ogni modifica (debounced) e quando il motore diventa
  // pronto. Diagnostica sempre fresca senza bisogno di salvare.
  useEffect(() => {
    if (!activePath || !activePath.toLowerCase().endsWith('.fav')) return
    if (sidecarStatus !== 'ready') return
    const t = setTimeout(() => void compileActive(), 600)
    return () => clearTimeout(t)
  }, [activePath, revisione, sidecarStatus, compileActive])

  // Guardia «modifiche non salvate» in uscita (finestra, Alt+F4, Cmd+Q, aggiornamento):
  // il main chiede, qui si decide; il motore si ferma solo dopo la conferma.
  useEffect(() => {
    return window.favella.onRequestClose(async () => {
      if (await useStudio.getState().guardiaNonSalvati()) void window.favella.confirmClose()
    })
  }, [])

  // Sincronizzazione live: quando la finestra di gioco avanza (turno/avvio/reset),
  // ricarica i pannelli aperti leggendo dal sidecar condiviso.
  useEffect(() => {
    return window.favella.onGameAdvanced(() => {
      const s = useStudio.getState()
      void s.loadWorldSnapshot()
      if (s.rightTab === 'debug' || (s.rightTab === 'gioca' && s.provaLato === 'debug')) void s.loadDebugHistory()
    })
  }, [])

  // Scorciatoie globali: Ctrl+S salva tutto, Ctrl+Maiusc+S salva con nome, Ctrl+O apre una
  // storia, Ctrl+Maiusc+O una cartella, Ctrl+Alt+R riordina, F5 prova, Ctrl+1…5 le
  // sezioni, Ctrl +/−/0 la grandezza, Ctrl+Z (fuori dal testo) annulla l'ultima modifica
  // fatta da un pannello.
  const startGame = useStudio((s) => s.startGame)
  const setSezione = useStudio((s) => s.setSezione)
  const setZoom = useStudio((s) => s.setZoom)
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const ctrl = e.ctrlKey || e.metaKey
      const tasto = e.key.toLowerCase()
      if (ctrl && tasto === 's') {
        e.preventDefault()
        if (e.shiftKey) void salvaConNome()
        else void saveAll()
        return
      }
      if (ctrl && e.altKey && tasto === 'r') {
        e.preventDefault()
        void riordinaStoria()
        return
      }
      if (ctrl && tasto === 'o') {
        e.preventDefault()
        if (e.shiftKey) void openProject()
        else void openStory()
        return
      }
      if (ctrl && !e.shiftKey && tasto === 'z' && !staScrivendo()) {
        const st = useStudio.getState()
        if (st.rightTab !== null && st.storicoPannelli.length > 0) {
          e.preventDefault()
          void st.annullaModificaPannello()
        }
        return
      }
      if (e.key === 'F5') {
        e.preventDefault()
        if (useStudio.getState().activePath?.toLowerCase().endsWith('.fav')) void startGame()
        return
      }
      if (ctrl && !e.shiftKey && !e.altKey) {
        const sez = SEZIONI.find((d) => d.tasto === e.key)
        if (sez && useStudio.getState().projectRoot) {
          e.preventDefault()
          setSezione(sez.id)
          return
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
  }, [saveAll, salvaConNome, riordinaStoria, openProject, openStory, startGame, setSezione, setZoom])

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
      <a className="salta" href="#area-principale">
        Salta all’area di lavoro
      </a>
      <TopBar />

      <Riparo livello="app">
        {!projectRoot ? (
          <Benvenuto />
        ) : (
          <div className="corpo">
            <Rail />
            <div className="area" id="area-principale" tabIndex={-1}>
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
                        <IconaChevron direzione="sinistra" />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="lato-apri"
                      onClick={() => setEsploraAperto(true)}
                      title="Mostra l'elenco dei file"
                      aria-label="Mostra l'elenco dei file"
                    >
                      <IconaChevron direzione="destra" />
                    </button>
                  )}
                  <main className="editor-area" aria-label="Il testo della storia">
                    <TabBar />
                    <div className="editor-host">
                      <Riparo livello="pannello" chiave="testo">
                        {haFile ? <EditorPane /> : <ScegliStoria />}
                      </Riparo>
                    </div>
                    {problemiAperti && <ProblemsPanel />}
                  </main>
                </div>
              ) : (
                <Workspace />
              )}
            </div>
          </div>
        )}
      </Riparo>

      <StatusBar />
      <Avvisi />
      <ConsensoAggiornamenti />
      <UnsavedDialog />
      <UpdateDialog />
    </div>
  )
}
