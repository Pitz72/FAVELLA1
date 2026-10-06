import { useMemo, useState } from 'react'
import type { FileNode } from '../../../shared/protocol'
import { useStudio, infoStoria } from '../store'
import { nomeFile, nomeFileValido, stessoFile } from '../utils/progetto'
import { IconaAiuto, IconaChiudi, IconaFile, IconaPiu } from './Icone'
import Finestra from './Finestra'

// La storia come insieme di file. Una storia sta in un file solo oppure è divisa in moduli:
// il file principale include gli altri con «Includi "nome.fav".». Qui si vede com'è fatta,
// si crea un file nuovo (e lo si include) e si includono o si escludono file già esistenti.

function fileFav(nodi: FileNode[]): FileNode[] {
  const out: FileNode[] = []
  for (const n of nodi) {
    if (n.type === 'dir') out.push(...fileFav(n.children ?? []))
    else if (n.name.toLowerCase().endsWith('.fav')) out.push(n)
  }
  return out
}

function NuovoFileDialog({ onChiudi }: { onChiudi: () => void }): JSX.Element {
  const nuovoFileStoria = useStudio((s) => s.nuovoFileStoria)
  const [nome, setNome] = useState('')
  const [includi, setIncludi] = useState(true)
  const [lavoro, setLavoro] = useState(false)
  const errore = nome.trim() === '' ? null : nomeFileValido(nome)

  const crea = async (): Promise<void> => {
    if (!nome.trim() || errore || lavoro) return
    setLavoro(true)
    const ok = await nuovoFileStoria(nome, includi)
    setLavoro(false)
    if (ok) onChiudi()
  }

  return (
    <Finestra
      titolo="Un file nuovo per la storia"
      sottotitolo="Per tenere in ordine una storia lunga: per esempio uno per le stanze, uno per i personaggi, uno per le regole."
      onChiudi={onChiudi}
      azioni={
        <>
          <button className="btn btn-quieto" onClick={onChiudi}>
            Annulla
          </button>
          <button className="btn btn-primario" disabled={!nome.trim() || !!errore || lavoro} onClick={() => void crea()}>
            {lavoro ? 'Creo…' : 'Crea il file'}
          </button>
        </>
      }
    >
      <label className="campo">
        <span className="campo-etichetta">Il nome del file</span>
        <span className="campo-con-coda">
          <input
            type="text"
            autoFocus
            placeholder="personaggi"
            value={nome}
            aria-invalid={!!errore}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void crea()
            }}
          />
          <span className="campo-coda">.fav</span>
        </span>
      </label>
      {errore && <p className="errore-campo">{errore}</p>}
      <label className="spunta">
        <input type="checkbox" checked={includi} onChange={(e) => setIncludi(e.target.checked)} />
        <span>Includilo nella storia</span>
      </label>
      <p className="aiuto">
        {includi
          ? 'Il file principale riceve la riga «Includi», e il file nuovo diventa il posto dove vanno le cose che aggiungi dai pannelli.'
          : 'Il file resta fuori dalla storia finché non lo includi: quello che ci scrivi non si gioca.'}
      </p>
    </Finestra>
  )
}

export default function StrutturaStoria(): JSX.Element | null {
  const tree = useStudio((s) => s.tree)
  const info = useStudio((s) => JSON.stringify(infoStoria(s)?.membri ?? []))
  const activePath = useStudio((s) => s.activePath)
  const openFile = useStudio((s) => s.openFile)
  const includiFile = useStudio((s) => s.includiFile)
  const togliInclusione = useStudio((s) => s.togliInclusione)
  const [nuovo, setNuovo] = useState(false)
  const [guida, setGuida] = useState(false)
  const membri = useMemo(() => JSON.parse(info) as string[], [info])
  const file = useMemo(() => fileFav(tree), [tree])

  if (membri.length === 0) return null
  const fuori = file.filter((f) => !membri.some((m) => stessoFile(m, f.path)))
  const molti = membri.length > 1

  return (
    <section className="struttura" aria-label="File della storia">
      <div className="struttura-testa">
        <span>{molti ? `La storia · ${membri.length} file` : 'La storia · 1 file'}</span>
        <button
          className="btn-icona"
          title="Come si divide una storia in più file"
          aria-label="Come si divide una storia in più file"
          aria-expanded={guida}
          onClick={() => setGuida((v) => !v)}
        >
          <IconaAiuto />
        </button>
      </div>

      <ul className="struttura-lista">
        {membri.map((m, i) => (
          <li key={m} className={'struttura-voce' + (stessoFile(m, activePath) ? ' attivo' : '')}>
            <button
              className="struttura-file"
              title={m}
              onClick={() => {
                const nodo = file.find((f) => stessoFile(f.path, m))
                void openFile(nodo ?? { name: nomeFile(m), path: m, type: 'file' })
              }}
            >
              <IconaFile size={14} />
              <span>{nomeFile(m)}</span>
              {i === 0 && molti && <span className="struttura-etichetta">principale</span>}
            </button>
            {i > 0 && (
              <button
                className="btn-icona"
                aria-label={`Togli ${nomeFile(m)} dalla storia`}
                title="Toglie la riga «Includi» di questo file: il file resta sul disco ma non fa più parte della storia"
                onClick={() => void togliInclusione(m)}
              >
                <IconaChiudi size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="struttura-azioni">
        <button className="btn btn-quieto btn-piccolo" onClick={() => setNuovo(true)} title="Crea un file nuovo e includilo nella storia">
          <IconaPiu size={14} /> Nuovo file
        </button>
        {fuori.length > 0 && (
          <select
            value=""
            onChange={(e) => e.target.value && void includiFile(e.target.value)}
            aria-label="Includi un file esistente"
            title="Aggiunge alla storia un file che c'è già nella cartella"
          >
            <option value="">Includi un file…</option>
            {fuori.map((f) => (
              <option key={f.path} value={f.path}>
                {f.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {!molti && !guida && (
        <p className="struttura-nota">
          Quando la storia diventa lunga puoi dividerla in più file: «Nuovo file» lo crea e lo include.
        </p>
      )}

      {guida && (
        <div className="struttura-guida">
          <p>
            <b>Una storia a più file.</b> Il file <b>principale</b> include gli altri con una riga da sola, di solito in
            cima:
          </p>
          <pre>Includi "personaggi.fav".</pre>
          <ol>
            <li>
              <b>Nuovo file</b> crea il file e aggiunge la riga <code>Includi</code> da sé.
            </li>
            <li>
              Scrivi dove vuoi: stanze, oggetti, regole e dialoghi possono stare in <i>qualunque</i> file, e si
              leggono come una storia sola.
            </li>
            <li>
              Dai pannelli, le cose <i>nuove</i> vanno nel file indicato in alto («Le cose nuove vanno in…»); quelle
              già scritte si cambiano nel file in cui stanno.
            </li>
            <li>
              Provare, riordinare, esportare e salvare lavorano sempre su tutta la storia, qualunque file tu abbia
              aperto.
            </li>
          </ol>
          <p>
            Per togliere un file dalla storia basta la ×: la riga <code>Includi</code> sparisce, il file no.
          </p>
        </div>
      )}

      {nuovo && <NuovoFileDialog onChiudi={() => setNuovo(false)} />}
    </section>
  )
}
