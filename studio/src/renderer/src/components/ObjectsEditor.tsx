import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import type { ObjectKind } from '../../../shared/protocol'

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

/** Toglie l'articolo iniziale dal nome (per «è in <stanza>» senza doppio articolo). */
function nucleo(nome: string): string {
  return nome.replace(/^\s*(l'|un'|uno\s+|una\s+|gli\s+|il\s+|lo\s+|la\s+|le\s+|un\s+|i\s+)/i, '').trim()
}

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

  const proprietaVisibili = sel ? sel.properties.filter((p) => p.name !== 'prendibile') : []
  const prendibileProp = sel?.properties.find((p) => p.name === 'prendibile') ?? null

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
  const cambiaPosizione = async (roomId: string): Promise<void> => {
    if (!sel) return
    if (roomId === '') {
      if (sel.location?.span) await deleteStatement(sel.location.span)
      return
    }
    const room = rooms.find((r) => r.id === roomId)
    if (!room) return
    await applyStatement(
      { op: 'position', name: sel.name, prep: 'in', place: nucleo(room.name) },
      sel.location?.span
    )
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
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

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
                  placeholder="es. chiusa, rotta…"
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
