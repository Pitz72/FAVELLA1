import { useStudio } from '../store'
import type { SidecarStatus } from '../../../shared/protocol'

const STATUS_LABEL: Record<SidecarStatus, string> = {
  starting: 'Motore: avvio…',
  ready: 'Motore pronto',
  crashed: 'Motore in errore',
  restarting: 'Motore: riavvio…',
  stopped: 'Motore fermo'
}

const STATUS_COLOR: Record<SidecarStatus, string> = {
  starting: '#d9a23a',
  ready: '#43b581',
  crashed: '#e25555',
  restarting: '#d9a23a',
  stopped: '#9ca3af'
}

export default function StatusBar(): JSX.Element {
  const status = useStudio((s) => s.sidecarStatus)
  const cursor = useStudio((s) => s.cursor)
  const openFiles = useStudio((s) => s.openFiles)
  const activePath = useStudio((s) => s.activePath)
  const active = openFiles.find((f) => f.path === activePath)
  const dirty = active && active.content !== active.savedContent

  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        <span className="sb-item">
          <span className="dot" style={{ background: STATUS_COLOR[status] }} />
          {STATUS_LABEL[status]}
        </span>
      </div>
      <div className="statusbar-right">
        {active && (
          <>
            <span className="sb-item">{active.language === 'favella' ? 'FAVELLA' : 'Testo'}</span>
            <span className="sb-item">
              Ln {cursor.line}, Col {cursor.column}
            </span>
            <span className="sb-item">{dirty ? '● non salvato' : 'salvato'}</span>
          </>
        )}
      </div>
    </footer>
  )
}
