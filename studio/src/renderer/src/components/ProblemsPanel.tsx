import { useStudio, stessoPercorso } from '../store'
import type { Diagnostic } from '../../../shared/protocol'

function basename(path: string): string {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || path
}

export default function ProblemsPanel(): JSX.Element {
  const problems = useStudio((s) => s.problems)
  const problemsFile = useStudio((s) => s.problemsFile)
  const compiling = useStudio((s) => s.compiling)
  const openFiles = useStudio((s) => s.openFiles)
  const setActive = useStudio((s) => s.setActive)
  const requestReveal = useStudio((s) => s.requestReveal)

  const errori = problems.filter((p) => p.severity === 'error').length
  const avvisi = problems.filter((p) => p.severity === 'warning').length

  const vaiA = (d: Diagnostic): void => {
    // Porta a fuoco la scheda del file (se aperta) e chiede il salto al cursore.
    const aperto = openFiles.find((f) => stessoPercorso(f.path, d.file))
    if (aperto) setActive(aperto.path)
    if (!d.imprecise && d.line) requestReveal(d.file, d.line, d.col ?? 1)
  }

  return (
    <div className="problems">
      <div className="panel-header">
        <span>
          Problemi
          {problemsFile && <span className="problems-file"> · {basename(problemsFile)}</span>}
        </span>
        <span className="problems-counts">
          {compiling && <span className="problems-compiling">compilo…</span>}
          <span className={errori ? 'count-err' : 'count-zero'}>⊘ {errori}</span>
          <span className={avvisi ? 'count-warn' : 'count-zero'}>△ {avvisi}</span>
        </span>
      </div>

      <div className="problems-list">
        {problems.length === 0 ? (
          <div className="problems-empty">
            {compiling ? 'Compilazione in corso…' : 'Nessun problema rilevato.'}
          </div>
        ) : (
          problems.map((d, i) => (
            <div
              key={i}
              className={`problem-row ${d.severity} ${d.imprecise ? 'imprecise' : 'clickable'}`}
              onClick={() => vaiA(d)}
              title={d.imprecise ? 'Posizione approssimata (nessun salto preciso)' : 'Vai alla riga'}
            >
              <span className={`problem-icon ${d.severity}`}>
                {d.severity === 'error' ? '⊘' : '△'}
              </span>
              <span className="problem-msg">{d.message.split('\n')[0]}</span>
              <span className="problem-loc">
                {basename(d.file)}
                {d.line ? `:${d.line}${d.col ? ':' + d.col : ''}` : ''}
                {d.imprecise ? ' ~' : ''}
              </span>
              {d.code && <span className="problem-code">{d.code}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
