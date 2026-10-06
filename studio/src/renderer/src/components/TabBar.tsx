import { useStudio } from '../store'
import { IconaChiudi } from './Icone'

// Le schede dei file aperti: un elenco di schede vere (role=tablist), raggiungibili da
// tastiera (frecce sinistra/destra, Invio; Canc chiude). Il pallino dice «da salvare».
export default function TabBar(): JSX.Element | null {
  const openFiles = useStudio((s) => s.openFiles)
  const activePath = useStudio((s) => s.activePath)
  const setActive = useStudio((s) => s.setActive)
  const closeFile = useStudio((s) => s.closeFile)
  const saveFile = useStudio((s) => s.saveFile)
  const askUnsaved = useStudio((s) => s.askUnsaved)

  if (openFiles.length === 0) return null

  // Chiusura guardata: se la scheda ha modifiche non salvate, si chiede prima.
  const chiudiScheda = async (path: string, name: string, dirty: boolean): Promise<void> => {
    if (dirty) {
      const scelta = await askUnsaved([name])
      if (scelta === 'cancel') return
      if (scelta === 'save' && !(await saveFile(path))) return
    }
    closeFile(path)
  }

  const muovi = (i: number): void => {
    const f = openFiles[(i + openFiles.length) % openFiles.length]
    setActive(f.path)
    requestAnimationFrame(() => document.getElementById('scheda-' + btoa(encodeURIComponent(f.path)))?.focus())
  }

  return (
    <div className="file-schede" role="tablist" aria-label="File aperti">
      {openFiles.map((f, i) => {
        const dirty = f.content !== f.savedContent
        const attiva = activePath === f.path
        return (
          <div key={f.path} className={'file-scheda' + (attiva ? ' attiva' : '') + (dirty ? ' da-salvare' : '')}>
            <button
              id={'scheda-' + btoa(encodeURIComponent(f.path))}
              role="tab"
              aria-selected={attiva}
              tabIndex={attiva ? 0 : -1}
              className="file-scheda-nome"
              onClick={() => setActive(f.path)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') muovi(i + 1)
                else if (e.key === 'ArrowLeft') muovi(i - 1)
                else if (e.key === 'Delete') void chiudiScheda(f.path, f.name, dirty)
              }}
              title={f.path + (dirty ? ' — da salvare' : '')}
            >
              <span className={f.name.toLowerCase().endsWith('.fav') ? 'nome-fav' : ''}>{f.name}</span>
              {dirty && (
                <span className="file-scheda-pallino" aria-label="da salvare">
                  ●
                </span>
              )}
            </button>
            <button
              className="file-scheda-x"
              tabIndex={-1}
              onClick={() => void chiudiScheda(f.path, f.name, dirty)}
              aria-label={`Chiudi ${f.name}`}
              title="Chiudi"
            >
              <IconaChiudi size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
