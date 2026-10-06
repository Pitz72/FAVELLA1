import { useEffect, useId, useRef, type ReactNode } from 'react'

// [Studio 1.2] La finestra di dialogo di Studio, una per tutti. Prima ogni pannello ne
// aveva una sua, e nessuna teneva il fuoco dentro: con la tastiera si finiva dietro la
// finestra, e chi usa un lettore di schermo non sapeva di essere in un dialogo.
//  - role="dialog", aria-modal, titolo collegato (aria-labelledby);
//  - Esc chiude (se `onChiudi` c'è), il clic sullo sfondo pure;
//  - il fuoco va al primo campo (o al pulsante principale) e ci resta dentro (Tab gira);
//  - alla chiusura il fuoco torna dov'era.

const FOCALIZZABILI =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Le finestre aperte, una sopra l'altra: Esc e Tab valgono solo per quella in cima.
const pila: string[] = []

export default function Finestra({
  titolo,
  sottotitolo,
  onChiudi,
  larga,
  children,
  azioni,
  className
}: {
  titolo: ReactNode
  sottotitolo?: ReactNode
  /** Senza `onChiudi` la finestra non si chiude con Esc né col clic fuori. */
  onChiudi?: () => void
  larga?: boolean
  children?: ReactNode
  /** I pulsanti in fondo (Annulla, Conferma…). */
  azioni?: ReactNode
  className?: string
}): JSX.Element {
  const id = useId()
  const ref = useRef<HTMLDivElement | null>(null)
  const chiudiRef = useRef(onChiudi)
  chiudiRef.current = onChiudi

  useEffect(() => {
    pila.push(id)
    const prima = document.activeElement as HTMLElement | null
    const el = ref.current
    if (el) {
      const campo = el.querySelector<HTMLElement>('[autofocus], input:not([disabled]), textarea:not([disabled]), select:not([disabled])')
      const principale = el.querySelector<HTMLElement>('.finestra-azioni .btn-primario:not([disabled])')
      ;(campo ?? principale ?? el).focus()
    }
    const onKey = (e: KeyboardEvent): void => {
      if (!ref.current || pila[pila.length - 1] !== id) return
      if (e.key === 'Escape' && chiudiRef.current) {
        e.preventDefault()
        e.stopPropagation()
        chiudiRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const tutti = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCALIZZABILI)).filter(
        (x) => x.offsetParent !== null
      )
      if (tutti.length === 0) return
      const primo = tutti[0]
      const ultimo = tutti[tutti.length - 1]
      if (e.shiftKey && document.activeElement === primo) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primo.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      const i = pila.lastIndexOf(id)
      if (i >= 0) pila.splice(i, 1)
      if (prima && document.contains(prima)) prima.focus()
    }
  }, [id])

  return (
    <div
      className="finestra-sfondo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) chiudiRef.current?.()
      }}
    >
      <div
        ref={ref}
        className={'finestra' + (larga ? ' finestra-larga' : '') + (className ? ' ' + className : '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
      >
        <header className="finestra-testa">
          <h2 id={id} className="finestra-titolo">
            {titolo}
          </h2>
          {sottotitolo && <p className="finestra-sottotitolo">{sottotitolo}</p>}
          {onChiudi && (
            <button className="btn-icona finestra-x" onClick={onChiudi} aria-label="Chiudi" title="Chiudi (Esc)">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </header>
        {children && <div className="finestra-corpo">{children}</div>}
        {azioni && <footer className="finestra-azioni">{azioni}</footer>}
      </div>
    </div>
  )
}
