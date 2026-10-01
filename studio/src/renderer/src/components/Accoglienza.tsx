import { useMemo } from 'react'
import type { FileNode } from '../../../shared/protocol'
import { useStudio } from '../store'
import logoStudio from '../assets/favella-studio-logo.svg'
import { IconaCartella, IconaPiu } from './Icone'

function fileFav(nodi: FileNode[]): FileNode[] {
  const out: FileNode[] = []
  for (const n of nodi) {
    if (n.type === 'dir') out.push(...fileFav(n.children ?? []))
    else if (n.name.toLowerCase().endsWith('.fav')) out.push(n)
  }
  return out
}

/** Prima schermata: nessun progetto aperto. */
export function Benvenuto(): JSX.Element {
  const openProject = useStudio((s) => s.openProject)
  const newProject = useStudio((s) => s.newProject)
  return (
    <div className="accoglienza">
      <div className="acc-card">
        <img className="acc-logo" src={logoStudio} alt="Favella Studio" width={132} height={132} />
        <h1>Scrivi la tua avventura, in italiano.</h1>
        <p className="acc-sotto">
          In FAVELLA il codice è una frase col punto in fondo: <code>La cucina è una stanza.</code> Qui la scrivi, la
          vedi diventare un mondo, e la provi.
        </p>
        <div className="acc-azioni">
          <button className="btn-grande primario" onClick={() => void newProject()}>
            <IconaPiu size={18} />
            Nuova storia
          </button>
          <button className="btn-grande" onClick={() => void openProject()}>
            <IconaCartella size={18} />
            Apri una cartella
          </button>
        </div>
        <p className="acc-nota">
          Una storia è un file <code>.fav</code> dentro una cartella. Puoi aprire una cartella che ne contiene già.
        </p>
      </div>
    </div>
  )
}

/** Progetto aperto ma nessun file davanti: si sceglie da dove cominciare. */
export function ScegliStoria(): JSX.Element {
  const tree = useStudio((s) => s.tree)
  const openFile = useStudio((s) => s.openFile)
  const newProject = useStudio((s) => s.newProject)
  const file = useMemo(() => fileFav(tree), [tree])
  return (
    <div className="accoglienza">
      <div className="acc-card">
        <h1>Da dove cominci?</h1>
        {file.length === 0 ? (
          <p className="acc-sotto">In questa cartella non c'è ancora nessun file di storia (<code>.fav</code>).</p>
        ) : (
          <>
            <p className="acc-sotto">Scegli un file della storia da aprire.</p>
            <div className="acc-lista">
              {file.map((f) => (
                <button key={f.path} className="acc-file" onClick={() => void openFile(f)}>
                  <span className="acc-file-nome">{f.name}</span>
                  <span className="acc-file-apri">Apri →</span>
                </button>
              ))}
            </div>
          </>
        )}
        <div className="acc-azioni">
          <button className="btn-grande" onClick={() => void newProject()}>
            <IconaPiu size={18} />
            Nuova storia
          </button>
        </div>
      </div>
    </div>
  )
}
