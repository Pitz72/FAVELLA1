import { useEffect } from 'react'
import { useStudio } from '../store'

/**
 * Modal integrato nello stile dell'IDE per la guardia «modifiche non salvate».
 * Sostituisce il dialogo nativo di Windows. Restituisce la scelta dell'utente
 * (Salva / Non salvare / Annulla) tramite la promessa di `askUnsaved` nello store.
 */
export default function UnsavedDialog(): JSX.Element | null {
  const prompt = useStudio((s) => s.unsavedPrompt)
  const resolveUnsaved = useStudio((s) => s.resolveUnsaved)

  // Scorciatoie da tastiera: Esc = Annulla, Invio = Salva.
  useEffect(() => {
    if (!prompt) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        resolveUnsaved('cancel')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        resolveUnsaved('save')
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [prompt, resolveUnsaved])

  if (!prompt) return null

  const { names } = prompt
  const titolo =
    names.length === 1 ? `«${names[0]}»` : `${names.length} file con modifiche non salvate`

  return (
    <div className="modal-backdrop" onClick={() => resolveUnsaved('cancel')}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Modifiche non salvate</h2>
        <p className="modal-body">
          Salvare le modifiche a {titolo}?
          <br />
          <span className="modal-hint">Se non salvi, le modifiche andranno perse.</span>
        </p>
        {names.length > 1 && (
          <ul className="modal-list">
            {names.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <div className="modal-actions">
          <button className="modal-btn ghost" onClick={() => resolveUnsaved('cancel')}>
            Annulla
          </button>
          <button className="modal-btn danger" onClick={() => resolveUnsaved('discard')}>
            Non salvare
          </button>
          <button className="modal-btn primary" onClick={() => resolveUnsaved('save')} autoFocus>
            Salva
          </button>
        </div>
      </div>
    </div>
  )
}
