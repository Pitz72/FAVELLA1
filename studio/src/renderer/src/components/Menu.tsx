import { useEffect, useRef, useState, type ReactNode } from 'react'

// [Studio 1.2] Un menu a comparsa accessibile: il pulsante lo apre (anche con Giù), le
// frecce scorrono le voci, Home/Fine vanno in cima e in fondo, Esc chiude e riporta il
// fuoco al pulsante, il clic fuori chiude. Le voci sono `menuitem`, `menuitemcheckbox` o
// `menuitemradio`.

export function useMenu(): {
  aperto: boolean
  apri: () => void
  chiudi: (riportaFuoco?: boolean) => void
  alterna: () => void
  refContenitore: React.MutableRefObject<HTMLDivElement | null>
  refPulsante: React.MutableRefObject<HTMLButtonElement | null>
} {
  const [aperto, setAperto] = useState(false)
  const refContenitore = useRef<HTMLDivElement | null>(null)
  const refPulsante = useRef<HTMLButtonElement | null>(null)
  const chiudi = (riportaFuoco = false): void => {
    setAperto(false)
    if (riportaFuoco) refPulsante.current?.focus()
  }
  useEffect(() => {
    if (!aperto) return
    const fuori = (e: MouseEvent): void => {
      if (refContenitore.current && !refContenitore.current.contains(e.target as Node)) setAperto(false)
    }
    window.addEventListener('mousedown', fuori)
    // Il fuoco va alla prima voce.
    requestAnimationFrame(() =>
      refContenitore.current?.querySelector<HTMLElement>('[role^="menuitem"]:not([disabled])')?.focus()
    )
    return () => window.removeEventListener('mousedown', fuori)
  }, [aperto])
  return {
    aperto,
    apri: () => setAperto(true),
    chiudi,
    alterna: () => setAperto((v) => !v),
    refContenitore,
    refPulsante
  }
}

/** La tastiera dentro il menu (da mettere sull'elemento role="menu"). */
export function tastieraMenu(e: React.KeyboardEvent<HTMLElement>, chiudi: (riporta?: boolean) => void): void {
  const voci = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])'))
  const i = voci.indexOf(document.activeElement as HTMLElement)
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    voci[(i + 1) % voci.length]?.focus()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    voci[(i - 1 + voci.length) % voci.length]?.focus()
  } else if (e.key === 'Home') {
    e.preventDefault()
    voci[0]?.focus()
  } else if (e.key === 'End') {
    e.preventDefault()
    voci[voci.length - 1]?.focus()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    chiudi(true)
  } else if (e.key === 'Tab') {
    chiudi(false)
  }
}

export function VoceMenu({
  children,
  scorciatoia,
  onClick,
  disabled,
  spunta,
  tipo = 'menuitem',
  icona
}: {
  children: ReactNode
  scorciatoia?: string
  onClick: () => void
  disabled?: boolean
  /** Per le voci a spunta o a scelta: se è attiva. */
  spunta?: boolean
  tipo?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio'
  icona?: ReactNode
}): JSX.Element {
  return (
    <button
      role={tipo}
      aria-checked={tipo === 'menuitem' ? undefined : !!spunta}
      className={'voce-menu' + (spunta ? ' spuntata' : '')}
      disabled={disabled}
      onClick={onClick}
      tabIndex={-1}
    >
      <span className="voce-menu-icona" aria-hidden="true">
        {tipo !== 'menuitem' ? (spunta ? '✓' : '') : icona}
      </span>
      <span className="voce-menu-testo">{children}</span>
      {scorciatoia && <kbd>{scorciatoia}</kbd>}
    </button>
  )
}
