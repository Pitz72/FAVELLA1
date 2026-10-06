import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type { OutlineRoom } from '../../../shared/protocol'
import { nucleo } from '../utils/posizione'
import { DirezioneSelect } from './UsciteStanza'
import UsciteStanza from './UsciteStanza'
import { EliminaElemento, RinominaElemento, idDiNome } from './ElementoAzioni'
import Elenco, { NonPronto, Riquadro, Vuoto } from './Elenco'
import { IconaMatita, IconaPartenza, IconaStanza } from './Icone'

// Editor delle STANZE: elenco + scheda. Qui si fa tutto quello che si fa su una stanza: la
// si crea (anche già collegata a un'altra), la si rinomina, se ne cambia la descrizione, le
// uscite e il fatto di essere il punto di partenza, e la si elimina. Ogni gesto riscrive la
// frase giusta del testo, in qualunque file della storia stia.
export default function RoomEditor(): JSX.Element {
  const outline = useStudio((s) => s.outline)
  const loading = useStudio((s) => s.outlineLoading)
  const loadOutline = useStudio((s) => s.loadOutline)
  const applyStatement = useStudio((s) => s.applyStatement)
  const addRoom = useStudio((s) => s.mapAddRoom)
  const addConnection = useStudio((s) => s.mapAddConnection)
  const requestReveal = useStudio((s) => s.requestReveal)
  const nomeOccupato = useStudio((s) => s.nomeOccupato)
  const selezione = useStudio((s) => s.selezione)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))

  const [selId, setSelId] = useState<string | null>(null)
  const [descBozza, setDescBozza] = useState('')
  // Creazione: il nome (con l'articolo) e, se si vuole, il collegamento a un'altra stanza.
  const [creando, setCreando] = useState(false)
  const [nuovoNome, setNuovoNome] = useState('')
  const [collegaA, setCollegaA] = useState('')
  const [direzione, setDirezione] = useState('')
  const [opposta, setOpposta] = useState<string | undefined>(undefined)

  const sel = outline?.rooms.find((r) => r.id === selId) ?? null

  // Allinea la bozza di descrizione alla stanza selezionata.
  useEffect(() => {
    setDescBozza(sel?.description ?? '')
  }, [selId, sel?.description])

  // Dalla Mappa («Apri la scheda della stanza»): si apre già sulla stanza giusta.
  useEffect(() => {
    if (selezione?.tipo === 'stanza') setSelId(selezione.id)
  }, [selezione])

  if (!isFav) return <NonPronto cosa="le stanze" stato="nessun-file" />
  if (!outline) return <NonPronto cosa="le stanze" stato={loading ? 'carico' : 'vuoto'} onRiprova={() => void loadOutline()} />
  if (!outline.ok) return <NonPronto cosa="le stanze" stato="errori" onRiprova={() => void loadOutline()} />

  const rooms = outline.rooms
  const erroreNome = nuovoNome.trim() ? nomeOccupato(nuovoNome) : null

  const salvaDescrizione = async (): Promise<void> => {
    if (!sel) return
    await applyStatement({ op: 'description', name: sel.name, text: descBozza }, sel.descSpan)
  }

  // La partenza: «Il giocatore comincia in <nucleo>.» (sostituisce quella di prima).
  const impostaIniziale = async (r: OutlineRoom): Promise<void> => {
    await applyStatement({ op: 'start', name: nucleo(r.name) }, outline.startSpan ?? undefined)
  }

  const chiudiCreazione = (): void => {
    setCreando(false)
    setNuovoNome('')
    setCollegaA('')
    setDirezione('')
    setOpposta(undefined)
  }

  // Crea «<Nome> è una stanza.» e, se richiesto, la collega a un'altra stanza.
  const creaStanza = async (): Promise<void> => {
    const nome = nuovoNome.trim()
    if (!nome || erroreNome) return
    const da = collegaA
    const dir = direzione
    const opp = opposta
    chiudiCreazione()
    await addRoom(nome)
    const nuovoId = idDiNome(nome)
    if (da && dir) await addConnection(da, dir, nuovoId, opp)
    setSelId(nuovoId)
  }

  return (
    <div className="editor-schede">
      <Elenco
        titolo="Stanze"
        voci={rooms.map((r) => ({
          id: r.id,
          nome: r.name,
          icona: r.isStart ? <IconaPartenza /> : <IconaStanza />,
          nota: r.isStart ? 'partenza' : undefined,
          titolo: r.isStart ? 'Il giocatore comincia qui' : undefined
        }))}
        selezionato={selId}
        onScegli={setSelId}
        nuovo={{ etichetta: 'Nuova stanza', onClick: () => (creando ? chiudiCreazione() : setCreando(true)), aperto: creando }}
        vuoto="Nessuna stanza. Creane una con «Nuova stanza», o dalla Mappa."
      />

      <div className="dettaglio">
        {creando && (
          <Riquadro titolo="Nuova stanza">
            <div className="riga-campi">
              <label className="campo campo-largo">
                <span className="campo-etichetta">Nome, con l’articolo</span>
                <input
                  type="text"
                  autoFocus
                  placeholder="La cantina"
                  value={nuovoNome}
                  aria-invalid={!!erroreNome}
                  onChange={(e) => setNuovoNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void creaStanza()
                    if (e.key === 'Escape') chiudiCreazione()
                  }}
                />
              </label>
            </div>
            {erroreNome && <p className="errore-campo">{erroreNome}</p>}
            {rooms.length > 0 && (
              <div className="riga-campi">
                <label className="campo">
                  <span className="campo-etichetta">Collegala a</span>
                  <select value={collegaA} onChange={(e) => setCollegaA(e.target.value)}>
                    <option value="">nessuna, per ora</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                {collegaA && (
                  <label className="campo">
                    <span className="campo-etichetta">Da lì, verso</span>
                    <DirezioneSelect
                      valore={direzione}
                      direzioni={outline.directions}
                      usate={rooms.find((r) => r.id === collegaA)?.exits.map((e) => e.direction) ?? []}
                      vuota="scegli la direzione"
                      onScegli={(d, o) => {
                        setDirezione(d)
                        setOpposta(o)
                      }}
                    />
                  </label>
                )}
              </div>
            )}
            <div className="riga-azioni">
              <button className="btn btn-quieto" onClick={chiudiCreazione}>
                Annulla
              </button>
              <button className="btn btn-primario" disabled={!nuovoNome.trim() || !!erroreNome} onClick={() => void creaStanza()}>
                Crea la stanza
              </button>
            </div>
          </Riquadro>
        )}

        {!sel && !creando && (
          <Vuoto titolo="Scegli una stanza">
            Dall’elenco a sinistra. Qui ne cambi il nome, la descrizione, le uscite e il punto di partenza.
          </Vuoto>
        )}

        {sel && (
          <div className="scheda" aria-label={`La stanza ${sel.name}`}>
            <div className="scheda-testa">
              <span className="scheda-icona" aria-hidden="true">
                {sel.isStart ? <IconaPartenza size={22} /> : <IconaStanza size={22} />}
              </span>
              <h2 className="scheda-nome">{sel.name}</h2>
              {sel.isStart && <span className="distintivo distintivo-accento">partenza</span>}
            </div>

            <Riquadro titolo="Nome">
              <RinominaElemento nome={sel.name} onRinominato={(n) => setSelId(idDiNome(n))} />
            </Riquadro>

            <Riquadro
              titolo="Punto di partenza"
              aiuto={sel.isStart ? 'Il giocatore comincia qui. Per spostare la partenza, scegli un’altra stanza e spunta la casella.' : undefined}
            >
              <label className="spunta">
                <input type="checkbox" checked={sel.isStart} disabled={sel.isStart} onChange={() => void impostaIniziale(sel)} />
                <span>Il giocatore comincia in questa stanza</span>
              </label>
            </Riquadro>

            <Riquadro titolo="Descrizione" aiuto={sel.descConditional ? undefined : 'Quello che il giocatore legge quando entra.'}>
              {sel.descConditional ? (
                <div className="nota-riquadro">
                  <p>Questa stanza ha una descrizione che cambia (con «se…»): si modifica nel testo.</p>
                  {sel.descSpan && (
                    <button className="btn btn-quieto btn-piccolo" onClick={() => requestReveal(sel.descSpan!.file, sel.descSpan!.line, 1)}>
                      <IconaMatita />
                      Vai al testo
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <label className="visivamente-nascosto" htmlFor="descrizione-stanza">
                    Descrizione di {sel.name}
                  </label>
                  <textarea
                    id="descrizione-stanza"
                    className="campo-prosa"
                    rows={5}
                    placeholder="Cosa vede il giocatore entrando qui…"
                    value={descBozza}
                    onChange={(e) => setDescBozza(e.target.value)}
                  />
                  <div className="riga-azioni">
                    {descBozza !== sel.description && (
                      <button className="btn btn-quieto" onClick={() => setDescBozza(sel.description ?? '')}>
                        Lascia com’era
                      </button>
                    )}
                    <button className="btn btn-primario" disabled={descBozza === sel.description} onClick={() => void salvaDescrizione()}>
                      Scrivi la descrizione
                    </button>
                  </div>
                </>
              )}
            </Riquadro>

            <Riquadro titolo="Uscite">
              <UsciteStanza stanzaId={sel.id} />
            </Riquadro>

            <EliminaElemento nome={sel.name} tipo="stanza" onEliminato={() => setSelId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
