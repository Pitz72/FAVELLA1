import { useEffect, useRef, useState } from 'react'
import { useStudio } from '../store'
import type { Outcome } from '../../../shared/protocol'
import PulsantiGioco from './PulsantiGioco'
import { IconaAggiorna, IconaFinestra, IconaPlay } from './Icone'

const ESITO: Record<Outcome, { titolo: string; classe: string }> = {
  vinta: { titolo: 'Hai vinto', classe: 'vinta' },
  persa: { titolo: 'Hai perso', classe: 'persa' },
  terminata: { titolo: 'La partita è finita', classe: 'finita' }
}

/** Le righe del motore come pagina di libro: «--- Stanza ---» diventa un titolo. */
export function RigheRacconto({ righe }: { righe: string[] }): JSX.Element {
  return (
    <>
      {righe.map((l, i) => {
        const titolo = /^---\s*(.+?)\s*---$/.exec(l)
        if (titolo) {
          return (
            <h3 key={i} className="racconto-stanza">
              {titolo[1]}
            </h3>
          )
        }
        if (l.startsWith('>')) {
          return (
            <p key={i} className="racconto-comando">
              <span className="visivamente-nascosto">Hai scritto: </span>
              {l.replace(/^>\s?/, '')}
            </p>
          )
        }
        return (
          <p key={i} className={'racconto-riga' + (l === '' ? ' vuota' : '')}>
            {l === '' ? ' ' : l}
          </p>
        )
      })}
    </>
  )
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
  const buttons = useStudio((s) => s.gameButtons)
  const altrove = useStudio((s) => s.partitaAltrove)
  const launchGameWindow = useStudio((s) => s.launchGameWindow)

  const [input, setInput] = useState('')
  // I pulsanti-verbo si possono nascondere, per avere più spazio per il racconto.
  const [conPulsanti, setConPulsanti] = useState<boolean>(() => {
    try {
      return localStorage.getItem('favella.provaPulsanti') !== 'false'
    } catch {
      return true
    }
  })
  const alternaPulsanti = (): void => {
    setConPulsanti((v) => {
      try {
        localStorage.setItem('favella.provaPulsanti', String(!v))
      } catch {
        /* best-effort */
      }
      return !v
    })
  }
  const consoleRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Il racconto scorre all'ultima riga a ogni aggiornamento.
  useEffect(() => {
    const el = consoleRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, busy])

  // Il fuoco torna al campo quando il motore ha risposto (fuori dialogo).
  useEffect(() => {
    if (running && !busy && !state?.inDialogue && !altrove) inputRef.current?.focus()
  }, [running, busy, state?.inDialogue, altrove])

  const invia = (): void => {
    const testo = input.trim()
    if (!testo) return
    void sendCommand(testo)
    setInput('')
  }

  const gameOver = state?.gameOver
  const esito = gameOver && state?.outcome ? ESITO[state.outcome] : null
  const inDialogue = state?.inDialogue && !gameOver
  const attiva = running && !gameOver && !altrove

  return (
    <div className="gioco">
      <div className="gioco-testa">
        <div className="gioco-dove">
          <span className="gioco-stanza">{state?.room ?? 'La prova'}</span>
          {state && !gameOver && <span className="distintivo">turno {state.turn}</span>}
        </div>
        {buttons && buttons.modo !== 'testo' && (
          <label className="interruttore" title="Mostra o nascondi i pulsanti-verbo sotto il racconto">
            <input type="checkbox" role="switch" checked={conPulsanti} onChange={alternaPulsanti} />
            <span className="interruttore-binario" aria-hidden="true" />
            <span>Pulsanti</span>
          </label>
        )}
        <button className="btn btn-quieto btn-piccolo" onClick={() => void resetGame()} disabled={busy || !state} title="Ricomincia la partita dall’inizio">
          <IconaAggiorna />
          Ricomincia
        </button>
        <button className="btn btn-quieto btn-piccolo" onClick={launchGameWindow} title="Gioca in una finestra a parte, come chi riceve la storia">
          <IconaFinestra />
          Finestra a parte
        </button>
      </div>

      {altrove && (
        <div className="striscia striscia-info" role="status">
          <span>La partita adesso è nella finestra a parte. Qui la vedi com’era.</span>
          <button className="btn btn-piccolo" onClick={() => void startGame()} disabled={busy}>
            Riprendi qui
          </button>
        </div>
      )}

      <div className="racconto" ref={consoleRef} role="log" aria-live="polite" aria-label="Il racconto della partita">
        {error && (
          <p className="racconto-errore" role="alert">
            {error}
          </p>
        )}
        {!error && lines.length === 0 && !busy && (
          <div className="vuoto">
            <p className="vuoto-titolo">La tua storia, giocata.</p>
            <p>Premi «Avvia la prova» (o F5): Studio compila il testo e ti mette nella prima stanza.</p>
          </div>
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

      {attiva && buttons && buttons.modo !== 'testo' && !inDialogue && (conPulsanti || buttons.modo === 'pulsanti') && (
        <div className="gioco-pulsanti">
          <PulsantiGioco p={buttons} onComando={(c) => void sendCommand(c)} disabilitato={busy} />
        </div>
      )}

      {attiva && inDialogue && (
        <div className="gioco-risposte" role="group" aria-label="Le tue risposte">
          {state!.dialogueOptions.map((opt) => (
            <button key={opt.index} className="risposta" disabled={busy} onClick={() => void sendCommand(String(opt.index))}>
              <span className="risposta-numero">{opt.index}</span>
              {opt.text}
            </button>
          ))}
        </div>
      )}

      <div className="gioco-comando">
        {attiva ? (
          <>
            <label className="visivamente-nascosto" htmlFor="comando-prova">
              Il tuo comando
            </label>
            <input
              id="comando-prova"
              ref={inputRef}
              className="campo-comando"
              value={input}
              placeholder={inDialogue ? 'Scegli una risposta, o scrivi…' : 'Che cosa fai?'}
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') invia()
              }}
            />
            <button className="btn btn-primario" onClick={invia} disabled={busy || !input.trim()}>
              Invia
            </button>
          </>
        ) : (
          <button className="btn btn-prova btn-largo" onClick={() => void startGame()} disabled={busy}>
            <IconaPlay />
            {gameOver ? 'Gioca di nuovo' : 'Avvia la prova'}
          </button>
        )}
      </div>
    </div>
  )
}
