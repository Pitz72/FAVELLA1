import { useStudio } from '../store'

export default function TabBar(): JSX.Element | null {
  const openFiles = useStudio((s) => s.openFiles)
  const activePath = useStudio((s) => s.activePath)
  const setActive = useStudio((s) => s.setActive)
  const closeFile = useStudio((s) => s.closeFile)
  const saveFile = useStudio((s) => s.saveFile)
  const askUnsaved = useStudio((s) => s.askUnsaved)

  if (openFiles.length === 0) return null

  // Chiusura guardata: se la scheda ha modifiche non salvate, chiedi conferma
  // (modal integrato Salva/Non salvare/Annulla) prima di scartare il buffer.
  const chiudiScheda = async (path: string, name: string, dirty: boolean): Promise<void> => {
    if (dirty) {
      const scelta = await askUnsaved([name])
      if (scelta === 'cancel') return
      if (scelta === 'save') await saveFile(path)
    }
    closeFile(path)
  }

  return (
    <div className="tabbar">
      {openFiles.map((f) => {
        const dirty = f.content !== f.savedContent
        return (
          <div
            key={f.path}
            className={`tab ${activePath === f.path ? 'active' : ''}`}
            onClick={() => setActive(f.path)}
            title={f.path}
          >
            <span className={`tab-name ${f.name.toLowerCase().endsWith('.fav') ? 'fav' : ''}`}>
              {f.name}
            </span>
            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation()
                void chiudiScheda(f.path, f.name, dirty)
              }}
            >
              {dirty ? '●' : '×'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
