// [Studio 1.2] L'aspetto di Studio: tre modi di leggere la stessa interfaccia.
//  - «notte»: il tema di marca (il blu notte di FAVELLA, ciano, smeraldo, ambra);
//  - «carta»: chiaro, inchiostro su carta avorio, per chi legge meglio su fondo chiaro;
//  - contrasto «alto»: per entrambi, colori più netti, bordi più spessi, nessuna trasparenza.
// I colori stanno nei token CSS (tema.css): qui si scelgono con due attributi sul
// documento, e si dice a Monaco quale tema usare.

export type Tema = 'notte' | 'carta'
export type Contrasto = 'normale' | 'alto'

export interface Aspetto {
  tema: Tema
  contrasto: Contrasto
}

export const ASPETTO_PREDEFINITO: Aspetto = { tema: 'notte', contrasto: 'normale' }

export function isAspetto(v: unknown): v is Aspetto {
  const a = v as Aspetto
  return (
    !!a &&
    typeof a === 'object' &&
    (a.tema === 'notte' || a.tema === 'carta') &&
    (a.contrasto === 'normale' || a.contrasto === 'alto')
  )
}

/** Il nome del tema di Monaco che corrisponde all'aspetto. */
export function temaMonaco(a: Aspetto): string {
  if (a.tema === 'carta') return a.contrasto === 'alto' ? 'favella-carta-alto' : 'favella-carta'
  return a.contrasto === 'alto' ? 'favella-notte-alto' : 'favella-notte'
}

// Chi deve sapere quando l'aspetto cambia (l'editor di testo).
const ascoltatori = new Set<(a: Aspetto) => void>()
let corrente: Aspetto = ASPETTO_PREDEFINITO

export function suAspetto(cb: (a: Aspetto) => void): () => void {
  ascoltatori.add(cb)
  return () => ascoltatori.delete(cb)
}

export function aspettoCorrente(): Aspetto {
  return corrente
}

export function applicaAspetto(a: Aspetto): void {
  corrente = a
  const html = document.documentElement
  html.dataset.tema = a.tema
  html.dataset.contrasto = a.contrasto
  html.style.colorScheme = a.tema === 'carta' ? 'light' : 'dark'
  for (const cb of ascoltatori) cb(a)
}
