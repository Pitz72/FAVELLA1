import { useStudio } from '../store'

// [Studio 1.2] Studio non si collega a internet da solo senza permesso. La prima volta
// chiede, una volta sola: la risposta si cambia poi dal menu (Applicazione → «Controlla
// da solo a ogni avvio»). Non blocca niente: si può ignorare.
export default function ConsensoAggiornamenti(): JSX.Element | null {
  const auto = useStudio((s) => s.aggiornamentiAuto)
  const rispondi = useStudio((s) => s.rispondiAggiornamentiAuto)
  if (auto !== null) return null
  return (
    <section className="consenso" aria-labelledby="consenso-titolo">
      <h2 id="consenso-titolo">Vuoi sapere quando esce una versione nuova?</h2>
      <p>
        Se dici di sì, a ogni avvio Studio chiede a GitHub qual è l’ultima versione. Non manda niente di tuo. Puoi
        cambiare idea dal menu, in «Applicazione».
      </p>
      <div className="consenso-azioni">
        <button className="btn btn-quieto" onClick={() => void rispondi(false)}>
          No, grazie
        </button>
        <button className="btn btn-primario" onClick={() => void rispondi(true)}>
          Sì, controlla
        </button>
      </div>
    </section>
  )
}
