import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import { specPosizione } from '../utils/posizione'
import { EliminaElemento, RinominaElemento, idDiNome } from './ElementoAzioni'
import Elenco, { NonPronto, Riquadro, Vuoto } from './Elenco'
import { IconaChiudi, IconaFumetto, IconaPersona } from './Icone'

// Editor dei PERSONAGGI: chi abita la storia. Si crea un personaggio da zero (dove sta e,
// se si vuole, com'è fatto), lo si sposta, lo si rinomina, gli si cambia la descrizione e i
// nomi con cui il giocatore può chiamarlo, e si arriva al suo dialogo.
export default function CharactersEditor(): JSX.Element {
  const outline = useStudio((s) => s.outline)
  const loading = useStudio((s) => s.outlineLoading)
  const loadOutline = useStudio((s) => s.loadOutline)
  const dialogues = useStudio((s) => s.dialogues)
  const applyStatement = useStudio((s) => s.applyStatement)
  const appendStatements = useStudio((s) => s.appendStatements)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const spostaInCoda = useStudio((s) => s.spostaInCoda)
  const nomeOccupato = useStudio((s) => s.nomeOccupato)
  const setRightTab = useStudio((s) => s.setRightTab)
  const selezione = useStudio((s) => s.selezione)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))

  const [selId, setSelId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [nuovoNome, setNuovoNome] = useState('')
  const [nuovaStanza, setNuovaStanza] = useState('')
  const [nuovaDesc, setNuovaDesc] = useState('')
  const [descBozza, setDescBozza] = useState('')
  const [aliasNew, setAliasNew] = useState('')

  const personaggi = outline?.objects.filter((o) => o.kind === 'personaggio') ?? []
  const sel = personaggi.find((o) => o.id === selId) ?? null

  useEffect(() => {
    setDescBozza(sel?.description ?? '')
    setAliasNew('')
  }, [selId, sel?.description])

  useEffect(() => {
    if (selezione?.tipo === 'personaggio') setSelId(selezione.id)
  }, [selezione])

  if (!isFav) return <NonPronto cosa="i personaggi" stato="nessun-file" />
  if (!outline) return <NonPronto cosa="i personaggi" stato={loading ? 'carico' : 'vuoto'} onRiprova={() => void loadOutline()} />
  if (!outline.ok) return <NonPronto cosa="i personaggi" stato="errori" onRiprova={() => void loadOutline()} />

  const rooms = outline.rooms
  const stanzaIniziale = rooms.find((r) => r.isStart)?.id ?? rooms[0]?.id ?? ''
  const npc = sel ? (dialogues?.npcs.find((n) => n.id === sel.id) ?? null) : null
  const nodiSuoi = sel ? (dialogues?.nodes ?? []).filter((n) => n.speaker?.id === sel.id) : []
  const erroreNome = nuovoNome.trim() ? nomeOccupato(nuovoNome) : null

  const apriCreazione = (): void => {
    setCreando((v) => !v)
    setNuovoNome('')
    setNuovaDesc('')
    setNuovaStanza(stanzaIniziale)
  }

  // «X è un personaggio.», dove sta e — se scritta — la sua descrizione, in un colpo solo.
  const crea = async (): Promise<void> => {
    const nome = nuovoNome.trim()
    if (!nome || erroreNome) return
    const stanza = rooms.find((r) => r.id === nuovaStanza)
    const desc = nuovaDesc.trim()
    setCreando(false)
    setNuovoNome('')
    setNuovaDesc('')
    await appendStatements([
      { op: 'object_def', name: nome, kind: 'personaggio' },
      ...(stanza ? [specPosizione(nome, { name: stanza.name, kind: 'stanza' as const })] : []),
      ...(desc ? [{ op: 'description' as const, name: nome, text: desc }] : [])
    ])
    setSelId(idDiNome(nome))
  }

  // Sposta il personaggio: se la stanza è definita prima della sua frase di posizione la si
  // sostituisce sul posto, altrimenti la vecchia si toglie e la nuova va in coda (un passo).
  const cambiaStanza = async (stanzaId: string): Promise<void> => {
    if (!sel) return
    const vecchia = sel.location?.span ?? null
    if (stanzaId === '') {
      if (vecchia) await deleteStatement(vecchia)
      return
    }
    const stanza = rooms.find((r) => r.id === stanzaId)
    if (!stanza) return
    const spec = specPosizione(sel.name, { name: stanza.name, kind: 'stanza' })
    const sulPosto = !!vecchia && !!stanza.defSpan && stanza.defSpan.file === vecchia.file && stanza.defSpan.line < vecchia.line
    if (sulPosto) await applyStatement(spec, vecchia)
    else await spostaInCoda(vecchia, spec)
  }

  const salvaDescrizione = async (): Promise<void> => {
    if (!sel) return
    await applyStatement({ op: 'description', name: sel.name, text: descBozza }, sel.descSpan)
  }

  const aggiungiAlias = async (): Promise<void> => {
    if (!sel) return
    const a = aliasNew.trim()
    if (!a) return
    setAliasNew('')
    await applyStatement({ op: 'alias', name: sel.name, alias: a })
  }

  const inStanza = sel?.location && rooms.some((r) => r.id === sel.location!.id)

  return (
    <div className="editor-schede">
      <Elenco
        titolo="Personaggi"
        voci={personaggi.map((o) => ({
          id: o.id,
          nome: o.name,
          icona: <IconaPersona />,
          nota: o.location ? undefined : 'senza posto',
          titolo: o.location ? `Sta ${o.location.prep ?? 'in'} ${o.location.name}` : 'Non sta da nessuna parte'
        }))}
        selezionato={selId}
        onScegli={setSelId}
        nuovo={{ etichetta: 'Nuovo personaggio', onClick: apriCreazione, aperto: creando }}
        vuoto="Nessun personaggio. Creane uno con «Nuovo personaggio»."
      />

      <div className="dettaglio">
        {creando && (
          <Riquadro titolo="Nuovo personaggio">
            <div className="riga-campi">
              <label className="campo campo-largo">
                <span className="campo-etichetta">Nome, con l’articolo</span>
                <input
                  type="text"
                  autoFocus
                  placeholder="Il mercante"
                  value={nuovoNome}
                  aria-invalid={!!erroreNome}
                  onChange={(e) => setNuovoNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void crea()
                    if (e.key === 'Escape') setCreando(false)
                  }}
                />
              </label>
              <label className="campo">
                <span className="campo-etichetta">Dove sta</span>
                <select value={nuovaStanza} onChange={(e) => setNuovaStanza(e.target.value)}>
                  <option value="">da nessuna parte</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {erroreNome && <p className="errore-campo">{erroreNome}</p>}
            <label className="campo">
              <span className="campo-etichetta">Com’è fatto, in una frase (se vuoi)</span>
              <input type="text" placeholder="Un uomo magro, col cappello in mano." value={nuovaDesc} onChange={(e) => setNuovaDesc(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void crea()} />
            </label>
            <div className="riga-azioni">
              <button className="btn btn-quieto" onClick={() => setCreando(false)}>
                Annulla
              </button>
              <button className="btn btn-primario" disabled={!nuovoNome.trim() || !!erroreNome} onClick={() => void crea()}>
                Crea il personaggio
              </button>
            </div>
          </Riquadro>
        )}

        {!sel && !creando && (
          <Vuoto titolo="Scegli un personaggio">
            Dall’elenco a sinistra. Qui decidi dove sta, com’è fatto e come lo si chiama; le sue battute stanno in «Dialoghi».
          </Vuoto>
        )}

        {sel && (
          <div className="scheda" aria-label={`Il personaggio ${sel.name}`}>
            <div className="scheda-testa">
              <span className="scheda-icona" aria-hidden="true">
                <IconaPersona size={22} />
              </span>
              <h2 className="scheda-nome">{sel.name}</h2>
              {nodiSuoi.length > 0 && <span className="distintivo">parla</span>}
            </div>

            <Riquadro titolo="Nome">
              <RinominaElemento nome={sel.name} onRinominato={(n) => setSelId(idDiNome(n))} />
            </Riquadro>

            <Riquadro titolo="Dove si trova">
              <label className="campo">
                <span className="visivamente-nascosto">La stanza di {sel.name}</span>
                <select value={inStanza ? sel.location!.id : ''} onChange={(e) => void cambiaStanza(e.target.value)}>
                  <option value="">da nessuna parte</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              {sel.location && !inStanza && <p className="aiuto">Ora sta in «{sel.location.name}»: lo sposti dal pannello Oggetti.</p>}
            </Riquadro>

            <Riquadro titolo="Descrizione" aiuto={sel.descConditional ? undefined : 'Quello che il giocatore legge quando lo guarda.'}>
              {sel.descConditional ? (
                <p className="nota-riquadro">Questa descrizione cambia (con «se…»): si modifica nel testo.</p>
              ) : (
                <>
                  <label className="visivamente-nascosto" htmlFor="descrizione-personaggio">
                    Descrizione di {sel.name}
                  </label>
                  <textarea
                    id="descrizione-personaggio"
                    className="campo-prosa"
                    rows={4}
                    placeholder="Che cosa vede il giocatore guardandolo…"
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

            <Riquadro titolo="Dialogo">
              <p className="nota-riquadro">
                {nodiSuoi.length === 0
                  ? 'Non parla ancora: le sue battute si scrivono nel pannello Dialoghi.'
                  : `Dice ${nodiSuoi.length === 1 ? 'una battuta' : `${nodiSuoi.length} battute`}${npc?.startNode ? `; il dialogo comincia da «${npc.startNode}»` : ''}.`}
              </p>
              <button className="btn btn-quieto btn-piccolo" onClick={() => setRightTab('dialoghi')}>
                <IconaFumetto />
                {nodiSuoi.length === 0 ? 'Scrivi il suo dialogo' : 'Apri i dialoghi'}
              </button>
            </Riquadro>

            <Riquadro titolo="Altri nomi" aiuto="Le parole con cui il giocatore può chiamarlo: «oste» per «il mercante».">
              <ul className="gettoni">
                {sel.aliases.length === 0 && <li className="gettoni-vuoto">nessuno</li>}
                {sel.aliases.map((a) => (
                  <li key={a.name} className="gettone">
                    {a.name}
                    {a.span && (
                      <button aria-label={`Togli il nome ${a.name}`} title="Togli" onClick={() => void deleteStatement(a.span!, `Nome «${a.name}» tolto`)}>
                        <IconaChiudi size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <div className="riga-campi">
                <label className="campo campo-largo">
                  <span className="visivamente-nascosto">Nuovo nome</span>
                  <input type="text" placeholder="un altro nome, es. oste" value={aliasNew} onChange={(e) => setAliasNew(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void aggiungiAlias()} />
                </label>
                <button className="btn btn-quieto campo-pulsante" disabled={!aliasNew.trim()} onClick={() => void aggiungiAlias()}>
                  Aggiungi
                </button>
              </div>
            </Riquadro>

            <EliminaElemento nome={sel.name} tipo="personaggio" onEliminato={() => setSelId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
