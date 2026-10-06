import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type { ObjectKind, OutlineObject, OutlineLocation, OutlineSpan } from '../../../shared/protocol'
import { specPosizione } from '../utils/posizione'
import { EliminaElemento, RinominaElemento, idDiNome } from './ElementoAzioni'
import Elenco, { NonPronto, Riquadro, Vuoto } from './Elenco'
import { IconaChiudi, IconaContenitore, IconaOggetto, IconaSupporto } from './Icone'

const KIND_LABEL: Record<ObjectKind, string> = {
  oggetto: 'Oggetto',
  contenitore: 'Contenitore',
  supporto: 'Supporto',
  personaggio: 'Personaggio'
}
const KIND_AIUTO: Record<ObjectKind, string> = {
  oggetto: 'una cosa da guardare, prendere, usare',
  contenitore: 'ci si mette dentro qualcosa (una scatola, un cassetto)',
  supporto: 'ci si mette sopra qualcosa (un tavolo, una mensola)',
  personaggio: ''
}
function IconaTipo({ kind, size }: { kind: ObjectKind; size?: number }): JSX.Element {
  if (kind === 'contenitore') return <IconaContenitore size={size} />
  if (kind === 'supporto') return <IconaSupporto size={size} />
  return <IconaOggetto size={size} />
}
// I personaggi hanno il loro pannello (Personaggi): qui si lavora sulle cose.
const KINDS: ObjectKind[] = ['oggetto', 'contenitore', 'supporto']

