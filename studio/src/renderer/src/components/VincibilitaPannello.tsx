import type { WorldWinnability, WinnabilityEsito } from '../../../shared/protocol'
import { IconaChiudi, IconaAggiorna } from './Icone'

// [1.6.0] Il «grafo di vincibilità» reso come pannello sopra la mappa: una VISTA del
// .fav (non lo modifica). Dice se la storia si può vincere, che cosa serve per vincere,
// e segnala le stanze irraggiungibili, gli oggetti orfani, le regole che non scattano
// mai e le scorte che non bastano. Il differenziante: nessun altro editor ce l'ha.

const ESITO: Record<WinnabilityEsito, { testo: string; classe: string }> = {
  'vincibile-staticamente': { testo: 'La storia si può vincere.', classe: 'vinc-ok' },
  'ostruzione-possibile': {
    testo: 'Forse non si vince: un requisito sembra irraggiungibile.',
    classe: 'vinc-attenzione'
  },
  'nessuna-vittoria': { testo: 'Nessun finale di vittoria: così la storia non si vince.', classe: 'vinc-male' }
}

export default function VincibilitaPannello({
  dati,
  nomeStanza,
  onChiudi,
  onRicarica
}: {
  dati: WorldWinnability | null
  nomeStanza: (id: string) => string
  onChiudi: () => void
  onRicarica: () => void
}): JSX.Element {
  const report = dati?.report ?? null
  return (
    <aside className="mappa-vincibilita" aria-label="Si può vincere?">
      <div className="mappa-vinc-testa">
        <h2>Si può vincere?</h2>
        <button className="btn-icona" aria-label="Rianalizza" title="Rianalizza" onClick={onRicarica}>
          <IconaAggiorna size={16} />
        </button>
        <button className="btn-icona" aria-label="Chiudi" title="Chiudi" onClick={onChiudi}>
          <IconaChiudi size={16} />
        </button>
      </div>

      {!dati ? (
        <p className="aiuto">Analizzo la storia…</p>
      ) : !dati.ok ? (
        <p className="nota-riquadro">
          {dati.errors?.[0]?.message ?? 'La storia non compila: correggi gli errori per vedere la vincibilità.'}
        </p>
      ) : !report ? (
        <p className="nota-riquadro">Niente da analizzare.</p>
      ) : (
        <div className="mappa-vinc-corpo">
          <p className={'vinc-esito ' + (ESITO[report.vittoria.esito]?.classe ?? '')}>
            {ESITO[report.vittoria.esito]?.testo ?? report.vittoria.esito}
          </p>

          {/* Per vincere serve… (le sorgenti di vittoria e i loro requisiti bloccanti). */}
          {report.vittoria.sorgenti.length > 0 && (
            <section className="vinc-sez">
              <h3>Per vincere</h3>
              {report.vittoria.sorgenti.map((s, i) => (
                <div key={i} className="vinc-via">
                  <div className="vinc-via-testa">
                    {s.comando ? <code>{s.comando}</code> : <span>{s.contesto}</span>}
                  </div>
                  {s.condizione && <div className="vinc-cond">serve: {s.condizione}</div>}
                  {s.bloccanti.length > 0 && (
                    <ul className="vinc-blocchi">
                      {s.bloccanti.map((b, j) => (
                        <li key={j} title="Né vero all’avvio né producibile da una conseguenza">
                          manca: {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          <Gruppo titolo="Stanze irraggiungibili" vuoto="tutte raggiungibili">
            {dati.unreachableRooms.map((id) => (
              <span key={id} className="vinc-chip vinc-chip-male">
                {nomeStanza(id)}
              </span>
            ))}
          </Gruppo>

          <Gruppo titolo="Oggetti orfani" aiuto="mai collocati: il giocatore non li troverà" vuoto="nessuno">
            {dati.orphanObjects.map((id) => (
              <span key={id} className="vinc-chip vinc-chip-male">
                {id}
              </span>
            ))}
          </Gruppo>

          {report.regole_irraggiungibili.length > 0 && (
            <section className="vinc-sez">
              <h3>Regole che non scattano mai</h3>
              <ul className="vinc-elenco">
                {report.regole_irraggiungibili.map((r, i) => (
                  <li key={i}>
                    <code>{r.comando}</code> — serve «{r.atomi_mai_soddisfacibili.join(', ')}», mai soddisfacibile
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.scorte.length > 0 && (
            <section className="vinc-sez">
              <h3>Scorte che non bastano</h3>
              <ul className="vinc-elenco">
                {report.scorte.map((s, i) => (
                  <li key={i}>
                    {s.dove}: «{s.requisito}» — {s.perche}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="aiuto vinc-nota">
            Analisi statica (non gioca la storia): segnala le ostruzioni probabili, non le garantisce.
          </p>
        </div>
      )}
    </aside>
  )
}

// Un gruppo di chip con un titolo; mostra il testo «vuoto» quando non ha figli.
function Gruppo({
  titolo,
  aiuto,
  vuoto,
  children
}: {
  titolo: string
  aiuto?: string
  vuoto: string
  children: React.ReactNode
}): JSX.Element {
  const arr = Array.isArray(children) ? children : [children]
  const pieni = arr.filter(Boolean)
  return (
    <section className="vinc-sez">
      <h3 title={aiuto}>{titolo}</h3>
      {pieni.length === 0 ? <p className="aiuto">{vuoto}</p> : <div className="vinc-chips">{pieni}</div>}
    </section>
  )
}
