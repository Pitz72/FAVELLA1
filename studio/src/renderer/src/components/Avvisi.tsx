import { useStudio } from '../store'

// [Studio 1.2] Gli avvisi in basso a destra. Un avviso può avere un'azione («Annulla»,
// «Vedi»); si chiude da solo o con la ×. La regione è annunciata dai lettori di schermo
// (aria-live «polite»; gli errori «assertive»).
export default function Avvisi(): JSX.Element {
  const avvisi = useStudio((s) => s.avvisi)
  const togli = useStudio((s) => s.togliAvviso)
  return (
    <div className="avvisi" aria-live="polite" aria-relevant="additions">
      {avvisi.map((a) => (
        <div key={a.id} className={'avviso avviso-' + a.tipo} role={a.tipo === 'errore' ? 'alert' : 'status'}>
          <span className="avviso-segno" aria-hidden="true" />
          <span className="avviso-testo">{a.testo}</span>
          {a.azione && (
            <button
              className="avviso-azione"
              onClick={() => {
                a.azione!.esegui()
                togli(a.id)
              }}
            >
              {a.azione.etichetta}
            </button>
          )}
          <button className="avviso-x" onClick={() => togli(a.id)} aria-label="Chiudi l’avviso" title="Chiudi">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
