import { useState } from 'react'
import { useStudio } from '../store'
import type {
  RelationDecl,
  RelationMember,
  RelationArity,
  OutlineSpan
} from '../../../shared/protocol'
import Finestra from './Finestra'
import { NonPronto, Vuoto } from './Elenco'
import { IconaAggiorna, IconaChiudi, IconaPiu, IconaFrecciaDestra } from './Icone'

// Pannello «Relazioni» (relazioni di prima classe, B3). Stesso idioma degli altri
// editor del Mondo: una griglia leggibile mostra le relazioni dichiarate (arietà e
// reciprocità) e, sotto ciascuna, le coppie «soggetto → oggetto» ASSERITE d'autore.
// Ogni modifica genera la frase .fav canonica via sidecar (relation_decl /
// relation_fact) e la splicia nel testo (undo nativo di Monaco): Monaco resta la
// fonte di verità, questa è una vista sincronizzata. La griglia riflette le frasi
// scritte, non la chiusura semantica (niente rovescio della reciprocità fra le righe).

const ETICHETTA_ARIETA: Record<RelationArity, string> = {
  'uno-a-uno': 'uno a uno',
  'uno-a-molti': 'uno a molti',
  'molti-a-molti': 'molti a molti'
}

/** Prima lettera maiuscola, solo per la lettura a schermo (non per la serializzazione). */
function conMaiuscola(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export default function RelazioniEditor(): JSX.Element {
  const relations = useStudio((s) => s.relations)
  const loading = useStudio((s) => s.relationsLoading)
  const load = useStudio((s) => s.loadRelations)
  const applyStatement = useStudio((s) => s.applyStatement)
  const deleteStatement = useStudio((s) => s.deleteStatement)
  const eliminaFrasi = useStudio((s) => s.eliminaFrasi)
  const isFav = useStudio((s) => !!s.activePath?.toLowerCase().endsWith('.fav'))
  const [creating, setCreating] = useState(false)

  if (!isFav) return <NonPronto cosa="le relazioni" stato="nessun-file" />
  if (!relations)
    return <NonPronto cosa="le relazioni" stato={loading ? 'carico' : 'vuoto'} onRiprova={() => void load()} />
  if (!relations.ok) return <NonPronto cosa="le relazioni" stato="errori" onRiprova={() => void load()} />

  const { relations: rels, members } = relations

  // Elimina la relazione: la dichiarazione + tutte le sue coppie, in un passo solo e
  // annullabile. Le regole che la interrogano restano nel testo: se diventano
  // sbagliate, compaiono nei Problemi (stessa scelta del pannello Stati).
  const eliminaRelazione = (rel: RelationDecl): void => {
    const spans = [rel.declSpan, ...rel.pairs.map((p) => p.span)].filter((x): x is OutlineSpan => !!x)
    void eliminaFrasi(spans, `Relazione «${rel.locution}» eliminata`)
  }

  // Aggiunge una coppia: la frase 'A <locuzione> B.' in coda al file dei nuovi elementi.
  const aggiungiCoppia = (rel: RelationDecl, a: RelationMember, b: RelationMember): void => {
    void applyStatement({ op: 'relation_fact', aName: a.name, base: rel.base, prep: rel.prep, bName: b.name })
  }

  return (
    <div className="ruled">
      <div className="pannello-testa">
        <h2 className="pannello-titolo">
          Relazioni <span className="elenco-conto">{rels.length}</span>
        </h2>
        <button className="btn-icona" aria-label="Rileggi" title="Rileggi" onClick={() => void load()}>
          <IconaAggiorna />
        </button>
        <button className="btn btn-accento btn-piccolo" onClick={() => setCreating(true)}>
          <IconaPiu size={15} />
          Nuova relazione
        </button>
      </div>

      {creating && <RelazioneForm onDone={() => setCreating(false)} />}

      <div className="ruled-body">
        {rels.length === 0 && (
          <Vuoto titolo="Nessuna relazione ancora">
            Una relazione è un legame fra chi e che cosa: «si fida di», «possiede», «è amico di». La dichiari
            una volta, poi colleghi le coppie («il giocatore → Saverio»). Le regole la interrogano con «se il
            giocatore si fida di Saverio».
          </Vuoto>
        )}

        {rels.map((rel) => (
          <div key={rel.name} className="rule-card">
            <div className="rule-head">
              <span className="rule-verb">relazione</span>
              <span className="rule-target">«{rel.locution}»</span>
              <span className="rule-chip" title="Quante coppie può reggere su ciascun lato">
                {ETICHETTA_ARIETA[rel.arity]}
              </span>
              {rel.reciprocal && (
                <span className="rule-chip" title="Se vale A → B, vale anche B → A">
                  reciproca
                </span>
              )}
              <button
                className="btn-icona"
                aria-label={`Elimina la relazione ${rel.locution}`}
                title="Elimina questa relazione e le sue coppie"
                onClick={() => eliminaRelazione(rel)}
              >
                <IconaChiudi />
              </button>
            </div>
            <GrigliaCoppie
              rel={rel}
              members={members}
              onRimuovi={(span) =>
                void deleteStatement(span, 'Coppia tolta')
              }
              onAggiungi={aggiungiCoppia}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// La griglia delle coppie di UNA relazione: le righe «soggetto → oggetto» (ognuna con
// la × che toglie la frase sorgente) e, in fondo, la riga per aggiungerne una (due
// menu dei membri + «+ coppia»). Niente doppioni: una coppia già scritta non si
// ripropone.
function GrigliaCoppie({
  rel,
  members,
  onRimuovi,
  onAggiungi
}: {
  rel: RelationDecl
  members: RelationMember[]
  onRimuovi: (span: OutlineSpan) => void
  onAggiungi: (rel: RelationDecl, a: RelationMember, b: RelationMember) => void
}): JSX.Element {
  const [aId, setAId] = useState<string>(members[0]?.id ?? '')
  const [bId, setBId] = useState<string>('')
  const trova = (id: string): RelationMember | undefined => members.find((m) => m.id === id)
  const esiste = (a: string, b: string): boolean => rel.pairs.some((p) => p.a === a && p.b === b)
  const ma = trova(aId)
  const mb = trova(bId)
  const puoAggiungere = !!ma && !!mb && !esiste(aId, bId)

  const aggiungi = (): void => {
    if (ma && mb && !esiste(ma.id, mb.id)) {
      onAggiungi(rel, ma, mb)
      setBId('')
    }
  }

  return (
    <div className="rel-pairs">
      {rel.pairs.length === 0 && (
        <span className="nota-riquadro">nessuna coppia — collegane una qui sotto</span>
      )}
      {rel.pairs.map((p, i) => (
        <div key={`${p.a}>${p.b}#${i}`} className="rel-pair">
          <span className="rel-membro">{conMaiuscola(p.aName)}</span>
          <span className="rel-arrow" aria-label="in relazione con">
            <IconaFrecciaDestra size={15} />
          </span>
          <span className="rel-membro">{conMaiuscola(p.bName)}</span>
          {p.span ? (
            <button
              className="btn-icona rel-tog"
              aria-label={`Togli la coppia ${conMaiuscola(p.aName)} → ${p.bName}`}
              title="Togli questa coppia"
              onClick={() => onRimuovi(p.span as OutlineSpan)}
            >
              <IconaChiudi size={14} />
            </button>
          ) : (
            <span className="rel-nospan" title="Questa coppia non ha una frase propria da togliere">
              nel testo
            </span>
          )}
        </div>
      ))}

      <div className="rel-add">
        <label className="visivamente-nascosto" htmlFor={`rel-a-${rel.name}`}>
          Soggetto
        </label>
        <select id={`rel-a-${rel.name}`} value={aId} onChange={(e) => setAId(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {conMaiuscola(m.name)}
            </option>
          ))}
        </select>
        <span className="rel-arrow" aria-hidden="true">
          <IconaFrecciaDestra size={15} />
        </span>
        <label className="visivamente-nascosto" htmlFor={`rel-b-${rel.name}`}>
          Oggetto
        </label>
        <select id={`rel-b-${rel.name}`} value={bId} onChange={(e) => setBId(e.target.value)}>
          <option value="">scegli…</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {conMaiuscola(m.name)}
            </option>
          ))}
        </select>
        <button
          className="btn btn-quieto btn-piccolo"
          disabled={!puoAggiungere}
          title={esiste(aId, bId) ? 'Questa coppia c’è già' : 'Aggiungi la coppia'}
          onClick={aggiungi}
        >
          <IconaPiu size={14} />
          coppia
        </button>
      </div>
    </div>
  )
}

// Modale di CREAZIONE di una relazione: la locuzione (es. «si fida di»), l'arietà e la
// reciprocità. Genera la frase '"…" è una relazione …' via relation_decl.
function RelazioneForm({ onDone }: { onDone: () => void }): JSX.Element {
  const appendStatements = useStudio((s) => s.appendStatements)
  const usate = useStudio(
    (s) => new Set((s.relations?.relations ?? []).map((r) => r.name.toLowerCase()))
  )
  const [locuzione, setLocuzione] = useState('')
  const [arieta, setArieta] = useState<RelationArity>('molti-a-molti')
  const [reciproca, setReciproca] = useState(false)

  const nome = locuzione.trim().toLowerCase()
  const libero = nome.length > 0 && !usate.has(nome)
  const valido = libero

  const crea = async (): Promise<void> => {
    const loc = locuzione.trim()
    if (!loc) return
    await appendStatements([{ op: 'relation_decl', locution: loc, arity: arieta, reciprocal: reciproca }])
    onDone()
  }

  return (
    <Finestra
      titolo="Una relazione nuova"
      sottotitolo="Un legame nominato fra chi e che cosa. La dichiari qui; le coppie si collegano poi nella griglia."
      onChiudi={onDone}
      larga
      azioni={
        <>
          <button className="btn btn-quieto" onClick={onDone}>
            Annulla
          </button>
          <button className="btn btn-primario" disabled={!valido} onClick={() => void crea()}>
            Crea la relazione
          </button>
        </>
      }
    >
      <div className="modulo">
        <div className="objed-field">
          <label>Locuzione</label>
          <input
            autoFocus
            value={locuzione}
            aria-invalid={locuzione.trim().length > 0 && !libero}
            placeholder="es. si fida di"
            onChange={(e) => setLocuzione(e.target.value)}
          />
          {locuzione.trim().length > 0 && !libero && (
            <p className="errore-campo">C’è già una relazione con questa locuzione.</p>
          )}
          <p className="aiuto">
            Il verbo con cui la userai nelle frasi: «il giocatore <b>si fida di</b> Saverio». Se finisce con una
            preposizione («di», «a»), scrivila: l’IDE la concorda da sé («del giocatore»).
          </p>
        </div>

        <div className="objed-field">
          <label>Arietà</label>
          <div className="objed-seg">
            <button className={arieta === 'uno-a-uno' ? 'on' : ''} onClick={() => setArieta('uno-a-uno')}>
              uno a uno
            </button>
            <button className={arieta === 'uno-a-molti' ? 'on' : ''} onClick={() => setArieta('uno-a-molti')}>
              uno a molti
            </button>
            <button
              className={arieta === 'molti-a-molti' ? 'on' : ''}
              onClick={() => setArieta('molti-a-molti')}
            >
              molti a molti
            </button>
          </div>
          <p className="aiuto">
            {arieta === 'uno-a-uno'
              ? 'Ogni soggetto si lega a un solo oggetto, e viceversa (aggiungere una coppia sfratta quelle in conflitto).'
              : arieta === 'uno-a-molti'
                ? 'Ogni oggetto ha un solo soggetto; un soggetto può averne molti.'
                : 'Qualsiasi numero di coppie: il caso più libero.'}
          </p>
        </div>

        <div className="objed-field">
          <label className="interruttore">
            <input type="checkbox" role="switch" checked={reciproca} onChange={(e) => setReciproca(e.target.checked)} />
            <span className="interruttore-binario" aria-hidden="true" />
            <span>Reciproca</span>
          </label>
          <p className="aiuto">Se la spunti, ogni coppia vale in entrambi i versi: «A è amico di B» implica «B è amico di A».</p>
        </div>
      </div>
    </Finestra>
  )
}
