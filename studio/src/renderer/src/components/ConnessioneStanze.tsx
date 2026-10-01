import { useStudio } from '../store'
import UsciteStanza, { DirezioneSelect } from './UsciteStanza'

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
    <div className="modal-backdrop" onClick={onChiudi}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Connessione</h2>
        <p className="modal-body">
          <b>{a.name}</b> ⇄ <b>{b.name}</b>
        </p>
        {daA.length === 0 && <p className="insp-none">Non trovo l’uscita: ricarica la mappa.</p>}
        {daA.map((e, i) => (
          <div key={i} className="uscita-riga">
            <span className="var-note">Da {a.name}:</span>
            <DirezioneSelect
              valore={e.direction}
              direzioni={outline.directions}
              usate={a.exits.map((x) => x.direction)}
              onScegli={(direzione, opposta) => void cambiaUscita({ daId: a.id, uscita: e, direzione, opposta })}
            />
            <span className="uscita-freccia" aria-hidden="true">
              →
            </span>
            <span>{b.name}</span>
            <button
              className="modal-btn danger"
              title="Toglie la connessione, anche il ritorno"
              disabled={!e.span}
              onClick={() => {
                void eliminaUscita(e)
                onChiudi()
              }}
            >
              Elimina
            </button>
          </div>
        ))}
        {daB.length > 0 && (
          <p className="var-note">
            Dall’altra parte, da {b.name} si va a {daB.map((e) => e.direction).join(', ')}: il ritorno si
            aggiorna da solo.
          </p>
        )}
        <div className="modal-actions">
          <button className="modal-btn primary" onClick={onChiudi}>
            Fatto
          </button>
        </div>
      </div>
    </div>
  )
}

/** La scheda che compare sulla Mappa quando si clicca una stanza: le sue uscite, modificabili. */
export function SchedaStanzaMappa({ id, onChiudi }: { id: string; onChiudi: () => void }): JSX.Element | null {
  const outline = useStudio((s) => s.outline)
  const setRightTab = useStudio((s) => s.setRightTab)
  const stanza = outline?.rooms.find((r) => r.id === id)
  if (!outline || !stanza) return null
  return (
    <aside className="scheda-mappa" aria-label={`Uscite di ${stanza.name}`}>
      <div className="scheda-mappa-testa">
        <strong>{stanza.name}</strong>
        <button className="icon-btn" title="Chiudi" onClick={onChiudi}>
          ✕
        </button>
      </div>
      <div className="scheda-mappa-corpo">
        <UsciteStanza stanzaId={stanza.id} />
        <button className="modal-btn ghost objed-save" onClick={() => setRightTab('stanze')}>
          Apri la scheda della stanza →
        </button>
      </div>
    </aside>
  )
}
