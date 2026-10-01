import { useEffect, useState } from 'react'
import { useStudio, infoStoria } from '../store'
import type { ReferencesResult } from '../../../shared/protocol'
import { nucleo } from '../utils/posizione'
import { nomeFile } from '../utils/progetto'

// Rinominare ed eliminare un elemento della storia (stanza, oggetto, personaggio) dal suo
// pannello. Il nome è quello con l'articolo, com'è scritto nella storia.

/** L'identità di un elemento: il nome senza articolo, in minuscolo (come la calcola il motore). */
export function idDiNome(nome: string): string {
  return nucleo(nome).toLowerCase()
}

/** Il campo «Nome» di un elemento: si scrive il nome nuovo e «Rinomina» lo cambia ovunque. */
export function RinominaElemento({
  nome,
  onRinominato
}: {
  nome: string
  onRinominato?: (nuovoNome: string) => void
}): JSX.Element {
  const rinomina = useStudio((s) => s.rinominaElemento)
  const [bozza, setBozza] = useState(nome)
  const [lavoro, setLavoro] = useState(false)
  useEffect(() => setBozza(nome), [nome])
  const cambiato = bozza.trim() !== '' && bozza.trim() !== nome

  const applica = async (): Promise<void> => {
    if (!cambiato || lavoro) return
    setLavoro(true)
    const ok = await rinomina(nome, bozza.trim())
    setLavoro(false)
    if (ok) onRinominato?.(bozza.trim())
  }

  return (
    <div className="objed-field">
      <label>Nome</label>
      <div className="rinomina-riga">
        <input
          type="text"
          value={bozza}
          onChange={(e) => setBozza(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void applica()
            if (e.key === 'Escape') setBozza(nome)
          }}
          aria-label="Nome (con l’articolo)"
        />
        <button className="modal-btn primary" disabled={!cambiato || lavoro} onClick={() => void applica()}>
          {lavoro ? 'Rinomino…' : 'Rinomina'}
        </button>
      </div>
      <p className="var-note">
        Col suo articolo («La cucina», «Il mercante»). Il nome cambia in tutte le frasi che lo citano,
        anche negli altri file della storia; i testi (descrizioni, risposte) non si toccano.
      </p>
    </div>
  )
}

const CATEGORIE: Record<string, string> = {
  definizione: 'Definizione',
  descrizione: 'Descrizione',
  posizione: 'Dove si trovano',
  uscita: 'Uscite',
  partenza: 'Punto di partenza',
  inventario: 'Chi lo porta',
  proprietà: 'Proprietà',
  sinonimo: 'Altri nomi',
  regola: 'Regole ed eventi',
  dialogo: 'Dialoghi',
  altro: 'Altro'
}

/** Il pulsante «Elimina…» e la finestra che dice che cosa se ne va insieme all'elemento. */
export function EliminaElemento({
  nome,
  tipo,
  onEliminato
}: {
  nome: string
  tipo: 'stanza' | 'oggetto' | 'personaggio'
  onEliminato?: () => void
}): JSX.Element {
  const riferimenti = useStudio((s) => s.riferimentiElemento)
  const eliminaFrasi = useStudio((s) => s.eliminaFrasi)
  const multiFile = useStudio((s) => (infoStoria(s)?.membri.length ?? 1) > 1)
  const [aperta, setAperta] = useState(false)
  const [dati, setDati] = useState<ReferencesResult | null>(null)
  const [lavoro, setLavoro] = useState(false)

  const apri = async (): Promise<void> => {
    setDati(null)
    setAperta(true)
    setDati(await riferimenti(nome))
  }
  const chiudi = (): void => {
    setAperta(false)
    setDati(null)
  }
  const conferma = async (): Promise<void> => {
    if (!dati?.ok) return
    setLavoro(true)
    const ok = await eliminaFrasi(dati.items.map((i) => i.span))
    setLavoro(false)
    if (ok) {
      chiudi()
      onEliminato?.()
    }
  }

  const gruppi = new Map<string, ReferencesResult['items']>()
  for (const i of dati?.items ?? []) gruppi.set(i.category, [...(gruppi.get(i.category) ?? []), i])
  const ha = (c: string): boolean => gruppi.has(c)
  const articolo = tipo === 'stanza' ? 'questa stanza' : tipo === 'personaggio' ? 'questo personaggio' : 'questo oggetto'

  return (
    <>
      <div className="objed-field elimina-campo">
        <button className="modal-btn danger" onClick={() => void apri()}>
          Elimina {tipo === 'stanza' ? 'la stanza' : tipo === 'personaggio' ? 'il personaggio' : 'l’oggetto'}…
        </button>
      </div>

      {aperta && (
        <div className="modal-backdrop" onClick={chiudi}>
          <div className="modal modal-largo" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Eliminare «{nome}»?</h2>
            {!dati && <p className="modal-body">Cerco dove viene citato…</p>}
            {dati && !dati.ok && <p className="modal-body">{dati.reason ?? 'Non riesco a leggere la storia.'}</p>}
            {dati?.ok && (
              <>
                <p className="modal-body">
                  Insieme a {articolo} vanno via {dati.items.length === 1 ? 'questa frase' : `queste ${dati.items.length} frasi`},
                  perché la citano:
                </p>
                <div className="elimina-elenco">
                  {[...gruppi.entries()].map(([cat, voci]) => (
                    <div key={cat} className="elimina-gruppo">
                      <div className="elimina-cat">
                        {CATEGORIE[cat] ?? cat}
                        <span className="debug-count"> · {voci.length}</span>
                      </div>
                      {voci.map((v, i) => (
                        <div key={i} className="elimina-voce">
                          <code>{v.preview}</code>
                          {multiFile && <span className="elimina-file">{nomeFile(v.span.file)}</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <ul className="elimina-note">
                  {ha('regola') && <li>Le regole e gli eventi che la citano vengono tolti per intero.</li>}
                  {ha('dialogo') && <li>I dialoghi che la citano vengono tolti: controlla che nessun nodo resti orfano.</li>}
                  {ha('posizione') && <li>Ciò che stava «dentro» o «in» questo elemento resta senza posizione: va rimesso da qualche parte.</li>}
                  {ha('partenza') && <li>Era il punto di partenza: la partita comincerà dalla prima stanza.</li>}
                  <li>Se nei testi (descrizioni, risposte) compare ancora il suo nome, lì resta scritto: controllalo.</li>
                </ul>
                <div className="modal-actions">
                  <button className="modal-btn ghost" onClick={chiudi}>
                    Annulla
                  </button>
                  <button className="modal-btn danger" disabled={lavoro} onClick={() => void conferma()}>
                    {lavoro ? 'Elimino…' : 'Elimina'}
                  </button>
                </div>
              </>
            )}
            {!dati?.ok && dati && (
              <div className="modal-actions">
                <button className="modal-btn ghost" onClick={chiudi}>
                  Chiudi
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
