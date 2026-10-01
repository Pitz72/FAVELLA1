import { useState } from 'react'
import { useStudio } from '../store'
import type { CommandsMode } from '../../../shared/protocol'

// «Parole e comandi»: ciò che riguarda il modo di parlare con la storia.
//  • Come comanda il giocatore: scrivendo, toccando i pulsanti, o tutti e due.
//  • I verbi che l'autore ha inventato («lancia», «accelera»).
//  • I sinonimi: parole che valgono come un'altra azione, con «(voluto)» quando si
//    cambia di proposito il significato di una parola che il motore già conosce.

const MODI: { id: CommandsMode; titolo: string; descr: string }[] = [
  { id: 'entrambi', titolo: 'Scrivere o toccare', descr: 'Chi gioca sceglie: scrive i comandi, oppure compone la frase con i pulsanti.' },
  { id: 'testo', titolo: 'Solo scrivere', descr: 'Nessun pulsante: si gioca come nelle avventure testuali di una volta.' },
  { id: 'pulsanti', titolo: 'Solo pulsanti', descr: 'Si compone ogni frase toccando verbi e oggetti: ideale per il telefono.' }
]

export default function WordsEditor(): JSX.Element {
  const words = useStudio((s) => s.words)
  const loading = useStudio((s) => s.wordsLoading)
  const loadWords = useStudio((s) => s.loadWords)
  const applyStatement = useStudio((s) => s.applyStatement)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const requestReveal = useStudio((s) => s.requestReveal)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))

  const [nuovoVerbo, setNuovoVerbo] = useState('')
  const [senzaOggetto, setSenzaOggetto] = useState(false)
  const [sinParola, setSinParola] = useState('')
  const [sinBersaglio, setSinBersaglio] = useState('')
  const [sinVoluto, setSinVoluto] = useState(false)

  if (!isFav) return <div className="insp-empty">Apri un file .fav per modificare parole e comandi.</div>
  if (!words) {
    return (
      <div className="insp-empty">
        {loading ? 'Carico le parole…' : 'Nessuna parola caricata.'}
        {!loading && (
          <button className="map-reload" onClick={() => void loadWords()}>
            ⟳ Carica
          </button>
        )}
      </div>
    )
  }
  if (!words.ok) {
    return (
      <div className="insp-empty">
        Il file contiene errori: correggili per usare questo pannello.
        <button className="map-reload" onClick={() => void loadWords()}>
          ⟳ Riprova
        </button>
      </div>
    )
  }

  const impostaModo = async (mode: CommandsMode): Promise<void> => {
    await applyStatement({ op: 'commands_mode', mode }, words.modeSpan ?? undefined)
  }
  const aggiungiVerbo = async (): Promise<void> => {
    const word = nuovoVerbo.trim().toLowerCase()
    if (!word) return
    setNuovoVerbo('')
    await applyStatement({ op: 'verb_decl', word, noObject: senzaOggetto })
  }
  const aggiungiSinonimo = async (): Promise<void> => {
    const word = sinParola.trim().toLowerCase()
    const target = sinBersaglio.trim().toLowerCase()
    if (!word || !target) return
    setSinParola('')
    setSinBersaglio('')
    await applyStatement({ op: 'synonym', word, target, voluto: sinVoluto })
    setSinVoluto(false)
  }
  const cambiaVoluto = async (i: number): Promise<void> => {
    const s = words.synonyms[i]
    await applyStatement({ op: 'synonym', word: s.word, target: s.target, voluto: !s.voluto }, s.span ?? undefined)
  }

  return (
    <div className="words">
      <section className="words-sez">
        <h2>Come comanda il giocatore</h2>
        <div className="words-modi" role="radiogroup" aria-label="Come comanda il giocatore">
          {MODI.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={words.mode === m.id}
              className={'words-modo' + (words.mode === m.id ? ' on' : '')}
              onClick={() => void impostaModo(m.id)}
            >
              <span className="words-modo-titolo">{m.titolo}</span>
              <span className="words-modo-descr">{m.descr}</span>
            </button>
          ))}
        </div>
        <p className="var-note">
          {words.modeSpan
            ? 'Scritto nella storia come una frase: «I comandi si scrivono…».'
            : 'Se non dici niente, vale «Scrivere o toccare». Scegliere una voce aggiunge la frase alla storia.'}
        </p>
      </section>

      <section className="words-sez">
        <h2>
          I verbi inventati da te<span className="debug-count"> · {words.verbs.length}</span>
        </h2>
        <p className="var-note">
          Un verbo che il motore non conosce («lancia», «accelera») si dichiara, e poi si scrive una regola che dice cosa succede.
        </p>
        {words.verbs.length === 0 && <p className="insp-none">nessun verbo inventato</p>}
        <ul className="words-lista">
          {words.verbs.map((v, i) => (
            <li key={v.word + i} className="words-riga">
              <span className="words-parola">{v.word}</span>
              {v.noObject && <span className="var-badge">senza oggetto</span>}
              <span className="ws-spacer" />
              {v.span && (
                <>
                  <button className="rule-edit" title="Vai al testo" onClick={() => requestReveal(v.span!.file, v.span!.line, 1)}>
                    ✎ testo
                  </button>
                  <button className="rule-del" title="Togli questo verbo" onClick={() => void deleteStatement(v.span!)}>
                    ×
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="words-nuovo">
          <input
            type="text"
            placeholder="un verbo nuovo, es. lancia"
            value={nuovoVerbo}
            onChange={(e) => setNuovoVerbo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void aggiungiVerbo()}
          />
          <label className="objed-check">
            <input type="checkbox" checked={senzaOggetto} onChange={(e) => setSenzaOggetto(e.target.checked)} />
            senza oggetto
          </label>
          <button className="btn-testo" disabled={!nuovoVerbo.trim()} onClick={() => void aggiungiVerbo()}>
            + Aggiungi
          </button>
        </div>
      </section>

      <section className="words-sez">
        <h2>
          Parole che valgono come un’altra<span className="debug-count"> · {words.synonyms.length}</span>
        </h2>
        <p className="var-note">
          «ghermisci» vale «prendi»: scrivi una regola per «prendi» e funziona per tutte e due. Se cambi di proposito il significato di una parola che
          il motore già conosce, spunta «voluto»: l’avviso sparisce.
        </p>
        {words.synonyms.length === 0 && <p className="insp-none">nessun sinonimo</p>}
        <ul className="words-lista">
          {words.synonyms.map((s, i) => (
            <li key={s.word + i} className="words-riga">
              <span className="words-parola">{s.word}</span>
              <span className="words-vale">vale</span>
              <span className="words-parola">{s.target}</span>
              <label className="objed-check words-voluto" title="Il cambio di significato è voluto: niente avviso">
                <input type="checkbox" checked={s.voluto} onChange={() => void cambiaVoluto(i)} disabled={!s.span} />
                voluto
              </label>
              <span className="ws-spacer" />
              {s.span && (
                <button className="rule-del" title="Togli questo sinonimo" onClick={() => void deleteStatement(s.span!)}>
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="words-nuovo">
          <input type="text" placeholder="la parola, es. ghermisci" value={sinParola} onChange={(e) => setSinParola(e.target.value)} />
          <span className="words-vale">vale</span>
          <input
            type="text"
            placeholder="l’azione, es. prendi"
            value={sinBersaglio}
            onChange={(e) => setSinBersaglio(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void aggiungiSinonimo()}
          />
          <label className="objed-check">
            <input type="checkbox" checked={sinVoluto} onChange={(e) => setSinVoluto(e.target.checked)} />
            voluto
          </label>
          <button className="btn-testo" disabled={!sinParola.trim() || !sinBersaglio.trim()} onClick={() => void aggiungiSinonimo()}>
            + Aggiungi
          </button>
        </div>
      </section>
    </div>
  )
}
