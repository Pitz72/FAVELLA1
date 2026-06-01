import { useStudio } from '../store'

export default function TabBar(): JSX.Element | null {
  const openFiles = useStudio((s) => s.openFiles)
  const activePath = useStudio((s) => s.activePath)
  const setActive = useStudio((s) => s.setActive)
  const closeFile = useStudio((s) => s.closeFile)

  if (openFiles.length === 0) return null

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
                closeFile(f.path)
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
