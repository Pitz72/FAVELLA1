import { useEffect } from 'react'
import { useStudio, infoStoria } from '../store'
import { defSezione, sezioneDi } from '../sezioni'
import { nomeFile, stessoFile } from '../utils/progetto'
import GamePanel from './GamePanel'
import MapView from './MapView'
import StateInspector from './StateInspector'
import DebugPanel from './DebugPanel'
import ObjectsEditor from './ObjectsEditor'
import CharactersEditor from './CharactersEditor'
import RoomEditor from './RoomEditor'
import RulesEditor from './RulesEditor'
import VariablesEditor from './VariablesEditor'
import DialoguesEditor from './DialoguesEditor'
import WordsEditor from './WordsEditor'
import EditorPane from './EditorPane'
import Riparo from './Riparo'
import { IconaAvviso, IconaChiudi } from './Icone'

// L'area di lavoro delle sezioni visuali (Mondo, Personaggi, Regole, Prova). Ogni sezione
// ha la stessa intestazione: il titolo e che cosa si fa qui, le sue parti (linguette), e a
// destra dove vanno le cose nuove e l'interruttore per avere il testo accanto.

/** Le linguette di una sezione: role=tablist, frecce sinistra/destra per spostarsi. */
function Linguette<T extends string>({
  voci,
  attiva,
  onScegli,
  etichetta
}: {
  voci: { id: T; titolo: string; aiuto?: string }[]
  attiva: T
  onScegli: (id: T) => void
  etichetta: string
}): JSX.Element {
  const sposta = (i: number, e: React.KeyboardEvent<HTMLButtonElement>): void => {
    const j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null
    if (j === null) return
    e.preventDefault()
    const v = voci[(j + voci.length) % voci.length]
    onScegli(v.id)
    const lista = e.currentTarget.parentElement
    requestAnimationFrame(() => lista?.querySelector<HTMLButtonElement>(`[data-id="${v.id}"]`)?.focus())
  }
  return (
    <div className="linguette" role="tablist" aria-label={etichetta}>
      {voci.map((v, i) => (
        <button
          key={v.id}
          data-id={v.id}
          role="tab"
          aria-selected={attiva === v.id}
          tabIndex={attiva === v.id ? 0 : -1}
          className={'linguetta' + (attiva === v.id ? ' attiva' : '')}
          onClick={() => onScegli(v.id)}
          onKeyDown={(e) => sposta(i, e)}
          title={v.aiuto}
        >
          {v.titolo}
        </button>
      ))}
    </div>
  )
}

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
    <aside className="prova-lato" aria-label="Lo stato della partita">
      <Linguette
        etichetta="Che cosa guardare"
        attiva={lato}
        onScegli={scegli}
        voci={[
          { id: 'stato', titolo: 'Partita', aiuto: 'Dove sei, che cosa porti, gli stati e i contatori' },
          { id: 'mappa', titolo: 'Mappa', aiuto: 'Le stanze, e dove sei adesso' },
          { id: 'debug', titolo: 'Passo passo', aiuto: 'Che cosa è cambiato a ogni turno' }
        ]}
      />
      <div className="prova-lato-corpo">
        <Riparo livello="pannello" chiave={'prova-' + lato}>
          {lato === 'stato' && <StateInspector />}
          {lato === 'mappa' && <MapView compact />}
          {lato === 'debug' && <DebugPanel />}
        </Riparo>
      </div>
    </aside>
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
  const loadWords = useStudio((s) => s.loadWords)
  const gameRunning = useStudio((s) => s.gameRunning)
  const revisione = useStudio((s) => s.revisione)
  const info = useStudio((s) => {
    const st = infoStoria(s)
    // Una stringa stabile (non un oggetto nuovo a ogni giro): il pannello si ridisegna solo se cambia la storia.
    return st ? JSON.stringify({ r: st.radice, m: st.membri }) : ''
  })
  const destinazione = useStudio((s) => s.destinazioneNuovi)
  const activePath = useStudio((s) => s.activePath)
  const impostaDestinazione = useStudio((s) => s.impostaDestinazioneNuovi)
  const storia = info ? (JSON.parse(info) as { r: string; m: string[] }) : null
  const nuoviIn =
    storia && destinazione && storia.m.some((m) => stessoFile(m, destinazione))
      ? destinazione
      : storia && activePath && storia.m.some((m) => stessoFile(m, activePath))
        ? activePath
        : (storia?.r ?? '')

  // Il lato della Prova effettivamente visibile (per sapere che cosa ricaricare).
  const latoProva = tab === 'stato' || tab === 'debug' ? tab : provaLato

  // All'apertura di ogni vista aggiorna i dati: Mappa → topologia, Partita →
  // snapshot live, Passo passo → history dei turni, gli editor → il loro modello.
  useEffect(() => {
    if (tab === 'mappa') {
      void loadGraph()
      void loadOutline()
    }
    if (tab === 'oggetti' || tab === 'stanze') void loadOutline()
    if (tab === 'personaggi') {
      void loadOutline()
      void loadDialogues()
    }
    if (tab === 'regole') void loadRules()
    if (tab === 'stati') void loadVariables()
    if (tab === 'dialoghi') void loadDialogues()
    if (tab === 'parole') void loadWords()
    if (tab === 'gioca' || tab === 'stato' || tab === 'debug') {
      if (latoProva === 'stato') void loadSnapshot()
      if (latoProva === 'mappa') void loadGraph()
      if (latoProva === 'debug') void loadDebug()
    }
  }, [tab, latoProva, loadGraph, loadSnapshot, loadDebug, loadOutline, loadRules, loadVariables, loadDialogues, loadWords])

  // La Mappa segue il testo mentre si scrive (solo in anteprima, senza partita in corso).
  useEffect(() => {
    if (tab !== 'mappa' || gameRunning) return
    const t = setTimeout(() => {
      void loadGraph()
      void loadOutline()
    }, 500)
    return () => clearTimeout(t)
  }, [tab, revisione, gameRunning, loadGraph, loadOutline])

  if (tab === null) return null
  const sezione = defSezione(sezioneDi(tab))
  const inProva = sezione.id === 'prova'

  return (
    <section className={'lavoro lavoro-' + sezione.id} aria-labelledby="lavoro-titolo">
      <header className="lavoro-testa">
        <div className="lavoro-titolo">
          <h1 id="lavoro-titolo">{sezione.titolo}</h1>
          <p>{sezione.descrizione}</p>
        </div>

        {!inProva && (
          <div className="lavoro-controlli">
            {/* Con una storia a più file: dove vanno le cose nuove. */}
            {storia && storia.m.length > 1 && (
              <label
                className="campo-in-linea"
                title="Le stanze, gli oggetti e le frasi nuove si scrivono in questo file. Quelle già scritte si cambiano nel file in cui stanno."
              >
                <span>Le cose nuove vanno in</span>
                <select aria-label="Il file dove vanno le cose nuove" value={nuoviIn} onChange={(e) => impostaDestinazione(e.target.value)}>
                  {storia.m.map((m) => (
                    <option key={m} value={m}>
                      {nomeFile(m)}
                      {m === storia.r ? ' (principale)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="interruttore" title="Mostra il testo della storia accanto a questo pannello">
              <input type="checkbox" role="switch" checked={affianca} onChange={(e) => setAffianca(e.target.checked)} />
              <span className="interruttore-binario" aria-hidden="true" />
              <span>Testo accanto</span>
            </label>
          </div>
        )}
      </header>

      {sezione.sotto.length > 1 && (
        <Linguette
          etichetta={`Parti di ${sezione.titolo}`}
          attiva={tab as (typeof sezione.sotto)[number]['tab']}
          onScegli={(id) => setRightTab(id)}
          voci={sezione.sotto.map((x) => ({ id: x.tab, titolo: x.titolo, aiuto: x.aiuto }))}
        />
      )}

      {/* Errore dell'ultima azione di un editor, mostrato qui dove l'azione è nata. */}
      {editError && !inProva && (
        <div className="striscia striscia-errore" role="alert">
          <IconaAvviso size={18} />
          <span>{editError}</span>
          <button className="btn-icona" title="Nascondi" aria-label="Nascondi il messaggio" onClick={clearEditError}>
            <IconaChiudi size={16} />
          </button>
        </div>
      )}

      <div className={'lavoro-corpo' + (affianca && !inProva ? ' con-testo' : '')}>
        <div className="lavoro-pannello">
          <Riparo livello="pannello" chiave={tab}>
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
                {tab === 'personaggi' && <CharactersEditor />}
                {tab === 'stanze' && <RoomEditor />}
                {tab === 'regole' && <RulesEditor />}
                {tab === 'stati' && <VariablesEditor />}
                {tab === 'dialoghi' && <DialoguesEditor />}
                {tab === 'parole' && <WordsEditor />}
              </>
            )}
          </Riparo>
        </div>
        {affianca && !inProva && (
          <div className="lavoro-testo" aria-label="Il testo della storia">
            <Riparo livello="pannello" chiave="testo-accanto">
              <EditorPane />
            </Riparo>
          </div>
        )}
      </div>
    </section>
  )
}
