import { useStudio } from '../store'
import UsciteStanza, { DirezioneSelect } from './UsciteStanza'
import Finestra from './Finestra'
import { IconaChiudi, IconaCestino, IconaStanza } from './Icone'

// Le due finestre della Mappa per cambiare le uscite senza lasciarla: una per la
// connessione fra due stanze (clic su una freccia), una per tutte le uscite di una stanza
// (clic sulla stanza). Fanno le stesse cose del pannello Stanze: sono lo stesso editor.

/** Una connessione fra due stanze: la direzione vista da A, o via la connessione. */
export function ConnessioneStanze({
  aId,
  bId,
  onChiudi
}: {
  aId: string
  bId: string
  onChiudi: () => void
}): JSX.Element | null {
  const outline = useStudio((s) => s.outline)
  const cambiaUscita = useStudio((s) => s.cambiaUscita)
  const eliminaUscita = useStudio((s) => s.eliminaUscita)
  const a = outline?.rooms.find((r) => r.id === aId)
  const b = outline?.rooms.find((r) => r.id === bId)
  if (!outline || !a || !b) return null
  // Le uscite di A che portano a B (di solito una) e, a rovescio, quelle di B verso A.
  const daA = a.exits.filter((e) => e.to === b.id)
  const daB = b.exits.filter((e) => e.to === a.id)

  return (
    <Finestra
      titolo="Il collegamento"
      sottotitolo={`${a.name} ⇄ ${b.name}`}
      onChiudi={onChiudi}
      azioni={
        <button className="btn btn-primario" onClick={onChiudi}>
          Fatto
        </button>
      }
    >
      {daA.length === 0 && <p className="nota-riquadro">Non trovo l’uscita: ricarica la mappa.</p>}
      {daA.map((e, i) => (
        <div key={i} className="uscita-riga">
          <span className="uscita-da">Da {a.name}, verso</span>
          <DirezioneSelect
            valore={e.direction}
            direzioni={outline.directions}
            usate={a.exits.map((x) => x.direction)}
            onScegli={(direzione, opposta) => void cambiaUscita({ daId: a.id, uscita: e, direzione, opposta })}
          />
          <span className="uscita-freccia" aria-hidden="true">
            →
          </span>
          <span className="uscita-meta">{b.name}</span>
          <button
            className="btn btn-pericolo btn-piccolo"
            title="Toglie il collegamento, anche il ritorno"
            disabled={!e.span}
            onClick={() => {
              void eliminaUscita(e)
              onChiudi()
            }}
          >
            <IconaCestino />
            Togli
          </button>
        </div>
      ))}
      {daB.length > 0 && (
        <p className="aiuto">
          Da {b.name} si torna verso {daB.map((e) => e.direction).join(', ')}: il ritorno si aggiorna da solo.
        </p>
      )}
    </Finestra>
  )
}

/** La scheda che compare sulla Mappa quando si clicca una stanza: le sue uscite, modificabili. */
export function SchedaStanzaMappa({ id, onChiudi }: { id: string; onChiudi: () => void }): JSX.Element | null {
  const outline = useStudio((s) => s.outline)
  const setRightTab = useStudio((s) => s.setRightTab)
  const richiediSelezione = useStudio((s) => s.richiediSelezione)
  const stanza = outline?.rooms.find((r) => r.id === id)
  if (!outline || !stanza) return null
  return (
    <aside className="scheda-mappa" aria-label={`Le uscite di ${stanza.name}`}>
      <div className="scheda-mappa-testa">
        <IconaStanza size={18} />
        <h2>{stanza.name}</h2>
        <button className="btn-icona" aria-label="Chiudi la scheda" title="Chiudi" onClick={onChiudi}>
          <IconaChiudi />
        </button>
      </div>
      <div className="scheda-mappa-corpo">
        <UsciteStanza stanzaId={stanza.id} />
        <button
          className="btn btn-quieto"
          onClick={() => {
            // Si apre il pannello Stanze GIÀ sulla stanza giusta (prima si apriva vuoto).
            richiediSelezione('stanza', stanza.id)
            setRightTab('stanze')
          }}
        >
          Apri la scheda della stanza
        </button>
      </div>
    </aside>
  )
}
