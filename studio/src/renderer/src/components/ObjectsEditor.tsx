import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type { ObjectKind, OutlineObject, OutlineLocation } from '../../../shared/protocol'
import { specPosizione } from '../utils/posizione'

const KIND_LABEL: Record<ObjectKind, string> = {
  oggetto: 'Oggetto',
  contenitore: 'Contenitore',
  supporto: 'Supporto',
  personaggio: 'Personaggio'
}
const KIND_ICON: Record<ObjectKind, string> = {
  oggetto: '•',
  contenitore: '▣',
  supporto: '▤',
  personaggio: '☻'
}
const KINDS: ObjectKind[] = ['oggetto', 'contenitore', 'supporto', 'personaggio']

export default function ObjectsEditor(): JSX.Element {
  const outline = useStudio((s) => s.outline)
  const loading = useStudio((s) => s.outlineLoading)
  const loadOutline = useStudio((s) => s.loadOutline)
  const applyStatement = useStudio((s) => s.applyStatement)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))

  const [selId, setSelId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [nuovoNome, setNuovoNome] = useState('')
  const [nuovoKind, setNuovoKind] = useState<ObjectKind>('oggetto')
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

  if (!isFav) {
    return <div className="insp-empty">Apri un file .fav per creare e modificare gli oggetti.</div>
  }
  if (!outline) {
    return (
      <div className="insp-empty">
        {loading ? 'Carico gli oggetti…' : 'Nessun oggetto caricato.'}
        {!loading && (
          <button className="map-reload" onClick={() => void loadOutline()}>
            ⟳ Carica
          </button>
        )}
      </div>
    )
  }
  if (!outline.ok) {
    return (
      <div className="insp-empty">
        Il file contiene errori: correggili per usare l’editor oggetti.
        <button className="map-reload" onClick={() => void loadOutline()}>
          ⟳ Riprova
        </button>
      </div>
    )
  }

  const objects = outline.objects
  const rooms = outline.rooms

  const crea = async (): Promise<void> => {
    const nome = nuovoNome.trim()
    if (!nome) return
    setCreando(false)
    setNuovoNome('')
    setNuovoKind('oggetto')
    await applyStatement({ op: 'object_def', name: nome, kind: nuovoKind })
  }

  // Coppie di proprietà opposte note nel mondo (aperta/chiusa di default + quelle
  // dichiarate). I loro membri NON compaiono tra i tag liberi: si editano come
  // selettori a due stati qui sotto.
  const opposites = outline.opposites ?? []
  const membriOpposti = new Set<string>()
  opposites.forEach((p) => {
    membriOpposti.add(p.a)
    membriOpposti.add(p.b)
  })
  const proprietaVisibili = sel
    ? sel.properties.filter((p) => p.name !== 'prendibile' && !membriOpposti.has(p.name))
    : []
  const prendibileProp = sel?.properties.find((p) => p.name === 'prendibile') ?? null

  // Bersagli di posizione che non sono stanze: contenitori e supporti (escluso
  // l'oggetto stesso, che non può contenersi). Servono al selettore Posizione e
  // alla sezione Contenuto.
  const contenitori = objects.filter((o) => o.kind === 'contenitore' && o.id !== selId)
  const supporti = objects.filter((o) => o.kind === 'supporto' && o.id !== selId)
  // Cosa c'è dentro/sopra l'oggetto selezionato, e i candidati da aggiungervi.
  const contenuto = sel ? objects.filter((o) => o.location?.id === sel.id) : []
  const candidatiContenuto = sel
    ? objects.filter((o) => o.id !== sel.id && o.location?.id !== sel.id)
    : []
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
      // se lo span è ignoto non tocchiamo nulla (raro: outline senza posizioni)
    } else {
      await applyStatement({ op: 'prendibile', name: sel.name })
    }
  }
  // Colloca `objName` secondo `spec`. Il transformer tipa le posizioni NELL'ORDINE
  // del sorgente: una frase «X è nel contenitore» che PRECEDE la definizione del
  // contenitore dà «stanza inesistente». Perciò, quando il bersaglio è un
  // contenitore/supporto, la frase va APPESA in fondo (dopo ogni definizione),
  // eliminando l'eventuale posizione precedente. Per le STANZE (definite prima) la
  // sostituzione in loco è sicura e preserva il layout d'autore.
  const colloca = async (
    oldLoc: OutlineLocation | null,
    spec: { op: 'position'; name: string; prep: string; place: string },
    inContenitore: boolean
  ): Promise<void> => {
    if (inContenitore) {
      if (oldLoc?.span) await deleteStatement(oldLoc.span)
      await applyStatement(spec)
    } else {
      await applyStatement(spec, oldLoc?.span ?? undefined)
    }
  }

  const cambiaPosizione = async (targetId: string): Promise<void> => {
    if (!sel) return
    if (targetId === '') {
      if (sel.location?.span) await deleteStatement(sel.location.span)
      return
    }
    const room = rooms.find((r) => r.id === targetId)
    if (room) {
      await colloca(sel.location, specPosizione(sel.name, { name: room.name, kind: 'stanza' }), false)
      return
    }
    const cont = objects.find((o) => o.id === targetId)
    if (!cont) return
    await colloca(sel.location, specPosizione(sel.name, { name: cont.name, kind: cont.kind }), true)
  }

  // Contenuto di un contenitore/supporto: «La gemma è nella scatola.» Mettere un
  // oggetto qui = appendere la SUA frase di posizione verso questo nucleo (dopo la
  // definizione del contenitore), eliminando l'eventuale posizione precedente.
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

  // Imposta (o azzera) il lato attivo di una coppia opposta sull'oggetto.
  // lato = il nome della proprietà da attivare, oppure null per «nessuno».
  // Le opposte si escludono: se l'altro lato era attivo, ne SOSTITUISCO la frase
  // (così il sorgente non resta contraddittorio con entrambe le proprietà).
  const impostaStato = async (pair: { a: string; b: string }, lato: string | null): Promise<void> => {
    if (!sel) return
    const propA = sel.properties.find((p) => p.name === pair.a) ?? null
    const propB = sel.properties.find((p) => p.name === pair.b) ?? null
    const attiva = propA ?? propB
    if (lato === null) {
      if (attiva?.span) await deleteStatement(attiva.span)
      return
    }
    const corrente = sel.properties.find((p) => p.name === lato) ?? null
    if (corrente) return // già attivo: niente da fare
    const altro = lato === pair.a ? propB : propA
    if (altro?.span) {
      await applyStatement({ op: 'property', name: sel.name, property: lato }, altro.span)
    } else {
      await applyStatement({ op: 'property', name: sel.name, property: lato })
    }
  }

  // Dichiara una nuova coppia di proprietà opposte (vale per TUTTI gli oggetti):
  // «X e Y sono opposte.» in fondo al file attivo.
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

  return (
    <div className="objed">
      <div className="insp-top">
        <span className="debug-title">
          Oggetti<span className="debug-count"> · {objects.length}</span>
        </span>
        <div>
          <button className="icon-btn" title="Nuovo oggetto" onClick={() => setCreando((v) => !v)}>
            ➕
          </button>
          <button className="icon-btn" title="Aggiorna" onClick={() => void loadOutline()}>
            ⟳
          </button>
        </div>
      </div>

      {creando && (
        <div className="objed-create">
          <input
            type="text"
            autoFocus
            placeholder="Nome con articolo (es. La torcia)"
            value={nuovoNome}
            onChange={(e) => setNuovoNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void crea()
            }}
          />
          <select value={nuovoKind} onChange={(e) => setNuovoKind(e.target.value as ObjectKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <button className="modal-btn primary" disabled={!nuovoNome.trim()} onClick={() => void crea()}>
            Crea
          </button>
        </div>
      )}

      <div className="objed-body">
        <div className="objed-list">
          {objects.length === 0 ? (
            <p className="insp-none">nessun oggetto — usa ➕ per crearne uno</p>
          ) : (
            objects.map((o) => (
              <div
                key={o.id}
                className={'objed-row' + (o.id === selId ? ' sel' : '')}
                onClick={() => setSelId(o.id)}
                title={o.kind}
              >
                <span className="objed-row-icon">{KIND_ICON[o.kind]}</span>
                <span className="objed-row-name">{o.name}</span>
              </div>
            ))
          )}
        </div>

        {sel && (
          <div className="objed-form">
            <div className="objed-field">
              <label>Tipo</label>
              <select value={sel.kind} onChange={(e) => void cambiaTipo(e.target.value as ObjectKind)}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>

            <div className="objed-field">
              <label className="objed-check">
                <input type="checkbox" checked={sel.prendibile} onChange={() => void togglePrendibile()} />
                Prendibile
              </label>
            </div>

            <div className="objed-field">
              <label>Posizione</label>
              <select value={sel.location?.id ?? ''} onChange={(e) => void cambiaPosizione(e.target.value)}>
                <option value="">— nessuna —</option>
                <optgroup label="Stanze">
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
            </div>

            {èContenitore && (
              <div className="objed-field">
                <label>{sel.kind === 'supporto' ? 'Sopra (contenuto)' : 'Contenuto'}</label>
                <div className="objed-chips">
                  {contenuto.length === 0 && <span className="insp-none">vuoto</span>}
                  {contenuto.map((c) => (
                    <span key={c.id} className="objed-chip">
                      {c.name}
                      {c.location?.span && (
                        <button title="Togli da qui" onClick={() => void togliContenuto(c)}>
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {candidatiContenuto.length > 0 && (
                  <select value="" onChange={(e) => void mettiContenuto(e.target.value)}>
                    <option value="">+ metti un oggetto qui…</option>
                    {candidatiContenuto.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="objed-field">
              <label>Descrizione</label>
              {sel.descConditional ? (
                <p className="insp-none">
                  Descrizione condizionale: modificala nel testo (l’editor non la riscrive).
                </p>
              ) : (
                <>
                  <textarea
                    rows={3}
                    value={descBozza}
                    onChange={(e) => setDescBozza(e.target.value)}
                  />
                  <button
                    className="modal-btn primary objed-save"
                    disabled={descBozza === sel.description}
                    onClick={() => void salvaDescrizione()}
                  >
                    Salva descrizione
                  </button>
                </>
              )}
            </div>

            <div className="objed-field">
              <label>Stati (proprietà a due valori)</label>
              {opposites.length === 0 && <span className="insp-none">nessuna coppia opposta</span>}
              {opposites.map((pair) => {
                const attivoA = !!sel.properties.find((p) => p.name === pair.a)
                const attivoB = !!sel.properties.find((p) => p.name === pair.b)
                const nessuno = !attivoA && !attivoB
                return (
                  <div key={pair.a + '|' + pair.b} className="objed-seg-row">
                    <div className="objed-seg">
                      <button
                        className={attivoA ? 'on' : ''}
                        onClick={() => void impostaStato(pair, pair.a)}
                      >
                        {pair.a}
                      </button>
                      <button
                        className={attivoB ? 'on' : ''}
                        onClick={() => void impostaStato(pair, pair.b)}
                      >
                        {pair.b}
                      </button>
                      <button
                        className={'off-btn' + (nessuno ? ' on' : '')}
                        title="Nessuno dei due"
                        onClick={() => void impostaStato(pair, null)}
                      >
                        —
                      </button>
                    </div>
                  </div>
                )
              })}
              {dichiarando ? (
                <div className="objed-add">
                  <input
                    type="text"
                    autoFocus
                    placeholder="es. accesa"
                    value={oppA}
                    onChange={(e) => setOppA(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void dichiaraCoppia()
                    }}
                  />
                  <input
                    type="text"
                    placeholder="es. spenta"
                    value={oppB}
                    onChange={(e) => setOppB(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void dichiaraCoppia()
                    }}
                  />
                  <button
                    className="modal-btn ghost"
                    disabled={!oppA.trim() || !oppB.trim() || oppA.trim() === oppB.trim()}
                    onClick={() => void dichiaraCoppia()}
                  >
                    Dichiara
                  </button>
                </div>
              ) : (
                <button className="modal-btn ghost objed-save" onClick={() => setDichiarando(true)}>
                  + coppia opposta
                </button>
              )}
            </div>

            <div className="objed-field">
              <label>Proprietà</label>
              <div className="objed-chips">
                {proprietaVisibili.length === 0 && <span className="insp-none">nessuna</span>}
                {proprietaVisibili.map((p) => (
                  <span key={p.name} className="objed-chip">
                    {p.name}
                    {p.span && (
                      <button title="Rimuovi" onClick={() => void deleteStatement(p.span!)}>
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <div className="objed-add">
                <input
                  type="text"
                  placeholder="es. rotta, bagnata…"
                  value={propNew}
                  onChange={(e) => setPropNew(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void aggiungiProprieta()
                  }}
                />
                <button className="modal-btn ghost" disabled={!propNew.trim()} onClick={() => void aggiungiProprieta()}>
                  + proprietà
                </button>
              </div>
            </div>

            <div className="objed-field">
              <label>Sinonimi (alias)</label>
              <div className="objed-chips">
                {sel.aliases.length === 0 && <span className="insp-none">nessuno</span>}
                {sel.aliases.map((a) => (
                  <span key={a.name} className="objed-chip">
                    {a.name}
                    {a.span && (
                      <button title="Rimuovi" onClick={() => void deleteStatement(a.span!)}>
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <div className="objed-add">
                <input
                  type="text"
                  placeholder="es. lanterna"
                  value={aliasNew}
                  onChange={(e) => setAliasNew(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void aggiungiAlias()
                  }}
                />
                <button className="modal-btn ghost" disabled={!aliasNew.trim()} onClick={() => void aggiungiAlias()}>
                  + alias
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
