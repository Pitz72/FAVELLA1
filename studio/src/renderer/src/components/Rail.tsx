import { useStudio } from '../store'
import { SEZIONI, sezioneDi } from '../sezioni'
import { IconaSezione } from './Icone'

// La barra laterale con le cinque sezioni. Ogni voce ha l'icona E il nome scritto per
// intero: niente icone da indovinare. Ctrl+1…5 dalla tastiera.
export default function Rail(): JSX.Element {
  const rightTab = useStudio((s) => s.rightTab)
  const setSezione = useStudio((s) => s.setSezione)
  const projectRoot = useStudio((s) => s.projectRoot)
  const activePath = useStudio((s) => s.activePath)
  const problems = useStudio((s) => s.problems)
  const partitaAltrove = useStudio((s) => s.partitaAltrove)
  const gameRunning = useStudio((s) => s.gameRunning)
  const isFav = !!activePath?.toLowerCase().endsWith('.fav')
  const corrente = sezioneDi(rightTab)
  const errori = problems.filter((p) => p.severity === 'error').length

  return (
    <nav className="sezioni" aria-label="Sezioni">
      {SEZIONI.map((sez) => {
        // Senza un file .fav aperto, le sezioni visuali non hanno niente da mostrare.
        const disabilitata = !projectRoot || (sez.id !== 'storia' && !isFav)
        const segnale =
          sez.id === 'storia' && errori > 0
            ? { testo: String(errori), etichetta: `${errori} ${errori === 1 ? 'errore' : 'errori'}`, tipo: 'errore' }
            : sez.id === 'prova' && gameRunning && !partitaAltrove
              ? { testo: '', etichetta: 'partita in corso', tipo: 'vivo' }
              : null
        return (
          <button
            key={sez.id}
            className={'sezione' + (corrente === sez.id ? ' attiva' : '')}
            onClick={() => setSezione(sez.id)}
            disabled={disabilitata}
            aria-current={corrente === sez.id ? 'page' : undefined}
            aria-keyshortcuts={`Control+${sez.tasto}`}
            title={`${sez.titolo} — ${sez.descrizione} (Ctrl+${sez.tasto})`}
          >
            <span className="sezione-icona">
              <IconaSezione id={sez.id} />
              {segnale && (
                <span className={'sezione-segnale ' + segnale.tipo} aria-label={segnale.etichetta}>
                  {segnale.testo}
                </span>
              )}
            </span>
            <span className="sezione-nome">{sez.titolo}</span>
          </button>
        )
      })}
    </nav>
  )
}
