import { useEffect } from 'react'
import { useStudio } from '../store'

export default function UpdateDialog(): JSX.Element | null {
  const status = useStudio((s) => s.updaterStatus)
  const open = useStudio((s) => s.updateModalOpen)
  const setOpen = useStudio((s) => s.setUpdateModalOpen)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null

  const handleDownload = (): void => {
    void window.favella.downloadUpdate()
  }

  const handleInstall = (): void => {
    void window.favella.installUpdate()
  }

  const handleCheck = (): void => {
    void window.favella.checkForUpdates(true)
  }

  const chiudi = (): void => {
    setOpen(false)
  }

  return (
    <div className="modal-backdrop" onClick={chiudi}>
      <div
        className="modal update-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {status.type === 'checking' && (
          <>
            <h2 className="modal-title">Controllo aggiornamenti</h2>
            <p className="modal-body">
              Verifica della disponibilità di nuove versioni su GitHub in corso…
            </p>
            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={chiudi}>
                Annulla
              </button>
            </div>
          </>
        )}

        {status.type === 'not-available' && (
          <>
            <h2 className="modal-title">Nessun aggiornamento</h2>
            <p className="modal-body">
              Favella Studio è già aggiornato alla versione più recente (v{status.currentVersion}).
            </p>
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={chiudi}>
                OK
              </button>
            </div>
          </>
        )}

        {status.type === 'available' && (
          <>
            <h2 className="modal-title">Aggiornamento disponibile</h2>
            <div className="update-version-row">
              <span className="update-version-tag">Nuova versione: v{status.version}</span>
              <span className="update-current-tag">(versione attuale: v{status.currentVersion})</span>
            </div>

            {status.releaseNotes ? (
              <div className="update-notes-container">
                <div className="update-notes-title">Novità della versione:</div>
                <div className="update-notes-content">{status.releaseNotes}</div>
              </div>
            ) : (
              <p className="modal-body">
                È disponibile una nuova versione di Favella Studio.
              </p>
            )}

            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={chiudi}>
                Più tardi
              </button>
              <button className="modal-btn primary" onClick={handleDownload}>
                Scarica e aggiorna
              </button>
            </div>
          </>
        )}

        {status.type === 'downloading' && (
          <>
            <h2 className="modal-title">Download in corso…</h2>
            <p className="modal-body">
              Download della versione v{status.version} di Favella Studio.
            </p>
            <div className="update-progress-wrap">
              <div className="update-progress-track">
                <div
                  className="update-progress-bar"
                  style={{ width: `${Math.min(100, Math.max(0, status.percent))}%` }}
                />
              </div>
              <div className="update-progress-meta">
                <span>
                  {(status.transferred / (1024 * 1024)).toFixed(1)} MB di{' '}
                  {(status.total / (1024 * 1024)).toFixed(1)} MB
                </span>
                <span className="update-progress-pct">{status.percent}%</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={chiudi}>
                Nascondi in background
              </button>
            </div>
          </>
        )}

        {status.type === 'ready' && (
          <>
            <h2 className="modal-title">Aggiornamento pronto</h2>
            <p className="modal-body">
              La versione v{status.version} è stata scaricata con successo.
              <br />
              {status.canAutoInstall ? (
                <span className="modal-hint">
                  Riavvia l'applicazione per applicare l'aggiornamento. Le modifiche non salvate
                  ti verranno richieste prima della chiusura.
                </span>
              ) : (
                <span className="modal-hint">
                  L'eseguibile è pronto nella cartella temporanea: {status.installerPath}
                </span>
              )}
            </p>
            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={chiudi}>
                Più tardi
              </button>
              {status.canAutoInstall ? (
                <button className="modal-btn primary" onClick={handleInstall}>
                  Riavvia e installa ora
                </button>
              ) : (
                <button className="modal-btn primary" onClick={chiudi}>
                  Chiudi
                </button>
              )}
            </div>
          </>
        )}

        {status.type === 'error' && (
          <>
            <h2 className="modal-title">Errore di aggiornamento</h2>
            <p className="modal-body update-error-msg">{status.message}</p>
            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={chiudi}>
                Chiudi
              </button>
              <button className="modal-btn primary" onClick={handleCheck}>
                Riprova
              </button>
            </div>
          </>
        )}

        {status.type === 'idle' && (
          <>
            <h2 className="modal-title">Aggiornamenti</h2>
            <p className="modal-body">Nessuna operazione in corso.</p>
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleCheck}>
                Controlla aggiornamenti
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
