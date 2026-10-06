import type { ReactNode } from 'react'
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

// --- [Studio 1.2] Il resto del set: stessa griglia, stesso tratto. Al posto delle emoji
// e dei simboli tipografici (⟳ 🗁 ✎ 🗑 ☻ ▣), che cambiavano col font e non si leggevano.

type PropIcona = { size?: number; titolo?: string }

function Tratto({ size = 16, children }: { size?: number; children: ReactNode }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...P}>
      {children}
    </svg>
  )
}

export function IconaChevron({ size = 16, direzione = 'giu' }: PropIcona & { direzione?: 'su' | 'giu' | 'sinistra' | 'destra' }): JSX.Element {
  const d = { giu: 'M6 9l6 6 6-6', su: 'M6 15l6-6 6 6', sinistra: 'M15 6l-6 6 6 6', destra: 'M9 6l6 6-6 6' }[direzione]
  return <Tratto size={size}><path d={d} /></Tratto>
}

export function IconaAnnulla({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </Tratto>
  )
}

export function IconaAggiorna({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M20 11a8 8 0 0 0-14.6-4.5L4 8" />
      <path d="M4 3.5V8h4.5" />
      <path d="M4 13a8 8 0 0 0 14.6 4.5L20 16" />
      <path d="M20 20.5V16h-4.5" />
    </Tratto>
  )
}

export function IconaCerca({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </Tratto>
  )
}

export function IconaCestino({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
      <path d="M9 7V4.5A1 1 0 0 1 10 3.5h4a1 1 0 0 1 1 1V7" />
    </Tratto>
  )
}

export function IconaMatita({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M4 20l1-4.5L16 4.5a2 2 0 0 1 3 0l.5.5a2 2 0 0 1 0 3L8.5 19z" />
      <path d="M14 6.5l3.5 3.5" />
    </Tratto>
  )
}

export function IconaChiudi({ size = 16 }: PropIcona): JSX.Element {
  return <Tratto size={size}><path d="M6 6l12 12M18 6L6 18" /></Tratto>
}

export function IconaTesto({ size = 16 }: PropIcona): JSX.Element {
  // Un foglio con le righe: «il testo della storia».
  return (
    <Tratto size={size}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Tratto>
  )
}

export function IconaStanza({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M10 19v-5h4v5" />
    </Tratto>
  )
}

export function IconaPartenza({ size = 16 }: PropIcona): JSX.Element {
  // Una bandierina: il punto di partenza del giocatore.
  return (
    <Tratto size={size}>
      <path d="M6 21V4" />
      <path d="M6 4.5h11l-2.5 4 2.5 4H6" />
    </Tratto>
  )
}

export function IconaOggetto({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7z" />
      <path d="M4.8 7.9L12 12l7.2-4.1M12 12v8.3" />
    </Tratto>
  )
}

export function IconaContenitore({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M4 9h16v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M3 5.5h18V9H3zM10 13h4" />
    </Tratto>
  )
}

export function IconaSupporto({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M3 9h18M6 9v11M18 9v11" />
      <path d="M8 9V6.5h8V9" />
    </Tratto>
  )
}

export function IconaPersona({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </Tratto>
  )
}

export function IconaFumetto({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M5 4.5h14A1.5 1.5 0 0 1 20.5 6v9A1.5 1.5 0 0 1 19 16.5h-8.5L6 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5z" />
    </Tratto>
  )
}

export function IconaStella({ size = 16, piena = false }: PropIcona & { piena?: boolean }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...P} fill={piena ? 'currentColor' : 'none'}>
      <path d="M12 3.8l2.5 5.1 5.6.8-4 4 1 5.5L12 16.6l-5.1 2.6 1-5.5-4-4 5.6-.8z" />
    </svg>
  )
}

export function IconaLeggibilita({ size = 16 }: PropIcona): JSX.Element {
  // «Aa»: la grandezza e l'aspetto del testo.
  return (
    <Tratto size={size}>
      <path d="M3 19L8 5l5 14M4.8 14.5h6.4" />
      <path d="M17.5 19v-6.5a2.6 2.6 0 0 0-5 0M12.5 15.8c0-1.8 5-2 5-.5V19c-1 .9-5 1.4-5-1.5" />
    </Tratto>
  )
}

export function IconaAiuto({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6V14.5M12 17.5v.01" />
    </Tratto>
  )
}

export function IconaAvviso({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M12 4l9 15.5H3z" />
      <path d="M12 10v4.5M12 17v.01" />
    </Tratto>
  )
}

export function IconaErrore({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.2v.01" />
    </Tratto>
  )
}

export function IconaFinestra({ size = 16 }: PropIcona): JSX.Element {
  // Una finestra che si apre a parte.
  return (
    <Tratto size={size}>
      <rect x="3.5" y="5.5" width="13" height="13" rx="2" />
      <path d="M13 3.5h7.5V11M20.5 3.5L11 13" />
    </Tratto>
  )
}

export function IconaEsporta({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M12 3.5v11M7.5 8L12 3.5 16.5 8" />
      <path d="M5 13.5v5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-5" />
    </Tratto>
  )
}

export function IconaCollega({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </Tratto>
  )
}

export function IconaAllinea({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Tratto>
  )
}

export function IconaIngranaggio({ size = 16 }: PropIcona): JSX.Element {
  return (
    <Tratto size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7" />
    </Tratto>
  )
}

export function IconaPunto({ size = 16 }: PropIcona): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  )
}
