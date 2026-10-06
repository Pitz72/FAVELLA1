import { useStudio } from '../store'
import Finestra from './Finestra'

/**
 * La guardia «modifiche non salvate»: Salva / Non salvare / Annulla. Restituisce la
 * scelta tramite la promessa di `askUnsaved` nello store. Esc = Annulla.
 */
export default function UnsavedDialog(): JSX.Element | null {
  const prompt = useStudio((s) => s.unsavedPrompt)
  const resolveUnsaved = useStudio((s) => s.resolveUnsaved)
  if (!prompt) return null

  const { names } = prompt
  const titolo = names.length === 1 ? `Salvare «${names[0]}»?` : `Salvare ${names.length} file?`

  return (
    <Finestra
      titolo={titolo}
      sottotitolo="Ci sono modifiche che non hai ancora salvato. Se non le salvi, vanno perse."
      onChiudi={() => resolveUnsaved('cancel')}
      azioni={
        <>
          <button className="btn btn-quieto" onClick={() => resolveUnsaved('cancel')}>
            Annulla
          </button>
          <button className="btn btn-pericolo" onClick={() => resolveUnsaved('discard')}>
            Non salvare
          </button>
          <button className="btn btn-primario" onClick={() => resolveUnsaved('save')}>
            Salva
          </button>
        </>
      }
    >
      {names.length > 1 && (
        <ul className="elenco-file">
          {names.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </Finestra>
  )
}
