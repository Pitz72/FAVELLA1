import { useStudio } from '../store'
import { SEZIONI, sezioneDi } from '../sezioni'
import { IconaSezione } from './Icone'

// La barra laterale con le cinque sezioni. Ogni voce ha l'icona E il nome scritto
// per intero: niente icone da indovinare.
export default function Rail(): JSX.Element {
  const rightTab = useStudio((s) => s.rightTab)
  const setSezione = useStudio((s) => s.setSezione)
  const projectRoot = useStudio((s) => s.projectRoot)
  const activePath = useStudio((s) => s.activePath)
  const problems = useStudio((s) => s.problems)
  const isFav = !!activePath?.toLowerCase().endsWith('.fav')
  const corrente = sezioneDi(rightTab)
  const errori = problems.filter((p) => p.severity === 'error').length

  return (
    <nav className="rail" aria-label="Sezioni">
      {SEZIONI.map((sez) => {
        // Senza un file .fav aperto, le sezioni visuali non hanno niente da mostrare.
        const disabilitata = !projectRoot || (sez.id !== 'storia' && !isFav)
        return (
          <button
            key={sez.id}
            className={'rail-item' + (corrente === sez.id ? ' active' : '')}
            onClick={() => setSezione(sez.id)}
            disabled={disabilitata}
            aria-current={corrente === sez.id ? 'page' : undefined}
            title={`${sez.titolo} — ${sez.descrizione} (Ctrl+${sez.tasto})`}
          >
            <span className="rail-icon">
              <IconaSezione id={sez.id} />
              {sez.id === 'storia' && errori > 0 && (
                <span className="rail-badge" aria-label={`${errori} errori`}>
                  {errori}
                </span>
              )}
            </span>
            <span className="rail-label">{sez.titolo}</span>
          </button>
        )
      })}
    </nav>
  )
}
