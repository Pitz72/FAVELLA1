import type { Sezione } from '../sezioni'

// Icone a tratto, tutte sulla stessa griglia 24×24: ereditano il colore dal testo
// (currentColor) e non hanno bisogno di font di icone.
const P = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

export function IconaSezione({ id, size = 22 }: { id: Sezione; size?: number }): JSX.Element {
  const svg = (children: JSX.Element): JSX.Element => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...P}>
      {children}
    </svg>
  )
  switch (id) {
    case 'storia': // libro aperto
      return svg(
        <>
          <path d="M3 5.5C5.6 4.2 8.8 4.2 12 6c3.2-1.8 6.4-1.8 9-.5v13c-2.6-1.3-5.8-1.3-9 .5-3.2-1.8-6.4-1.8-9-.5z" />
          <path d="M12 6v13.5" />
        </>
      )
    case 'mondo': // tre stanze collegate
      return svg(
        <>
          <rect x="3" y="3.5" width="7" height="6" rx="1.5" />
          <rect x="14" y="3.5" width="7" height="6" rx="1.5" />
          <rect x="8.5" y="14.5" width="7" height="6" rx="1.5" />
          <path d="M10 6.5h4M6.5 9.5v2.2h5M17.5 9.5v2.2h-5V14.5" />
        </>
      )
    case 'personaggi': // due nuvolette di dialogo
      return svg(
        <>
          <path d="M3.5 5h10a1.5 1.5 0 0 1 1.5 1.5V11a1.5 1.5 0 0 1-1.5 1.5H8l-3 2.5v-2.5H3.5A1.5 1.5 0 0 1 2 11V6.5A1.5 1.5 0 0 1 3.5 5z" />
          <path d="M18 10.5h1.5A1.5 1.5 0 0 1 21 12v4.5a1.5 1.5 0 0 1-1.5 1.5H19v2.5L16 18h-4.5" />
        </>
      )
    case 'regole': // ingranaggio semplice
      return svg(
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7" />
        </>
      )
    case 'prova': // triangolo di avvio
      return svg(<path d="M7 4.5v15l12-7.5z" />)
  }
}

export function IconaPlay({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M7 4.5v15l12.5-7.5z" />
    </svg>
  )
}

export function IconaSalva({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...P}>
      <path d="M5 3.5h11l3.5 3.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 5 3.5z" />
      <path d="M8 3.5v5h7v-5M8 20.5v-6h8v6" />
    </svg>
  )
}

export function IconaPiu({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...P}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconaCartella({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...P}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8A2 2 0 0 1 21 9.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

export function IconaMenu({ size = 18 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <circle cx="5.5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18.5" cy="12" r="1.7" />
    </svg>
  )
}

export function IconaFreccia({ size = 14 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...P}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function IconaRiordina({ size = 16 }: { size?: number }): JSX.Element {
  // Righe di testo di lunghezze diverse che si allineano: «metti in ordine».
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...P}>
      <path d="M4 6h16M4 11h10M4 16h13M4 21h7" />
      <path d="M19 12v7m0 0l-2.2-2.2M19 19l2.2-2.2" />
    </svg>
  )
}

export function IconaFile({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...P}>
      <path d="M6 3.5h8l4.5 4.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z" />
      <path d="M14 3.5V8h4.5" />
    </svg>
  )
}
