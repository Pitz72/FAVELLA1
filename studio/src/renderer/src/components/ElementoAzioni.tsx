import { useEffect, useState } from 'react'
import { useStudio, infoStoria } from '../store'
import type { ReferencesResult } from '../../../shared/protocol'
import { idDiNome } from '../utils/posizione'
import { nomeFile } from '../utils/progetto'
import Finestra from './Finestra'
import { IconaCestino } from './Icone'

// Rinominare ed eliminare un elemento della storia (stanza, oggetto, personaggio) dal suo
// pannello. Il nome è quello con l'articolo, com'è scritto nella storia.

export { idDiNome }

/** Il nome di un elemento: si scrive il nome nuovo e «Rinomina» lo cambia ovunque. */
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
    <>
      <div className="riga-campi">
        <label className="campo campo-largo">
          <span className="campo-etichetta">Il nome, con l’articolo</span>
          <input
            type="text"
            value={bozza}
            onChange={(e) => setBozza(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void applica()
              if (e.key === 'Escape') setBozza(nome)
            }}
          />
        </label>
        <button className="btn btn-primario campo-pulsante" disabled={!cambiato || lavoro} onClick={() => void applica()}>
          {lavoro ? 'Rinomino…' : 'Rinomina'}
        </button>
      </div>
      <p className="aiuto">
        «La cucina», «Il mercante». Il nome cambia in tutte le frasi che lo citano, anche negli altri file della storia;
        i testi (descrizioni, risposte) non si toccano.
      </p>
    </>
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
    const etichetta = `«${nome}» eliminat${tipo === 'stanza' ? 'a' : 'o'}`
    const ok = await eliminaFrasi(
      dati.items.map((i) => i.span),
      etichetta
    )
    setLavoro(false)
    if (ok) {
      chiudi()
      onEliminato?.()
    }
  }

  const gruppi = new Map<string, ReferencesResult['items']>()
  for (const i of dati?.items ?? []) gruppi.set(i.category, [...(gruppi.get(i.category) ?? []), i])
  const ha = (c: string): boolean => gruppi.has(c)
  const articolo = tipo === 'stanza' ? 'la stanza' : tipo === 'personaggio' ? 'il personaggio' : 'l’oggetto'
  // [1.2.1] «Insieme alla stanza … perché la citano» (prima: «a la stanza … lo citano»).
  const insieme = tipo === 'stanza' ? 'alla stanza' : tipo === 'personaggio' ? 'al personaggio' : 'all’oggetto'
  const pronome = tipo === 'stanza' ? 'la' : 'lo'

  return (
    <>
      <section className="riquadro riquadro-pericolo">
        <div className="riga-pericolo">
          <p>
            Eliminare {articolo} toglie dal testo anche le frasi che {pronome} citano. Dopo, puoi annullare con «Annulla».
          </p>
          <button className="btn btn-pericolo" onClick={() => void apri()}>
            <IconaCestino />
            Elimina {articolo}…
          </button>
        </div>
      </section>

      {aperta && (
        <Finestra
          titolo={`Eliminare «${nome}»?`}
          onChiudi={chiudi}
          larga
          azioni={
            dati?.ok ? (
              <>
                <button className="btn btn-quieto" onClick={chiudi}>
                  Annulla
                </button>
                <button className="btn btn-pericolo" disabled={lavoro} onClick={() => void conferma()}>
                  {lavoro ? 'Elimino…' : `Elimina ${dati.items.length === 1 ? 'la frase' : `${dati.items.length} frasi`}`}
                </button>
              </>
            ) : (
              <button className="btn btn-quieto" onClick={chiudi}>
                Chiudi
              </button>
            )
          }
        >
          {!dati && <p>Cerco dove viene citato…</p>}
          {dati && !dati.ok && <p className="testo-errore">{dati.reason ?? 'Non riesco a leggere la storia.'}</p>}
          {dati?.ok && (
            <>
              <p>
                Insieme {insieme} vanno via {dati.items.length === 1 ? 'questa frase' : `queste ${dati.items.length} frasi`},
                perché {pronome} citano:
              </p>
              <div className="elenco-frasi">
                {[...gruppi.entries()].map(([cat, voci]) => (
                  <div key={cat} className="elenco-frasi-gruppo">
                    <h3>
                      {CATEGORIE[cat] ?? cat} <span className="elenco-conto">{voci.length}</span>
                    </h3>
                    {voci.map((v, i) => (
                      <div key={i} className="elenco-frasi-voce">
                        <code>{v.preview}</code>
                        {multiFile && <span className="distintivo">{nomeFile(v.span.file)}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <ul className="note-elenco">
                {ha('regola') && <li>Le regole e gli eventi che {pronome} citano vengono tolti per intero.</li>}
                {ha('dialogo') && <li>I dialoghi che {pronome} citano vengono tolti: controlla che nessun nodo resti orfano.</li>}
                {ha('posizione') && <li>Ciò che stava «dentro» o «sopra» resta senza posizione: va rimesso da qualche parte.</li>}
                {ha('partenza') && <li>Era il punto di partenza: la partita comincerà dalla prima stanza.</li>}
                <li>Se nei testi (descrizioni, risposte) compare ancora il suo nome, lì resta scritto.</li>
              </ul>
            </>
          )}
        </Finestra>
      )}
    </>
  )
}
