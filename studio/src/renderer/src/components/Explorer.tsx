import { useState } from 'react'
import type { FileNode } from '../../../shared/protocol'
import { useStudio } from '../store'
import StrutturaStoria from './StrutturaStoria'
import { IconaAggiorna, IconaCartella, IconaChevron, IconaFile, IconaPiu, IconaTesto } from './Icone'

function TreeNode({ node, depth }: { node: FileNode; depth: number }): JSX.Element {
  // Cartelle chiuse all'inizio: i file in cima (le storie) restano in vista.
  const [aperto, setAperto] = useState(false)
  const openFile = useStudio((s) => s.openFile)
  const activePath = useStudio((s) => s.activePath)
  const isFav = node.name.toLowerCase().endsWith('.fav')
  const rientro = { paddingLeft: 10 + depth * 16 }

  if (node.type === 'dir') {
    return (
      <li>
        <button className="albero-riga" style={rientro} onClick={() => setAperto((v) => !v)} aria-expanded={aperto}>
          <IconaChevron size={14} direzione={aperto ? 'giu' : 'destra'} />
          <IconaCartella size={15} />
          <span className="albero-nome">{node.name}</span>
        </button>
        {aperto && node.children && node.children.length > 0 && (
          <ul className="albero-figli">
            {node.children.map((c) => (
              <TreeNode key={c.path} node={c} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  const attivo = activePath === node.path
  return (
    <li>
      <button
        className={'albero-riga file' + (attivo ? ' attiva' : '') + (isFav ? ' fav' : '')}
        style={{ paddingLeft: rientro.paddingLeft + 18 }}
        onClick={() => void openFile(node)}
        aria-current={attivo ? 'true' : undefined}
        title={node.path}
      >
        {isFav ? <IconaTesto size={15} /> : <IconaFile size={15} />}
        <span className="albero-nome">{node.name}</span>
      </button>
    </li>
  )
}

export default function Explorer(): JSX.Element {
  const projectRoot = useStudio((s) => s.projectRoot)
  const tree = useStudio((s) => s.tree)
  const openProject = useStudio((s) => s.openProject)
  const openStory = useStudio((s) => s.openStory)
  const newProject = useStudio((s) => s.newProject)
  const refreshTree = useStudio((s) => s.refreshTree)

  return (
    <aside className="esplora" aria-label="I file del progetto">
      <div className="esplora-testa">
        <span className="etichetta-sezione">Esplora</span>
        <div className="esplora-azioni">
          {projectRoot && (
            <button className="btn-icona" title="Rileggi i file dal disco" aria-label="Rileggi i file" onClick={() => void refreshTree()}>
              <IconaAggiorna />
            </button>
          )}
          <button className="btn-icona" title="Nuova storia…" aria-label="Nuova storia" onClick={() => void newProject()}>
            <IconaPiu />
          </button>
          <button className="btn-icona" title="Apri una storia (.fav)… (Ctrl+O)" aria-label="Apri una storia" onClick={() => void openStory()}>
            <IconaTesto />
          </button>
          <button className="btn-icona" title="Apri una cartella… (Ctrl+Maiusc+O)" aria-label="Apri una cartella" onClick={() => void openProject()}>
            <IconaCartella />
          </button>
        </div>
      </div>
      {projectRoot && (
        <div className="esplora-corpo">
          <StrutturaStoria />
          <div className="esplora-radice" title={projectRoot}>
            <IconaCartella size={14} />
            {projectRoot.split(/[\\/]/).pop()}
          </div>
          <ul className="albero">
            {tree.map((n) => (
              <TreeNode key={n.path} node={n} depth={0} />
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
