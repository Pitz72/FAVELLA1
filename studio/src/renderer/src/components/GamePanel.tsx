import { useEffect, useRef, useState } from 'react'
import { useStudio } from '../store'
import type { Outcome } from '../../../shared/protocol'

const BANNER: Record<Outcome, { label: string; cls: string }> = {
  vinta: { label: '★ HAI VINTO', cls: 'win' },
  persa: { label: '☠ HAI PERSO', cls: 'lose' },
  terminata: { label: '■ Partita terminata', cls: 'end' }
}

export default function GamePanel(): JSX.Element {
  const lines = useStudio((s) => s.gameLines)
  const state = useStudio((s) => s.gameState)
  const running = useStudio((s) => s.gameRunning)
  const busy = useStudio((s) => s.gameBusy)
  const error = useStudio((s) => s.gameError)
  const startGame = useStudio((s) => s.startGame)
  const sendCommand = useStudio((s) => s.sendGameCommand)
  const resetGame = useStudio((s) => s.resetGame)

  const [input, setInput] = useState('')
  const consoleRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Auto-scroll della console all'ultima riga a ogni aggiornamento.
  useEffect(() => {
    const el = consoleRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, busy])

  // Rimetti a fuoco l'input quando il motore torna disponibile (fuori dialogo).
  useEffect(() => {
    if (running && !busy && !state?.inDialogue) inputRef.current?.focus()
  }, [running, busy, state?.inDialogue])

  const invia = (): void => {
    const testo = input.trim()
    if (!testo) return
    void sendCommand(testo)
    setInput('')
  }

  const gameOver = state?.gameOver
  const banner = gameOver && state?.outcome ? BANNER[state.outcome] : null
  const inDialogue = state?.inDialogue && !gameOver

  return (
    <div className="gamepanel">
      <div className="game-toolbar">
        <span className="game-loc">{state?.room ?? '—'}</span>
        <span className="game-toolbar-right">
          {state && !gameOver && <span className="game-turn">turno {state.turn}</span>}
          <button className="icon-btn" title="Riavvia la partita" onClick={() => void resetGame()} disabled={busy || !state}>
            ↻
          </button>
        </span>
      </div>

      <div className="game-console" ref={consoleRef}>
        {error && <div className="game-error">{error}</div>}
        {!error && lines.length === 0 && !busy && (
          <div className="game-hint">Premi ▶ Gioca per compilare e avviare l’avventura.</div>
        )}
        {lines.map((l, i) => (
          <div key={i} className={'game-line' + (l.startsWith('>') ? ' echo' : '')}>
            {l === '' ? ' ' : l}
          </div>
        ))}
        {busy && <div className="game-line busy">…</div>}

        {banner && <div className={'game-banner ' + banner.cls}>{banner.label}</div>}
      </div>

      {inDialogue && (
        <div className="game-options">
          {state!.dialogueOptions.map((opt) => (
            <button
              key={opt.index}
              className="game-option"
              disabled={busy}
              onClick={() => void sendCommand(String(opt.index))}
            >
              <span className="game-option-num">{opt.index}</span>
              {opt.text}
            </button>
          ))}
        </div>
      )}

      <div className="game-inputrow">
        {running && !gameOver ? (
          <>
            <input
              ref={inputRef}
              className="game-input"
              value={input}
              placeholder={inDialogue ? 'Scegli un’opzione o scrivi…' : 'Scrivi un comando…'}
              disabled={busy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') invia()
              }}
            />
            <button className="game-send" onClick={invia} disabled={busy || !input.trim()}>
              Invia
            </button>
          </>
        ) : (
          <button className="game-restart" onClick={() => void startGame()} disabled={busy}>
            {gameOver ? '▶ Rigioca' : '▶ Avvia'}
          </button>
        )}
      </div>
    </div>
  )
}
