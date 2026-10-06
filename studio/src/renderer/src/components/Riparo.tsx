import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useStudio } from '../store'

// [Studio 1.2] Il riparo dagli errori dell'interfaccia. Prima della 1.2 un errore in un
// pannello (per esempio aprire una regola con una condizione semplice) lasciava la
// finestra vuota: il testo non salvato restava in memoria, ma non lo si poteva più
// raggiungere. Ora l'errore resta chiuso nel pannello che l'ha prodotto, si dice che
// cosa è successo, e si può salvare tutto e riprovare.

interface Props {
  /** Dove sta il riparo: «pannello» (una parte dell'area di lavoro) o «app» (tutto). */
  livello: 'pannello' | 'app'
  /** Cambia quando il pannello cambia: l'errore si dimentica e si riprova. */
  chiave?: string
  children: ReactNode
}

interface Stato {
  errore: Error | null
  chiave?: string
}

export default class Riparo extends Component<Props, Stato> {
  state: Stato = { errore: null, chiave: this.props.chiave }

  static getDerivedStateFromError(errore: Error): Partial<Stato> {
    return { errore }
  }

  static getDerivedStateFromProps(props: Props, stato: Stato): Partial<Stato> | null {
    // Un pannello diverso parte senza l'errore del pannello di prima.
    if (props.chiave !== stato.chiave) return { errore: null, chiave: props.chiave }
    return null
  }

  componentDidCatch(errore: Error, info: ErrorInfo): void {
    console.error('[Favella Studio] errore dell’interfaccia', errore, info.componentStack)
  }

  private riprova = (): void => this.setState({ errore: null })

  private salvaTutto = async (): Promise<void> => {
    const ok = await useStudio.getState().saveAll()
    useStudio.getState().avvisa(ok ? 'Tutti i file sono salvati.' : 'Non tutti i file si sono salvati.', {
      tipo: ok ? 'ok' : 'errore'
    })
  }

  private tornaAlTesto = (): void => {
    useStudio.getState().setSezione('storia')
    this.setState({ errore: null })
  }

  render(): ReactNode {
    const { errore } = this.state
    if (!errore) return this.props.children
    const app = this.props.livello === 'app'
    return (
      <div className={'riparo' + (app ? ' riparo-app' : '')} role="alert">
        <div className="riparo-carta">
          <h2>{app ? 'Qualcosa si è inceppato' : 'Questo pannello si è inceppato'}</h2>
          <p>
            Il tuo testo è al sicuro: è ancora tutto in memoria. Salvalo, poi riprova
            {app ? '' : ' o torna al testo'}.
          </p>
          <p className="riparo-dettaglio">
            <code>{errore.message || String(errore)}</code>
          </p>
          <div className="riparo-azioni">
            <button className="btn btn-primario" onClick={() => void this.salvaTutto()}>
              Salva tutto
            </button>
            <button className="btn" onClick={this.riprova}>
              Riprova
            </button>
            {!app && (
              <button className="btn btn-quieto" onClick={this.tornaAlTesto}>
                Torna al testo
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
}
