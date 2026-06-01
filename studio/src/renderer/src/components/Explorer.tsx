import { useState } from 'react'
import type { FileNode } from '../../../shared/protocol'
import { useStudio } from '../store'

function TreeNode({ node, depth }: { node: FileNode; depth: number }): JSX.Element {
  const [aperto, setAperto] = useState(depth < 1)
  const openFile = useStudio((s) => s.openFile)
  const activePath = useStudio((s) => s.activePath)
  const isFav = node.name.toLowerCase().endsWith('.fav')

  if (node.type === 'dir') {
    return (
      <div>
        <div
          className="tree-row"
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => setAperto((v) => !v)}
        >
          <span className="tree-twisty">{aperto ? '▾' : '▸'}</span>
          <span className="tree-icon">📁</span>
          <span className="tree-label">{node.name}</span>
        </div>
        {aperto &&
          node.children?.map((c) => <TreeNode key={c.path} node={c} depth={depth + 1} />)}
      </div>
    )
  }

  return (
    <div
      className={`tree-row file ${activePath === node.path ? 'active' : ''}`}
      style={{ paddingLeft: 8 + depth * 14 + 14 }}
      onClick={() => openFile(node)}
      title={node.path}
    >
      <span className={`tree-icon ${isFav ? 'fav' : ''}`}>{isFav ? '✦' : '·'}</span>
      <span className={`tree-label ${isFav ? 'fav' : ''}`}>{node.name}</span>
    </div>
  )
}

export default function Explorer(): JSX.Element {
  const projectRoot = useStudio((s) => s.projectRoot)
  const tree = useStudio((s) => s.tree)
  const openProject = useStudio((s) => s.openProject)
  const refreshTree = useStudio((s) => s.refreshTree)

  return (
    <aside className="explorer">
      <div className="panel-header">
        <span>Esplora</span>
        <div className="panel-actions">
          {projectRoot && (
            <button className="icon-btn" title="Aggiorna" onClick={refreshTree}>
              ⟳
            </button>
          )}
          <button className="icon-btn" title="Apri cartella" onClick={openProject}>
            🗁
          </button>
        </div>
      </div>
      {!projectRoot ? (
        <div className="explorer-empty">
          <p>Nessun progetto aperto.</p>
          <button onClick={openProject}>Apri cartella…</button>
        </div>
      ) : (
        <div className="tree">
          <div className="tree-root" title={projectRoot}>
            {projectRoot.split(/[\\/]/).pop()}
          </div>
          {tree.map((n) => (
            <TreeNode key={n.path} node={n} depth={0} />
          ))}
        </div>
      )}
    </aside>
  )
}
