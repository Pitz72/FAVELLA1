import { useEffect, useState } from 'react'
import { useStudio } from '../store'
import { specPosizione } from '../utils/posizione'
import { EliminaElemento, RinominaElemento, idDiNome } from './ElementoAzioni'

// Editor dei PERSONAGGI: chi abita la storia. Si crea un personaggio da zero (dove sta e,
// se si vuole, com'è fatto), lo si sposta, lo si rinomina, gli si cambia la descrizione e
// i nomi con cui il giocatore può chiamarlo, e si arriva al suo dialogo. Le battute e le
// scelte si scrivono nel pannello Dialoghi.
export default function CharactersEditor(): JSX.Element {
  const outline = useStudio((s) => s.outline)
  const loading = useStudio((s) => s.outlineLoading)
  const loadOutline = useStudio((s) => s.loadOutline)
  const dialogues = useStudio((s) => s.dialogues)
  const applyStatement = useStudio((s) => s.applyStatement)
  const appendStatements = useStudio((s) => s.appendStatements)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const setRightTab = useStudio((s) => s.setRightTab)
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

  if (!isFav) {
    return <div className="insp-empty">Apri un file .fav per creare e modificare i personaggi.</div>
  }
  if (!outline) {
    return (
      <div className="insp-empty">
        {loading ? 'Carico i personaggi…' : 'Nessun personaggio caricato.'}
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
        Il file contiene errori: correggili per usare l’editor dei personaggi.
        <button className="map-reload" onClick={() => void loadOutline()}>
          ⟳ Riprova
        </button>
      </div>
    )
  }

  const rooms = outline.rooms
  const stanzaIniziale = rooms.find((r) => r.isStart)?.id ?? rooms[0]?.id ?? ''
  const npc = sel ? dialogues?.npcs.find((n) => n.id === sel.id) ?? null : null
  const nodiSuoi = sel ? (dialogues?.nodes ?? []).filter((n) => n.speaker?.id === sel.id) : []

  const apriCreazione = (): void => {
    setCreando((v) => !v)
    setNuovoNome('')
    setNuovaDesc('')
    setNuovaStanza(stanzaIniziale)
  }

  // «X è un personaggio.», dove sta e — se scritta — la sua descrizione, in un colpo solo.
  const crea = async (): Promise<void> => {
    const nome = nuovoNome.trim()
    if (!nome) return
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
  // sostituisce sul posto, altrimenti si toglie la vecchia e se ne scrive una nuova in coda.
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
    const sulPosto =
      !!vecchia && !!stanza.defSpan && stanza.defSpan.file === vecchia.file && stanza.defSpan.line < vecchia.line
    if (sulPosto) {
      await applyStatement(spec, vecchia)
    } else {
      if (vecchia) await deleteStatement(vecchia)
      await applyStatement(spec)
    }
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

  return (
    <div className="objed">
      <div className="insp-top">
        <span className="debug-title">
          Personaggi<span className="debug-count"> · {personaggi.length}</span>
        </span>
        <div>
          <button className="btn-testo" title="Aggiungi un personaggio alla storia" onClick={apriCreazione}>
            + Nuovo personaggio
          </button>
        </div>
      </div>

      {creando && (
        <div className="objed-create objed-create-col">
          <div className="objed-create-riga">
            <input
              type="text"
              autoFocus
              placeholder="Nome con l’articolo (es. Il mercante)"
              value={nuovoNome}
              onChange={(e) => setNuovoNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void crea()
                if (e.key === 'Escape') setCreando(false)
              }}
            />
            <select value={nuovaStanza} onChange={(e) => setNuovaStanza(e.target.value)} aria-label="In quale stanza">
              <option value="">— da nessuna parte —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  in {r.name}
                </option>
              ))}
            </select>
            <button className="modal-btn primary" disabled={!nuovoNome.trim()} onClick={() => void crea()}>
              Crea
            </button>
            <button className="modal-btn ghost" onClick={() => setCreando(false)}>
              Annulla
            </button>
          </div>
          <div className="objed-create-riga">
            <input
              type="text"
              placeholder="Com’è fatto, in una frase (facoltativo)"
              value={nuovaDesc}
              onChange={(e) => setNuovaDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void crea()
              }}
            />
          </div>
        </div>
      )}

      <div className="objed-body">
        <div className="objed-list">
          {personaggi.length === 0 ? (
            <p className="insp-none">nessun personaggio: creane uno con «Nuovo personaggio»</p>
          ) : (
            personaggi.map((o) => (
              <div
                key={o.id}
                className={'objed-row' + (o.id === selId ? ' sel' : '')}
                onClick={() => setSelId(o.id)}
                title={o.location ? `Sta ${o.location.prep ?? 'in'} ${o.location.name}` : 'Non sta da nessuna parte'}
              >
                <span className="objed-row-icon">☻</span>
                <span className="objed-row-name">{o.name}</span>
              </div>
            ))
          )}
        </div>

        {!sel && <div className="vuoto-scegli">Scegli un personaggio dall’elenco per modificarlo.</div>}
        {sel && (
          <div className="objed-form">
            <RinominaElemento nome={sel.name} onRinominato={(n) => setSelId(idDiNome(n))} />

            <div className="objed-field">
              <label>Dove si trova</label>
              <select
                value={sel.location && rooms.some((r) => r.id === sel.location!.id) ? sel.location.id : ''}
                onChange={(e) => void cambiaStanza(e.target.value)}
              >
                <option value="">— da nessuna parte —</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {sel.location && !rooms.some((r) => r.id === sel.location!.id) && (
                <p className="var-note">Ora sta in «{sel.location.name}»: cambialo dal pannello Oggetti.</p>
              )}
            </div>

            <div className="objed-field">
              <label>Descrizione</label>
              {sel.descConditional ? (
                <p className="insp-none">Descrizione condizionale: modificala nel testo (l’editor non la riscrive).</p>
              ) : (
                <>
                  <textarea
                    rows={3}
                    placeholder="Cosa vede il giocatore guardandolo…"
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
              <label>Dialogo</label>
              {nodiSuoi.length === 0 ? (
                <p className="insp-none">Non parla ancora: le sue battute si scrivono nel pannello Dialoghi.</p>
              ) : (
                <p className="var-note">
                  Dice {nodiSuoi.length === 1 ? 'una battuta' : `${nodiSuoi.length} battute`}
                  {npc?.startNode ? `; il dialogo comincia dal nodo «${npc.startNode}»` : ''}.
                </p>
              )}
              <button className="modal-btn ghost objed-save" onClick={() => setRightTab('dialoghi')}>
                {nodiSuoi.length === 0 ? 'Scrivi il suo dialogo →' : 'Apri i dialoghi →'}
              </button>
            </div>

            <div className="objed-field">
              <label>Altri nomi (con cui il giocatore può chiamarlo)</label>
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
                  placeholder="es. oste"
                  value={aliasNew}
                  onChange={(e) => setAliasNew(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void aggiungiAlias()
                  }}
                />
                <button className="modal-btn ghost" disabled={!aliasNew.trim()} onClick={() => void aggiungiAlias()}>
                  + nome
                </button>
              </div>
            </div>

            <EliminaElemento nome={sel.name} tipo="personaggio" onEliminato={() => setSelId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
