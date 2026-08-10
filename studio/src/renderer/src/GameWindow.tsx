import { useEffect, useRef, useState } from 'react'
import { useStudio } from './store'
import MapView from './components/MapView'
import type { Outcome } from '../../shared/protocol'

const BANNER: Record<Outcome, { label: string; cls: string }> = {
  vinta: { label: '★ HAI VINTO', cls: 'win' },
  persa: { label: '☠ HAI PERSO', cls: 'lose' },
  terminata: { label: '■ Partita terminata', cls: 'end' }
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
  const notice = useStudio((s) => s.gameNotice)
  const clearNotice = useStudio((s) => s.clearGameNotice)

  const [input, setInput] = useState('')
  const storiaRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Avvio: recupera il payload dall'IDE e fa partire la sessione. Si riavvia su
  // 'game-relaunch' (l'IDE ha ripremuto ▶ Gioca).
  useEffect(() => {
    let attivo = true
    void window.favella.gameLaunchPayload().then((p) => {
      if (attivo && p) void startGameWith(p.path, p.source)
    })
    const unsub = window.favella.onGameRelaunch((p) => {
      if (p) void startGameWith(p.path, p.source)
    })
    return () => {
      attivo = false
      unsub()
    }
  }, [startGameWith])

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
  const banner = gameOver && state?.outcome ? BANNER[state.outcome] : null
  const inDialogue = state?.inDialogue && !gameOver
  const carry =
    snap && snap.carryMax !== null ? ` (${snap.carryUsed}/${snap.carryMax})` : ''

  return (
    <div className="gamewin">
      <header className="gw-header">
        <span className="gw-title">✦ Favella · Gioco</span>
        <span className="gw-place">{state?.room ?? '—'}</span>
        {notice && <span className="gw-notice">{notice}</span>}
        <span className="gw-spacer" />
        {state && !gameOver && <span className="gw-turn">turno {state.turn}</span>}
        <button className="gw-tool" title="Salva la partita" onClick={() => void saveGame()} disabled={busy || !state}>
          💾 Salva
        </button>
        <button className="gw-tool" title="Carica una partita" onClick={() => void loadGame()} disabled={busy}>
          📂 Carica
        </button>
        <button className="gw-restart-btn" onClick={() => void resetGame()} disabled={busy || !state}>
          ↻ Riavvia
        </button>
      </header>

      <div className="gw-body">
        <main className="gw-main">
          <div className="gw-storia" ref={storiaRef}>
            {error && <div className="gw-error">{error}</div>}
            {lines.map((l, i) => (
              <div key={i} className={'gw-line' + (l.startsWith('>') ? ' echo' : '')}>
                {l === '' ? ' ' : l}
              </div>
            ))}
            {busy && <div className="gw-line busy">…</div>}
            {banner && <div className={'game-banner ' + banner.cls}>{banner.label}</div>}
          </div>

          <div className="gw-parser">
            {inDialogue && (
              <div className="gw-options">
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
              {running && !gameOver ? (
                <>
                  <input
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
                  ▶ Rigioca
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
                    <span className={'gw-var-val ' + v.kind}>
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
  )
}
