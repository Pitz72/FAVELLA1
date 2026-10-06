import { useStudio } from '../store'
import Finestra from './Finestra'

// La finestra degli aggiornamenti. L'installazione parte solo dopo la guardia «modifiche
// non salvate» (prima della 1.2 l'installer partiva e Studio si chiudeva a metà domanda).

/** Le note di rilascio di GitHub sono Markdown: qui bastano titoli, elenchi e paragrafi. */
function Note({ testo }: { testo: string }): JSX.Element {
  const blocchi: JSX.Element[] = []
  let elenco: string[] = []
  const chiudiElenco = (): void => {
    if (elenco.length) {
      blocchi.push(
        <ul key={'u' + blocchi.length}>
          {elenco.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      )
      elenco = []
    }
  }
  const pulisci = (r: string): string => r.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`(.+?)`/g, '$1').trim()
  for (const riga of testo.replace(/\r/g, '').split('\n')) {
    const r = riga.trim()
    if (!r || r === '---') {
      chiudiElenco()
      continue
    }
    const titolo = /^#{1,6}\s+(.*)$/.exec(r)
    const voce = /^[-*]\s+(.*)$/.exec(r)
    if (titolo) {
      chiudiElenco()
      blocchi.push(<h3 key={'h' + blocchi.length}>{pulisci(titolo[1])}</h3>)
    } else if (voce) {
      elenco.push(pulisci(voce[1]))
    } else {
      chiudiElenco()
      blocchi.push(<p key={'p' + blocchi.length}>{pulisci(r)}</p>)
    }
  }
  chiudiElenco()
  return <div className="note-rilascio">{blocchi}</div>
}

const MB = (n: number): string => (n / (1024 * 1024)).toFixed(1).replace('.', ',')

export default function UpdateDialog(): JSX.Element | null {
  const status = useStudio((s) => s.updaterStatus)
  const open = useStudio((s) => s.updateModalOpen)
  const setOpen = useStudio((s) => s.setUpdateModalOpen)
  const avvisa = useStudio((s) => s.avvisa)
  if (!open) return null

  const chiudi = (): void => setOpen(false)
  const controlla = (): void => void window.favella.checkForUpdates(true)
  const installa = async (): Promise<void> => {
    // Prima i file non salvati: Studio si chiude subito dopo.
    if (!(await useStudio.getState().guardiaNonSalvati())) return
    const r = await window.favella.installUpdate()
    if (!r.ok && r.message) avvisa(r.message, { tipo: 'errore' })
  }

  switch (status.type) {
    case 'checking':
      return (
        <Finestra
          titolo="Controllo gli aggiornamenti…"
          sottotitolo="Chiedo a GitHub qual è l’ultima versione di Favella Studio."
          onChiudi={chiudi}
          azioni={
            <button className="btn btn-quieto" onClick={chiudi}>
              Chiudi
            </button>
          }
        >
          <div className="barra-attesa" aria-hidden="true" />
        </Finestra>
      )
    case 'not-available':
      return (
        <Finestra
          titolo="Sei già aggiornato"
          sottotitolo={`Favella Studio ${status.currentVersion} è l’ultima versione.`}
          onChiudi={chiudi}
          azioni={
            <button className="btn btn-primario" onClick={chiudi}>
              Bene
            </button>
          }
        />
      )
    case 'available':
      return (
        <Finestra
          titolo={`Favella Studio ${status.version}`}
          sottotitolo={`Hai la ${status.currentVersion}.${status.assetSize ? ` Il file pesa ${MB(status.assetSize)} MB.` : ''}`}
          onChiudi={chiudi}
          larga
          azioni={
            <>
              <button className="btn btn-quieto" onClick={chiudi}>
                Più tardi
              </button>
              <button className="btn btn-primario" onClick={() => void window.favella.downloadUpdate()}>
                {status.canAutoInstall ? 'Scarica e aggiorna' : 'Apri la pagina della versione'}
              </button>
            </>
          }
        >
          {status.releaseNotes ? <Note testo={status.releaseNotes} /> : <p>Nessuna nota per questa versione.</p>}
          {!status.canAutoInstall && (
            <p className="nota-piccola">
              Su questo sistema l’aggiornamento si scarica e si installa a mano dalla pagina della versione.
            </p>
          )}
        </Finestra>
      )
    case 'downloading':
      return (
        <Finestra
          titolo={`Scarico la versione ${status.version}…`}
          sottotitolo="Puoi continuare a lavorare: ti avviso quando è pronta."
          onChiudi={chiudi}
          azioni={
            <button className="btn btn-quieto" onClick={chiudi}>
              Continua a lavorare
            </button>
          }
        >
          <div className="avanzamento" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={status.percent}>
            <div className="avanzamento-barra" style={{ width: `${Math.min(100, Math.max(0, status.percent))}%` }} />
          </div>
          <p className="avanzamento-meta">
            <span>
              {MB(status.transferred)} MB di {MB(status.total)} MB
            </span>
            <strong>{status.percent}%</strong>
          </p>
        </Finestra>
      )
    case 'ready':
      return (
        <Finestra
          titolo="L’aggiornamento è pronto"
          sottotitolo={`La versione ${status.version} è scaricata e controllata (l’impronta coincide con quella pubblicata).`}
          onChiudi={chiudi}
          azioni={
            <>
              <button className="btn btn-quieto" onClick={chiudi}>
                Più tardi
              </button>
              <button className="btn btn-primario" onClick={() => void installa()}>
                Chiudi Studio e aggiorna
              </button>
            </>
          }
        >
          <p>Prima di chiudere, Studio ti chiede dei file che non hai salvato.</p>
        </Finestra>
      )
    case 'error':
      return (
        <Finestra
          titolo="L’aggiornamento non è riuscito"
          onChiudi={chiudi}
          azioni={
            <>
              <button className="btn btn-quieto" onClick={chiudi}>
                Chiudi
              </button>
              <button className="btn btn-primario" onClick={controlla}>
                Riprova
              </button>
            </>
          }
        >
          <p className="testo-errore">{status.message}</p>
        </Finestra>
      )
    default:
      return (
        <Finestra
          titolo="Aggiornamenti"
          sottotitolo="Controlla se c’è una versione nuova di Favella Studio su GitHub."
          onChiudi={chiudi}
          azioni={
            <button className="btn btn-primario" onClick={controlla}>
              Controlla adesso
            </button>
          }
        />
      )
  }
}
