import { useStudio } from '../store'
import type { SidecarStatus } from '../../../shared/protocol'
import { sezioneDi } from '../sezioni'
import { IconaAvviso, IconaErrore } from './Icone'

const STATUS_LABEL: Record<SidecarStatus, string> = {
  starting: 'Motore: avvio…',
  ready: 'Motore pronto',
  crashed: 'Motore in errore',
  restarting: 'Motore: riavvio…',
  stopped: 'Motore fermo'
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
  const zoom = useStudio((s) => s.zoom)
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
    <footer className="stato">
      <div className="stato-sinistra">
        <span className={'stato-motore stato-' + status} title="Il motore FAVELLA che compila e fa girare la storia">
          <span className="stato-punto" aria-hidden="true" />
          {STATUS_LABEL[status]}
        </span>
        {isFav && (
          <button
            className={'stato-problemi' + (errori ? ' ha-errori' : avvisi ? ' ha-avvisi' : '')}
            onClick={apriProblemi}
            title="Mostra o nascondi l'elenco dei problemi del testo"
            aria-pressed={inStoria && problemiAperti}
          >
            {errori === 0 && avvisi === 0 ? (
              'Nessun problema'
            ) : (
              <>
                {errori > 0 && (
                  <span>
                    <IconaErrore size={14} /> {errori} {errori === 1 ? 'errore' : 'errori'}
                  </span>
                )}
                {avvisi > 0 && (
                  <span>
                    <IconaAvviso size={14} /> {avvisi} {avvisi === 1 ? 'avviso' : 'avvisi'}
                  </span>
                )}
              </>
            )}
          </button>
        )}
      </div>
      <div className="stato-destra">
        {active && inStoria && (
          <span>
            Riga {cursor.line}, colonna {cursor.column}
          </span>
        )}
        <span title="La grandezza dell’interfaccia (Ctrl + / Ctrl − / Ctrl 0)">{Math.round(zoom * 100)}%</span>
      </div>
    </footer>
  )
}
