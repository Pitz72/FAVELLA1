import { useStudio } from '../store'
import type { Diagnostic } from '../../../shared/protocol'
import { IconaAvviso, IconaChiudi, IconaErrore } from './Icone'

function basename(path: string): string {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || path
}

// L'elenco dei problemi del testo. Ogni problema è un pulsante: porta alla riga (anche in
// un file incluso). Una posizione approssimata porta lo stesso alla riga indicata.
export default function ProblemsPanel(): JSX.Element {
  const problems = useStudio((s) => s.problems)
  const compiling = useStudio((s) => s.compiling)
  const requestReveal = useStudio((s) => s.requestReveal)
  const setProblemiAperti = useStudio((s) => s.setProblemiAperti)

  const errori = problems.filter((p) => p.severity === 'error').length
  const avvisi = problems.filter((p) => p.severity === 'warning').length

  const vaiA = (d: Diagnostic): void => {
    requestReveal(d.file, d.line ?? 1, d.col ?? 1)
  }

  return (
    <section className="problemi" aria-label="Problemi del testo">
      <div className="problemi-testa">
        <h2 className="etichetta-sezione">Problemi</h2>
        <span className="problemi-conti">
          {compiling && <span className="problemi-compilo">controllo…</span>}
          <span className={errori ? 'conto conto-errori' : 'conto'}>
            <IconaErrore size={14} /> {errori} {errori === 1 ? 'errore' : 'errori'}
          </span>
          <span className={avvisi ? 'conto conto-avvisi' : 'conto'}>
            <IconaAvviso size={14} /> {avvisi} {avvisi === 1 ? 'avviso' : 'avvisi'}
          </span>
        </span>
        <button className="btn-icona" onClick={() => setProblemiAperti(false)} aria-label="Chiudi i problemi" title="Chiudi">
          <IconaChiudi size={16} />
        </button>
      </div>

      <ul className="problemi-elenco">
        {problems.length === 0 ? (
          <li className="problemi-vuoto">{compiling ? 'Controllo il testo…' : 'Nessun problema: la storia compila.'}</li>
        ) : (
          problems.map((d, i) => (
            <li key={i}>
              <button
                className={'problema problema-' + (d.severity === 'error' ? 'errore' : 'avviso')}
                onClick={() => vaiA(d)}
                title={d.imprecise ? 'Posizione approssimata' : 'Vai alla riga'}
              >
                <span className="problema-segno" aria-label={d.severity === 'error' ? 'Errore' : 'Avviso'}>
                  {d.severity === 'error' ? <IconaErrore size={16} /> : <IconaAvviso size={16} />}
                </span>
                <span className="problema-testo">{d.message.split('\n')[0]}</span>
                <span className="problema-dove">
                  {basename(d.file)}
                  {d.line ? `, riga ${d.line}` : ''}
                  {d.imprecise ? ' (circa)' : ''}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
