import { useEffect, useState, useCallback } from 'react'
import './monaco/setup' // side-effect: configura worker + loader Monaco (offline)
import { useStudio } from './store'
import Explorer from './components/Explorer'
import TabBar from './components/TabBar'
import EditorPane from './components/EditorPane'
import ProblemsPanel from './components/ProblemsPanel'
import StatusBar from './components/StatusBar'
import RightDock from './components/RightDock'
import UnsavedDialog from './components/UnsavedDialog'
import type { EngineEvent, EngineLexicon } from '../../shared/protocol'

interface Toast {
  id: number
  text: string
}

export default function App(): JSX.Element {
  const setLexicon = useStudio((s) => s.setLexicon)
  const setSidecarStatus = useStudio((s) => s.setSidecarStatus)
  const saveActive = useStudio((s) => s.saveActive)
  const saveAll = useStudio((s) => s.saveAll)
  const openProject = useStudio((s) => s.openProject)
  const compileActive = useStudio((s) => s.compileActive)
  const launchGameWindow = useStudio((s) => s.launchGameWindow)
  const setRightTab = useStudio((s) => s.setRightTab)
  const closeDock = useStudio((s) => s.closeDock)
  const rightTab = useStudio((s) => s.rightTab)
  const activePath = useStudio((s) => s.activePath)
  const isFav = !!activePath?.toLowerCase().endsWith('.fav')
  const dirty = useStudio((s) => {
    const f = s.openFiles.find((x) => x.path === s.activePath)
    return !!f && f.content !== f.savedContent
  })
  const activeContent = useStudio((s) =>
    s.openFiles.find((f) => f.path === s.activePath)?.content
  )
  const sidecarStatus = useStudio((s) => s.sidecarStatus)
  const [toasts, setToasts] = useState<Toast[]>([])

  const pushToast = useCallback((text: string) => {
    const id = Date.now() + Math.floor(performance.now())
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

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
        if (event.status === 'crashed') pushToast('Il motore FAVELLA è andato in errore.')
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

  // Auto-compile (Fase 2): compila il buffer attivo all'apertura, a ogni modifica
  // (debounced) e quando il motore diventa pronto. Diagnostica sempre fresca senza
  // bisogno di salvare; gli Includi sono risolti dal disco.
  useEffect(() => {
    if (!activePath || !activePath.toLowerCase().endsWith('.fav')) return
    if (sidecarStatus !== 'ready') return
    const t = setTimeout(() => void compileActive(), 600)
    return () => clearTimeout(t)
  }, [activePath, activeContent, sidecarStatus, compileActive])

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

  // Scorciatoie globali: Ctrl+S salva il file attivo, Ctrl+Shift+S salva tutto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (e.shiftKey) void saveAll()
        else void saveActive()
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        void openProject()
      }
      // F5: apre la finestra di gioco dedicata sul file .fav attivo.
      if (e.key === 'F5') {
        e.preventDefault()
        launchGameWindow()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saveActive, saveAll, openProject, launchGameWindow])

  return (
    <div className="app">
      <header className="titlebar">
        <span className="logo">✦ Favella Studio</span>
        <div className="titlebar-right">
          <button
            className={'tool-btn save-btn' + (dirty ? ' dirty' : '')}
            title="Salva il file attivo (Ctrl+S)"
            onClick={() => void saveActive()}
            disabled={!dirty}
          >
            {dirty ? '● Salva' : '✓ Salvato'}
          </button>
          <span className="titlebar-sep" />
          <button
            className={'tool-btn' + (rightTab === 'mappa' ? ' active' : '')}
            title="Mappa del mondo (editabile)"
            onClick={() => (rightTab === 'mappa' ? closeDock() : setRightTab('mappa'))}
            disabled={!isFav}
          >
            🗺 Mappa
          </button>
          <button
            className={'tool-btn' + (rightTab === 'stato' ? ' active' : '')}
            title="Ispettore di stato"
            onClick={() => (rightTab === 'stato' ? closeDock() : setRightTab('stato'))}
          >
            🔎 Stato
          </button>
          <button
            className={'tool-btn' + (rightTab === 'debug' ? ' active' : '')}
            title="Debugger passo-passo (timeline dei turni)"
            onClick={() => (rightTab === 'debug' ? closeDock() : setRightTab('debug'))}
          >
            🐞 Debug
          </button>
          <button
            className="play-btn"
            title="Apri il gioco in una finestra dedicata (F5)"
            onClick={launchGameWindow}
            disabled={!isFav}
          >
            ▶ Gioca
          </button>
        </div>
      </header>

      <div className="workbench">
        <Explorer />
        <main className="editor-area">
          <TabBar />
          <div className="editor-host">
            <EditorPane />
          </div>
          <ProblemsPanel />
        </main>
        <RightDock />
      </div>

      <StatusBar />

      <div className="toasts">
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
