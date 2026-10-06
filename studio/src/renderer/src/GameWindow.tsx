import { useEffect, useRef, useState } from 'react'
import { useStudio } from './store'
import MapView from './components/MapView'
import PulsantiGioco from './components/PulsantiGioco'
import { RigheRacconto } from './components/GamePanel'
import Riparo from './components/Riparo'
import { applicaAspetto } from './aspetto'
import { QUESTA_FINESTRA } from './store'
import logoStudio from './assets/favella-studio-logo.svg'
import type { Outcome } from '../../shared/protocol'

const ESITO: Record<Outcome, { titolo: string; classe: string }> = {
  vinta: { titolo: 'Hai vinto', classe: 'vinta' },
  persa: { titolo: 'Hai perso', classe: 'persa' },
  terminata: { titolo: 'La partita è finita', classe: 'finita' }
}

/**
 * Finestra di gioco dedicata (stile Godot): a blocchi, con font grande. Riceve
 * dall'IDE il file da giocare (path + buffer live) via IPC, avvia la sessione e
 * la guida. Store zustand indipendente dall'IDE, ma stesso sidecar (un'unica
 * partita, posseduta da questa finestra).
 */
export default function GameWindow(): JSX.Element {
  const lines = useStudio((s) => s.gameLines)
  const state = useStudio((s) => s.gameState)
  const running = useStudio((s) => s.gameRunning)
  const busy = useStudio((s) => s.gameBusy)
  const error = useStudio((s) => s.gameError)
  const snap = useStudio((s) => s.worldSnapshot)
  const startGameWith = useStudio((s) => s.startGameWith)
  const sendCommand = useStudio((s) => s.sendGameCommand)
  const resetGame = useStudio((s) => s.resetGame)
  const saveGame = useStudio((s) => s.saveGame)
  const loadGame = useStudio((s) => s.loadGame)
  const buttons = useStudio((s) => s.gameButtons)
  const zoom = useStudio((s) => s.zoom)
  const setZoom = useStudio((s) => s.setZoom)
  const notice = useStudio((s) => s.gameNotice)
  const clearNotice = useStudio((s) => s.clearGameNotice)
  const aspetto = useStudio((s) => s.aspetto)
  const altrove = useStudio((s) => s.partitaAltrove)

  // Stesso aspetto dello Studio (tema, contrasto).
  useEffect(() => applicaAspetto(aspetto), [aspetto])

  // La partita è una sola: se la riprende lo Studio, qui lo si dice.
  useEffect(
    () => window.favella.onGameOwner((chi) => useStudio.getState().setPartitaAltrove(chi !== QUESTA_FINESTRA)),
    []
  )

  const [input, setInput] = useState('')
  const storiaRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Avvio: recupera il payload dall'IDE e fa partire la sessione. Si riavvia su
  // 'game-relaunch' (l'IDE ha ripremuto ▶ Gioca).
  useEffect(() => {
    let attivo = true
    void window.favella.gameLaunchPayload().then((p) => {
      if (attivo && p) void startGameWith(p.path, p.source, p.sources)
    })
    const unsub = window.favella.onGameRelaunch((p) => {
      if (p) void startGameWith(p.path, p.source, p.sources)
    })
    return () => {
      attivo = false
      unsub()
    }
  }, [startGameWith])

  // Leggibilità: stesso zoom dell'IDE, e Ctrl +/−/0 anche qui.
  useEffect(() => {
    window.favella.setZoom(zoom)
  }, [zoom])
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!(e.ctrlKey || e.metaKey)) return
      const z = useStudio.getState().zoom
      if (e.key === '+' || e.key === '=') setZoom(z + 0.1)
      else if (e.key === '-') setZoom(z - 0.1)
      else if (e.key === '0') setZoom(1.1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setZoom])

  // Auto-scroll del blocco Storia all'ultima riga.
  useEffect(() => {
    const el = storiaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, busy])

  useEffect(() => {
    if (running && !busy && !state?.inDialogue) inputRef.current?.focus()
  }, [running, busy, state?.inDialogue])

  // La notifica (salvato/caricato) sparisce dopo qualche secondo.
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => clearNotice(), 3000)
    return () => clearTimeout(t)
  }, [notice, clearNotice])

  const invia = (): void => {
    const testo = input.trim()
    if (!testo) return
    void sendCommand(testo)
    setInput('')
  }

  const gameOver = state?.gameOver
  const esito = gameOver && state?.outcome ? ESITO[state.outcome] : null
  const inDialogue = state?.inDialogue && !gameOver
  const carry =
    snap && snap.carryMax !== null ? ` (${snap.carryUsed}/${snap.carryMax})` : ''

  return (
    <Riparo livello="app">
    <div className="gamewin">
      <header className="gw-header">
        <img className="gw-logo" src={logoStudio} alt="" width={30} height={30} />
        <span className="gw-title">Favella · Prova del gioco</span>
        <span className="gw-place">{state?.room ?? '—'}</span>
        {notice && <span className="gw-notice">{notice}</span>}
        <span className="gw-spacer" />
        {state && !gameOver && <span className="gw-turn">turno {state.turn}</span>}
        <button className="gw-tool" title="Salva la partita" onClick={() => void saveGame()} disabled={busy || !state}>
          Salva
        </button>
        <button className="gw-tool" title="Carica una partita" onClick={() => void loadGame()} disabled={busy}>
          Carica
        </button>
        <button className="gw-restart-btn" onClick={() => void resetGame()} disabled={busy || !state}>
          Ricomincia
        </button>
      </header>

      <div className="gw-body">
        <main className="gw-main">
          {altrove && (
            <div className="striscia striscia-info" role="status">
              <span>La partita adesso è nello Studio, nella Prova.</span>
              <button className="btn btn-piccolo" onClick={() => void resetGame()} disabled={busy}>
                Riprendi qui
              </button>
            </div>
          )}
          <div className="gw-storia racconto racconto-libro" ref={storiaRef} role="log" aria-live="polite" aria-label="Il racconto">
            {error && (
              <p className="racconto-errore" role="alert">
                {error}
              </p>
            )}
            <RigheRacconto righe={lines} />
            {busy && (
              <p className="racconto-attesa" aria-label="Il motore sta rispondendo">
                <span />
                <span />
                <span />
              </p>
            )}
            {esito && <p className={'racconto-esito ' + esito.classe}>{esito.titolo}</p>}
          </div>

          <div className="gw-parser">
            {running && !gameOver && !altrove && !inDialogue && buttons && buttons.modo !== 'testo' && (
              <div className="gw-buttons">
                <PulsantiGioco p={buttons} onComando={(c) => void sendCommand(c)} disabilitato={busy} />
              </div>
            )}
            {inDialogue && !altrove && (
              <div className="gw-options" role="group" aria-label="Le tue risposte">
                {state!.dialogueOptions.map((opt) => (
                  <button
                    key={opt.index}
                    className="gw-option"
                    disabled={busy}
                    onClick={() => void sendCommand(String(opt.index))}
                  >
                    <span className="gw-option-num">{opt.index}</span>
                    {opt.text}
                  </button>
                ))}
              </div>
            )}
            <div className="gw-inputrow">
              {running && !gameOver && !altrove ? (
                <>
                  <label className="visivamente-nascosto" htmlFor="comando-finestra">
                    Il tuo comando
                  </label>
                  <input
                    id="comando-finestra"
                    autoComplete="off"
                    spellCheck={false}
                    ref={inputRef}
                    className="gw-input"
                    value={input}
                    placeholder={inDialogue ? 'Scegli un’opzione o scrivi…' : 'Cosa vuoi fare?'}
                    disabled={busy}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') invia()
                    }}
                  />
                  <button className="gw-send" onClick={invia} disabled={busy || !input.trim()}>
                    Invia
                  </button>
                </>
              ) : (
                <button className="gw-replay" onClick={() => void resetGame()} disabled={busy || !state}>
                  Rigioca
                </button>
              )}
            </div>
          </div>
        </main>

        <aside className="gw-side">
          <section className="gw-block gw-inventario">
            <h3>Inventario{carry}</h3>
            {snap && snap.inventory.length > 0 ? (
              <ul className="gw-inv-list">
                {snap.inventory.map((i) => (
                  <li key={i.id}>{i.name}</li>
                ))}
              </ul>
            ) : (
              <p className="gw-none">a mani vuote</p>
            )}
          </section>

          <section className="gw-block gw-stato">
            <h3>Stato</h3>
            {snap ? (
              <div className="gw-stato-body">
                {snap.variables.length === 0 && <p className="gw-none">nessuna variabile</p>}
                {snap.variables.map((v) => (
                  <div key={v.name} className="gw-var">
                    <span className="gw-var-name">{v.name}</span>
                    <span className={'gw-var-val gw-var-' + v.kind}>
                      {v.value === null ? '∅' : String(v.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="gw-none">—</p>
            )}
          </section>

          <section className="gw-block gw-mappa">
            <h3>Mappa</h3>
            <div className="gw-mappa-host">
              <MapView compact />
            </div>
          </section>
        </aside>
      </div>
    </div>
    </Riparo>
  )
}
