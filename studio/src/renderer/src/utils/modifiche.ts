import type { OutlineSpan } from '../../../shared/protocol'
import { chiave } from './progetto'

// Le modifiche che i pannelli fanno al testo, descritte per frase. Una modifica può
// riguardare un file qualunque della storia (lo dice lo span): qui si raggruppano per
// file e si calcola il testo nuovo di ognuno, senza toccare niente.

export type Modifica =
  /** Una frase nuova in fondo a un file (di default quello dei nuovi elementi). */
  | { tipo: 'aggiungi'; testo: string; file?: string }
  /** Sostituisce le righe di una frase. */
  | { tipo: 'sostituisci'; span: OutlineSpan; testo: string }
  /** Toglie le righe di una frase. */
  | { tipo: 'elimina'; span: OutlineSpan }
  /** Rimpiazza un file per intero (riordino, rinomina). */
  | { tipo: 'file'; file: string; testo: string }

/** Applica un'aggiunta in coda (una riga a capo se manca, poi la frase). */
export function aggiungiInCoda(contenuto: string, testo: string): string {
  const base = contenuto.endsWith('\n') || contenuto === '' ? contenuto : contenuto + '\n'
  return base + testo + '\n'
}

export interface FileDaModificare {
  /** Il percorso col quale il file è già noto (aperto o letto dal disco). */
  file: string
  contenuto: string
}

export type EsitoModifiche =
  | { ok: true; contenuti: Map<string, string> }
  | { ok: false; errore: string }

/**
 * Calcola il testo nuovo di ogni file toccato. `dati` dà il contenuto di partenza di
 * ciascun file (la chiave è `chiave(percorso)`); `destinazione` è il file che
 * riceve le aggiunte senza un file proprio. Le righe si cambiano dal basso verso l'alto
 * così le righe sopra non slittano.
 */
export function calcolaContenuti(
  mods: Modifica[],
  dati: Map<string, FileDaModificare>,
  destinazione: string
): EsitoModifiche {
  const perFile = new Map<string, Modifica[]>()
  const nome = new Map<string, string>() // chiave → percorso come lo conosciamo
  const aggiungiA = (file: string, m: Modifica): void => {
    const k = chiave(file)
    if (!perFile.has(k)) perFile.set(k, [])
    perFile.get(k)!.push(m)
    if (!nome.has(k)) nome.set(k, dati.get(k)?.file ?? file)
  }
  for (const m of mods) {
    if (m.tipo === 'aggiungi') aggiungiA(m.file ?? destinazione, m)
    else if (m.tipo === 'file') aggiungiA(m.file, m)
    else aggiungiA(m.span.file, m)
  }

  const contenuti = new Map<string, string>()
  for (const [k, lista] of perFile) {
    const partenza = dati.get(k)
    if (!partenza) return { ok: false, errore: `Non riesco a leggere il file «${nome.get(k)}».` }

    const interi = lista.filter((m): m is Extract<Modifica, { tipo: 'file' }> => m.tipo === 'file')
    if (interi.length > 0) {
      if (lista.length > 1) return { ok: false, errore: 'Una modifica riscrive tutto il file e un’altra lo ritocca.' }
      contenuti.set(k, interi[0].testo)
      continue
    }

    const righe = partenza.contenuto.split('\n')
    const sullaRiga = lista
      .filter((m): m is Extract<Modifica, { tipo: 'sostituisci' | 'elimina' }> => m.tipo !== 'aggiungi')
      .sort((a, b) => b.span.line - a.span.line)
    for (let i = 1; i < sullaRiga.length; i++) {
      if (sullaRiga[i].span.endLine >= sullaRiga[i - 1].span.line) {
        return { ok: false, errore: 'Due modifiche vogliono cambiare le stesse righe.' }
      }
    }
    for (const m of sullaRiga) {
      if (m.span.line < 1 || m.span.endLine > righe.length) {
        return { ok: false, errore: 'Il testo è cambiato: ricarico il pannello e riprova.' }
      }
      if (m.tipo === 'sostituisci') righe.splice(m.span.line - 1, m.span.endLine - m.span.line + 1, m.testo)
      else righe.splice(m.span.line - 1, m.span.endLine - m.span.line + 1)
    }
    let testo = righe.join('\n')
    for (const m of lista) if (m.tipo === 'aggiungi') testo = aggiungiInCoda(testo, m.testo)
    contenuti.set(k, testo)
  }
  return { ok: true, contenuti }
}

/** La modifica più piccola che porta `prima` a `dopo`: serve a cambiare Monaco senza
 *  spostare il cursore né riscrivere tutto il file. */
export function modificaMinima(
  prima: string,
  dopo: string
): { da: number; a: number; testo: string } | null {
  if (prima === dopo) return null
  let inizio = 0
  const max = Math.min(prima.length, dopo.length)
  while (inizio < max && prima[inizio] === dopo[inizio]) inizio++
  let fine = 0
  while (
    fine < prima.length - inizio &&
    fine < dopo.length - inizio &&
    prima[prima.length - 1 - fine] === dopo[dopo.length - 1 - fine]
  )
    fine++
  return { da: inizio, a: prima.length - fine, testo: dopo.slice(inizio, dopo.length - fine) }
}
