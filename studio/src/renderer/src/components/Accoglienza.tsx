import { useMemo } from 'react'
import type { FileNode } from '../../../shared/protocol'
import { useStudio } from '../store'
import logoStudio from '../assets/favella-studio-logo.svg'
import { chiave } from '../utils/progetto'
import { IconaAiuto, IconaCartella, IconaPiu, IconaStanza, IconaTesto } from './Icone'

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
  const openStory = useStudio((s) => s.openStory)
  const newProject = useStudio((s) => s.newProject)
  const openExample = useStudio((s) => s.openExample)
  const openGuide = useStudio((s) => s.openGuide)
  return (
    <main className="accoglienza" id="area-principale" tabIndex={-1}>
      <div className="accoglienza-carta">
        <img className="accoglienza-logo" src={logoStudio} alt="" width={112} height={112} />
        <p className="accoglienza-occhiello">Favella Studio</p>
        <h1>Scrivi la tua avventura, in italiano.</h1>
        <p className="accoglienza-sotto">
          In FAVELLA il codice è una frase col punto in fondo: <code>La cucina è una stanza.</code> Qui la scrivi,
          la vedi diventare un mondo e la provi.
        </p>
        <div className="accoglienza-azioni">
          <button className="btn btn-grande btn-primario" onClick={() => void newProject()}>
            <IconaPiu size={18} />
            Nuova storia
          </button>
          <button className="btn btn-grande" onClick={() => void openStory()}>
            <IconaTesto size={18} />
            Apri una storia
          </button>
          <button className="btn btn-grande btn-quieto" onClick={() => void openProject()}>
            <IconaCartella size={18} />
            Apri una cartella
          </button>
        </div>
        <p className="accoglienza-nota">
          Una storia è un file <code>.fav</code> dentro una cartella; quando cresce, puoi dividerla in più file.
          <br />
          <kbd>Ctrl</kbd>+<kbd>O</kbd> apre una storia, <kbd>Ctrl</kbd>+<kbd>Maiusc</kbd>+<kbd>O</kbd> una cartella.
        </p>
        <div className="accoglienza-aiuti">
          <button className="btn btn-quieto" onClick={() => void openExample()}>
            <IconaStanza size={16} />
            Prova con la storia d’esempio
          </button>
          <button className="btn btn-quieto" onClick={() => void openGuide()}>
            <IconaAiuto size={16} />
            Leggi la guida
          </button>
        </div>
      </div>
    </main>
  )
}

/** Progetto aperto ma nessun file davanti: si sceglie da dove cominciare. */
export function ScegliStoria(): JSX.Element {
  const tree = useStudio((s) => s.tree)
  const grafo = useStudio((s) => s.inclusioniDisco)
  const openFile = useStudio((s) => s.openFile)
  const newProject = useStudio((s) => s.newProject)
  const file = useMemo(() => fileFav(tree), [tree])
  // Le storie (i file che nessuno include) prima, poi i moduli.
  const incluse = useMemo(() => new Set(Object.values(grafo).flat().map(chiave)), [grafo])
  const ordinati = [...file].sort((a, b) => Number(incluse.has(chiave(a.path))) - Number(incluse.has(chiave(b.path))))
  return (
    <div className="accoglienza accoglienza-interna">
      <div className="accoglienza-carta">
        <h1>Da dove cominci?</h1>
        {file.length === 0 ? (
          <p className="accoglienza-sotto">In questa cartella non c’è ancora nessuna storia (un file <code>.fav</code>).</p>
        ) : (
          <>
            <p className="accoglienza-sotto">Scegli un file della storia da aprire.</p>
            <ul className="accoglienza-lista">
              {ordinati.map((f) => {
                const modulo = incluse.has(chiave(f.path))
                return (
                  <li key={f.path}>
                    <button className="accoglienza-file" onClick={() => void openFile(f)}>
                      <IconaTesto size={18} />
                      <span className="accoglienza-file-nome">{f.name}</span>
                      <span className={'distintivo' + (modulo ? '' : ' distintivo-accento')}>
                        {modulo ? 'parte di una storia' : 'storia'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <div className="accoglienza-azioni">
          <button className="btn btn-quieto" onClick={() => void newProject()}>
            <IconaPiu size={18} />
            Nuova storia altrove
          </button>
        </div>
      </div>
    </div>
  )
}
