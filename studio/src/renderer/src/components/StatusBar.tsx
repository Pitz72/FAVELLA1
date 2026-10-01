import { useStudio } from '../store'
import type { SidecarStatus } from '../../../shared/protocol'
import { sezioneDi } from '../sezioni'

const STATUS_LABEL: Record<SidecarStatus, string> = {
  starting: 'Motore: avvio…',
  ready: 'Motore pronto',
  crashed: 'Motore in errore',
  restarting: 'Motore: riavvio…',
  stopped: 'Motore fermo'
}

const STATUS_COLOR: Record<SidecarStatus, string> = {
  starting: 'var(--warn)',
  ready: 'var(--ok)',
  crashed: 'var(--err)',
  restarting: 'var(--warn)',
  stopped: 'var(--text-dim)'
}

export default function StatusBar(): JSX.Element {
  const status = useStudio((s) => s.sidecarStatus)
  const cursor = useStudio((s) => s.cursor)
  const openFiles = useStudio((s) => s.openFiles)
  const activePath = useStudio((s) => s.activePath)
  const problems = useStudio((s) => s.problems)
  const problemiAperti = useStudio((s) => s.problemiAperti)
  const setProblemiAperti = useStudio((s) => s.setProblemiAperti)
  const rightTab = useStudio((s) => s.rightTab)
  const setSezione = useStudio((s) => s.setSezione)
  const active = openFiles.find((f) => f.path === activePath)
  const isFav = !!active && active.name.toLowerCase().endsWith('.fav')
  const errori = problems.filter((p) => p.severity === 'error').length
  const avvisi = problems.filter((p) => p.severity === 'warning').length
  const inStoria = sezioneDi(rightTab) === 'storia'

  // I problemi si leggono nella Storia (dove stanno le righe da correggere).
  const apriProblemi = (): void => {
    if (!inStoria) setSezione('storia')
    setProblemiAperti(inStoria ? !problemiAperti : true)
  }

  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        <span className="sb-item" title="Il motore FAVELLA che compila e fa girare la storia">
          <span className="dot" style={{ background: STATUS_COLOR[status] }} />
          {STATUS_LABEL[status]}
        </span>
        {isFav && (
          <button
            className={'sb-problemi' + (errori ? ' ha-errori' : avvisi ? ' ha-avvisi' : '')}
            onClick={apriProblemi}
            title="Mostra o nascondi l'elenco dei problemi del testo"
            aria-pressed={inStoria && problemiAperti}
          >
            {errori === 0 && avvisi === 0
              ? 'Nessun problema'
              : [errori ? `${errori} ${errori === 1 ? 'errore' : 'errori'}` : '', avvisi ? `${avvisi} ${avvisi === 1 ? 'avviso' : 'avvisi'}` : '']
                  .filter(Boolean)
                  .join(' · ')}
          </button>
        )}
      </div>
      <div className="statusbar-right">
        {active && inStoria && (
          <span className="sb-item">
            Riga {cursor.line}, colonna {cursor.column}
          </span>
        )}
      </div>
    </footer>
  )
}