export default function ObjectsEditor(): JSX.Element {
  const outline = useStudio((s) => s.outline)
  const loading = useStudio((s) => s.outlineLoading)
  const loadOutline = useStudio((s) => s.loadOutline)
  const applyStatement = useStudio((s) => s.applyStatement)
  const appendStatements = useStudio((s) => s.appendStatements)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const spostaInCoda = useStudio((s) => s.spostaInCoda)
  const nomeOccupato = useStudio((s) => s.nomeOccupato)
  const selezione = useStudio((s) => s.selezione)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))

  const [selId, setSelId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [nuovoNome, setNuovoNome] = useState('')
  const [nuovoKind, setNuovoKind] = useState<ObjectKind>('oggetto')
  const [nuovaStanza, setNuovaStanza] = useState('')
  const [descBozza, setDescBozza] = useState('')
  const [propNew, setPropNew] = useState('')
  const [aliasNew, setAliasNew] = useState('')
  const [oppA, setOppA] = useState('')
  const [oppB, setOppB] = useState('')
  const [dichiarando, setDichiarando] = useState(false)

  const sel = outline?.objects.find((o) => o.id === selId) ?? null

  // Allinea la bozza di descrizione all'oggetto selezionato.
  useEffect(() => {
    setDescBozza(sel?.description ?? '')
    setPropNew('')
    setAliasNew('')
  }, [selId, sel?.description])

  useEffect(() => {
    if (selezione?.tipo === 'oggetto') setSelId(selezione.id)
  }, [selezione])

  if (!isFav) return <NonPronto cosa="gli oggetti" stato="nessun-file" />
  if (!outline) return <NonPronto cosa="gli oggetti" stato={loading ? 'carico' : 'vuoto'} onRiprova={() => void loadOutline()} />
  if (!outline.ok) return <NonPronto cosa="gli oggetti" stato="errori" onRiprova={() => void loadOutline()} />

  const objects = outline.objects.filter((o) => o.kind !== 'personaggio')
  const rooms = outline.rooms
  const stanzaIniziale = rooms.find((r) => r.isStart)?.id ?? rooms[0]?.id ?? ''
  const erroreNome = nuovoNome.trim() ? nomeOccupato(nuovoNome) : null

  const apriCreazione = (): void => {
    setCreando((v) => !v)
    setNuovaStanza(stanzaIniziale)
  }

  // Crea «<Nome> è una cosa.» e, se scelto, lo mette in una stanza (altrimenti non è da
  // nessuna parte: nessun giocatore lo troverà finché non gli si dà un posto).
  const crea = async (): Promise<void> => {
    const nome = nuovoNome.trim()
    if (!nome || erroreNome) return
    const stanza = rooms.find((r) => r.id === nuovaStanza)
    const kind = nuovoKind
    setCreando(false)
    setNuovoNome('')
    setNuovoKind('oggetto')
    await appendStatements([
      { op: 'object_def', name: nome, kind },
      ...(stanza ? [specPosizione(nome, { name: stanza.name, kind: 'stanza' as const })] : [])
    ])
    setSelId(idDiNome(nome))
  }

  // Coppie di proprietà opposte note nel mondo (aperta/chiusa di default + quelle
  // dichiarate). I loro membri non compaiono tra le proprietà libere: si scelgono qui.
  const opposites = outline.opposites ?? []
  const membriOpposti = new Set<string>()
  opposites.forEach((p) => {
    membriOpposti.add(p.a)
    membriOpposti.add(p.b)
  })
  const proprietaVisibili = sel ? sel.properties.filter((p) => p.name !== 'prendibile' && !membriOpposti.has(p.name)) : []
  const prendibileProp = sel?.properties.find((p) => p.name === 'prendibile') ?? null

  const contenitori = objects.filter((o) => o.kind === 'contenitore' && o.id !== selId)
  const supporti = objects.filter((o) => o.kind === 'supporto' && o.id !== selId)
  const contenuto = sel ? objects.filter((o) => o.location?.id === sel.id) : []
  const candidatiContenuto = sel ? objects.filter((o) => o.id !== sel.id && o.location?.id !== sel.id) : []
  const èContenitore = sel?.kind === 'contenitore' || sel?.kind === 'supporto'

  const cambiaTipo = async (k: ObjectKind): Promise<void> => {
    if (!sel || k === sel.kind) return
    await applyStatement({ op: 'object_def', name: sel.name, kind: k }, sel.defSpan)
  }
  const salvaDescrizione = async (): Promise<void> => {
    if (!sel) return
    await applyStatement({ op: 'description', name: sel.name, text: descBozza }, sel.descSpan)
  }
  const togglePrendibile = async (): Promise<void> => {
    if (!sel) return
    if (sel.prendibile) {
      if (prendibileProp?.span) await deleteStatement(prendibileProp.span)
    } else {
      await applyStatement({ op: 'prendibile', name: sel.name })
    }
  }
  // Capacità di trasporto BASE del giocatore. 0/vuoto → illimitata (toglie la frase).
  const setCarryBase = async (val: number | null): Promise<void> => {
    if (val === null || val <= 0) {
      if (outline.carryBaseSpan) await deleteStatement(outline.carryBaseSpan)
      return
    }
    await applyStatement({ op: 'carry_base', value: val }, outline.carryBaseSpan ?? undefined)
  }
  // Bonus di capacità dell'oggetto selezionato («dà N spazi»). 0 → toglie.
  const setCarryBonus = async (val: number): Promise<void> => {
    if (!sel) return
    if (val <= 0) {
      if (sel.carryBonusSpan) await deleteStatement(sel.carryBonusSpan)
      return
    }
    await applyStatement({ op: 'carry_bonus', name: sel.name, value: val }, sel.carryBonusSpan ?? undefined)
  }
  // Colloca un oggetto. Il compilatore legge le posizioni NELL'ORDINE del testo: una frase
  // «X è in Y» prima della definizione di Y non vale. Quindi, se la destinazione è definita
  // dopo, la vecchia frase si toglie e la nuova va in coda — in un passo solo (prima della
  // 1.2 erano due modifiche separate, e se la seconda falliva l'oggetto restava senza posto).
  const colloca = async (
    oldLoc: OutlineLocation | null,
    spec: { op: 'position'; name: string; prep: string; place: string },
    inCoda: boolean
  ): Promise<void> => {
    if (inCoda) await spostaInCoda(oldLoc?.span ?? null, spec)
    else await applyStatement(spec, oldLoc?.span ?? undefined)
  }
  const definitaPrima = (destDefSpan: OutlineSpan | null, oldSpan: OutlineSpan | null): boolean =>
    !!destDefSpan && !!oldSpan && destDefSpan.file === oldSpan.file && destDefSpan.line < oldSpan.line

  const cambiaPosizione = async (targetId: string): Promise<void> => {
    if (!sel) return
    if (targetId === '') {
      if (sel.location?.span) await deleteStatement(sel.location.span)
      return
    }
    const room = rooms.find((r) => r.id === targetId)
    if (room) {
      const inCoda = !definitaPrima(room.defSpan, sel.location?.span ?? null)
      await colloca(sel.location, specPosizione(sel.name, { name: room.name, kind: 'stanza' }), inCoda)
      return
    }
    const cont = objects.find((o) => o.id === targetId)
    if (!cont) return
    await colloca(sel.location, specPosizione(sel.name, { name: cont.name, kind: cont.kind }), true)
  }

  const mettiContenuto = async (childId: string): Promise<void> => {
    if (!sel || !childId) return
    const child = objects.find((o) => o.id === childId)
    if (!child) return
    await colloca(child.location, specPosizione(child.name, { name: sel.name, kind: sel.kind }), true)
  }
  const togliContenuto = async (child: OutlineObject): Promise<void> => {
    if (child.location?.span) await deleteStatement(child.location.span)
  }
  const aggiungiProprieta = async (): Promise<void> => {
    if (!sel) return
    const p = propNew.trim()
    if (!p) return
    setPropNew('')
    await applyStatement({ op: 'property', name: sel.name, property: p })
  }
  const aggiungiAlias = async (): Promise<void> => {
    if (!sel) return
    const a = aliasNew.trim()
    if (!a) return
    setAliasNew('')
    await applyStatement({ op: 'alias', name: sel.name, alias: a })
  }

  // Il lato attivo di una coppia opposta (o nessuno). Le opposte si escludono: se l'altro
  // lato era attivo, se ne SOSTITUISCE la frase.
  const impostaStato = async (pair: { a: string; b: string }, lato: string | null): Promise<void> => {
    if (!sel) return
    const propA = sel.properties.find((p) => p.name === pair.a) ?? null
    const propB = sel.properties.find((p) => p.name === pair.b) ?? null
    const attiva = propA ?? propB
    if (lato === null) {
      if (attiva?.span) await deleteStatement(attiva.span)
      return
    }
    if (sel.properties.some((p) => p.name === lato)) return
    const altro = lato === pair.a ? propB : propA
    await applyStatement({ op: 'property', name: sel.name, property: lato }, altro?.span ?? undefined)
  }

  // Una nuova coppia di proprietà opposte (vale per TUTTI gli oggetti): «X e Y sono opposte.»
  const dichiaraCoppia = async (): Promise<void> => {
    const a = oppA.trim().toLowerCase()
    const b = oppB.trim().toLowerCase()
    if (!a || !b || a === b) return
    if (opposites.some((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a))) return
    setOppA('')
    setOppB('')
    setDichiarando(false)
    await applyStatement({ op: 'opposite_decl', a, b })
  }

  const posizioneDi = (o: OutlineObject): string | undefined =>
    o.location ? `${o.location.prep ?? 'in'} ${o.location.name}` : 'da nessuna parte'

  return (
    <div className="editor-schede">
      <div className="colonna-elenco">
        <Elenco
          titolo="Oggetti"
          voci={objects.map((o) => ({
            id: o.id,
            nome: o.name,
            icona: <IconaTipo kind={o.kind} />,
            nota: o.location ? undefined : 'senza posto',
            titolo: `${KIND_LABEL[o.kind]} — ${posizioneDi(o)}`
          }))}
          selezionato={selId}
          onScegli={setSelId}
          nuovo={{ etichetta: 'Nuovo oggetto', onClick: apriCreazione, aperto: creando }}
          vuoto="Nessun oggetto. Creane uno con «Nuovo oggetto»."
        />
        <CarryBaseField value={outline.carryBase} onSet={setCarryBase} />
      </div>

      <div className="dettaglio">
        {creando && (
          <Riquadro titolo="Nuovo oggetto">
            <div className="riga-campi">
              <label className="campo campo-largo">
                <span className="campo-etichetta">Nome, con l’articolo</span>
                <input
                  type="text"
                  autoFocus
                  placeholder="La torcia"
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
                <span className="campo-etichetta">Che cos’è</span>
                <select value={nuovoKind} onChange={(e) => setNuovoKind(e.target.value as ObjectKind)}>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
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
            <div className="riga-azioni">
              <button className="btn btn-quieto" onClick={() => setCreando(false)}>
                Annulla
              </button>
              <button className="btn btn-primario" disabled={!nuovoNome.trim() || !!erroreNome} onClick={() => void crea()}>
                Crea l’oggetto
              </button>
            </div>
          </Riquadro>
        )}

        {!sel && !creando && (
          <Vuoto titolo="Scegli un oggetto">
            Dall’elenco a sinistra. Qui decidi che cos’è, dove sta, com’è fatto e se il giocatore lo può prendere.
          </Vuoto>
        )}

        {sel && (
          <div className="scheda" aria-label={`L’oggetto ${sel.name}`}>
            <div className="scheda-testa">
              <span className="scheda-icona" aria-hidden="true">
                <IconaTipo kind={sel.kind} size={22} />
              </span>
              <h2 className="scheda-nome">{sel.name}</h2>
              <span className="distintivo">{KIND_LABEL[sel.kind].toLowerCase()}</span>
              {sel.prendibile && <span className="distintivo">si prende</span>}
            </div>

            <Riquadro titolo="Nome">
              <RinominaElemento nome={sel.name} onRinominato={(n) => setSelId(idDiNome(n))} />
            </Riquadro>

            <Riquadro titolo="Che cos’è e dove sta">
              <div className="riga-campi">
                <label className="campo">
                  <span className="campo-etichetta">Tipo</span>
                  <select value={sel.kind} onChange={(e) => void cambiaTipo(e.target.value as ObjectKind)}>
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo campo-largo">
                  <span className="campo-etichetta">Posizione</span>
                  <select value={sel.location?.id ?? ''} onChange={(e) => void cambiaPosizione(e.target.value)}>
                    <option value="">da nessuna parte</option>
                    <optgroup label="In una stanza">
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </optgroup>
                    {contenitori.length > 0 && (
                      <optgroup label="Dentro un contenitore">
                        {contenitori.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {supporti.length > 0 && (
                      <optgroup label="Sopra un supporto">
                        {supporti.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </label>
              </div>
              <p className="aiuto">{KIND_AIUTO[sel.kind]}{!sel.location && ' · Senza un posto, il giocatore non lo troverà mai.'}</p>
              <label className="spunta">
                <input type="checkbox" checked={sel.prendibile} onChange={() => void togglePrendibile()} />
                <span>Il giocatore lo può prendere</span>
              </label>
              <CarryBonusField key={sel.id} value={sel.carryBonus} onSet={setCarryBonus} />
            </Riquadro>

            {èContenitore && (
              <Riquadro titolo={sel.kind === 'supporto' ? 'Che cosa c’è sopra' : 'Che cosa c’è dentro'}>
                <ul className="gettoni">
                  {contenuto.length === 0 && <li className="gettoni-vuoto">niente</li>}
                  {contenuto.map((c) => (
                    <li key={c.id} className="gettone">
                      {c.name}
                      {c.location?.span && (
                        <button aria-label={`Togli ${c.name} da qui`} title="Togli da qui" onClick={() => void togliContenuto(c)}>
                          <IconaChiudi size={13} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {candidatiContenuto.length > 0 && (
                  <label className="campo">
                    <span className="campo-etichetta">{sel.kind === 'supporto' ? 'Metti sopra' : 'Metti dentro'}</span>
                    <select value="" onChange={(e) => void mettiContenuto(e.target.value)}>
                      <option value="">scegli un oggetto…</option>
                      {candidatiContenuto.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </Riquadro>
            )}

            <Riquadro titolo="Descrizione" aiuto={sel.descConditional ? undefined : 'Quello che il giocatore legge quando lo esamina.'}>
              {sel.descConditional ? (
                <p className="nota-riquadro">Questa descrizione cambia (con «se…»): si modifica nel testo.</p>
              ) : (
                <>
                  <label className="visivamente-nascosto" htmlFor="descrizione-oggetto">
                    Descrizione di {sel.name}
                  </label>
                  <textarea
                    id="descrizione-oggetto"
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

            <Riquadro titolo="Stati a due valori" aiuto="Aperta o chiusa, accesa o spenta: una coppia vale per tutti gli oggetti.">
              {opposites.length === 0 && <p className="nota-riquadro">Nessuna coppia ancora.</p>}
              {opposites.map((pair) => {
                const attivoA = sel.properties.some((p) => p.name === pair.a)
                const attivoB = sel.properties.some((p) => p.name === pair.b)
                return (
                  <div key={pair.a + '|' + pair.b} className="scelta-segmenti" role="radiogroup" aria-label={`${pair.a} o ${pair.b}`}>
                    <button role="radio" aria-checked={attivoA} className={attivoA ? 'attivo' : ''} onClick={() => void impostaStato(pair, pair.a)}>
                      {pair.a}
                    </button>
                    <button role="radio" aria-checked={attivoB} className={attivoB ? 'attivo' : ''} onClick={() => void impostaStato(pair, pair.b)}>
                      {pair.b}
                    </button>
                    <button
                      role="radio"
                      aria-checked={!attivoA && !attivoB}
                      className={!attivoA && !attivoB ? 'attivo' : ''}
                      onClick={() => void impostaStato(pair, null)}
                    >
                      nessuno dei due
                    </button>
                  </div>
                )
              })}
              {dichiarando ? (
                <div className="riga-campi">
                  <label className="campo">
                    <span className="campo-etichetta">Un valore</span>
                    <input type="text" autoFocus placeholder="accesa" value={oppA} onChange={(e) => setOppA(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void dichiaraCoppia()} />
                  </label>
                  <label className="campo">
                    <span className="campo-etichetta">Il suo opposto</span>
                    <input type="text" placeholder="spenta" value={oppB} onChange={(e) => setOppB(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void dichiaraCoppia()} />
                  </label>
                  <button
                    className="btn btn-primario campo-pulsante"
                    disabled={!oppA.trim() || !oppB.trim() || oppA.trim() === oppB.trim()}
                    onClick={() => void dichiaraCoppia()}
                  >
                    Aggiungi la coppia
                  </button>
                  <button className="btn btn-quieto campo-pulsante" onClick={() => setDichiarando(false)}>
                    Annulla
                  </button>
                </div>
              ) : (
                <button className="btn btn-quieto btn-piccolo" onClick={() => setDichiarando(true)}>
                  Nuova coppia di opposti…
                </button>
              )}
            </Riquadro>

            <Riquadro titolo="Altre proprietà" aiuto="Parole libere che le regole possono controllare: «rotta», «bagnata»…">
              <ul className="gettoni">
                {proprietaVisibili.length === 0 && <li className="gettoni-vuoto">nessuna</li>}
                {proprietaVisibili.map((p) => (
                  <li key={p.name} className="gettone">
                    {p.name}
                    {p.span && (
                      <button aria-label={`Togli la proprietà ${p.name}`} title="Togli" onClick={() => void deleteStatement(p.span!, `Proprietà «${p.name}» tolta`)}>
                        <IconaChiudi size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <div className="riga-campi">
                <label className="campo campo-largo">
                  <span className="visivamente-nascosto">Nuova proprietà</span>
                  <input type="text" placeholder="una proprietà, es. rotta" value={propNew} onChange={(e) => setPropNew(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void aggiungiProprieta()} />
                </label>
                <button className="btn btn-quieto campo-pulsante" disabled={!propNew.trim()} onClick={() => void aggiungiProprieta()}>
                  Aggiungi
                </button>
              </div>
            </Riquadro>

            <Riquadro titolo="Altri nomi" aiuto="Le parole con cui il giocatore può chiamarlo: «lanterna» per «la torcia».">
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
                  <input type="text" placeholder="un altro nome, es. lanterna" value={aliasNew} onChange={(e) => setAliasNew(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void aggiungiAlias()} />
                </label>
                <button className="btn btn-quieto campo-pulsante" disabled={!aliasNew.trim()} onClick={() => void aggiungiAlias()}>
                  Aggiungi
                </button>
              </div>
            </Riquadro>

            <EliminaElemento nome={sel.name} tipo="oggetto" onEliminato={() => setSelId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}

// Capacità di trasporto BASE del giocatore: «Il giocatore può portare N oggetti.»
// (vuoto = illimitata). Vale per tutta la storia: sta sotto l'elenco degli oggetti.
function CarryBaseField({ value, onSet }: { value: number | null; onSet: (v: number | null) => void }): JSX.Element {
  const [v, setV] = useState(value === null ? '' : String(value))
  useEffect(() => setV(value === null ? '' : String(value)), [value])
  const salva = (): void => {
    const t = v.trim()
    if (t === '') {
      if (value !== null) onSet(null)
      return
    }
    const n = parseInt(t, 10)
    if (!Number.isNaN(n) && n !== value) onSet(n)
    else if (Number.isNaN(n)) setV(value === null ? '' : String(value))
  }
  return (
    <label className="capienza" title="Quanti oggetti può tenere il giocatore (vuoto = quanti ne vuole)">
      <span>Il giocatore ne porta al massimo</span>
      <input type="number" min={1} placeholder="∞" value={v} onChange={(e) => setV(e.target.value)} onBlur={salva} onKeyDown={(e) => e.key === 'Enter' && salva()} />
    </label>
  )
}

// Bonus di capacità dell'oggetto: «X dà N spazi.» (0 = nessuno).
function CarryBonusField({ value, onSet }: { value: number; onSet: (v: number) => void }): JSX.Element {
  const [v, setV] = useState(String(value))
  useEffect(() => setV(String(value)), [value])
  const salva = (): void => {
    const n = parseInt(v, 10)
    if (!Number.isNaN(n) && n !== value) onSet(n)
    else if (Number.isNaN(n)) setV(String(value))
  }
  return (
    <label className="campo campo-stretto" title="Spazi in più mentre l'oggetto è nell'inventario (0 = nessuno)">
      <span className="campo-etichetta">Dà spazi in più (come uno zaino)</span>
      <input type="number" min={0} value={v} onChange={(e) => setV(e.target.value)} onBlur={salva} onKeyDown={(e) => e.key === 'Enter' && salva()} />
    </label>
  )
}
