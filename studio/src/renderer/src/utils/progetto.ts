// Percorsi e storie a più file. Una storia può stare in un solo file oppure essere
// divisa: il file principale include gli altri con «Includi "nome.fav".». Qui si
// capisce, dai testi, quali file fanno parte della stessa storia.

/** Chiave di confronto fra percorsi (Windows: maiuscole e barre indifferenti). */
export function chiave(percorso: string): string {
  return percorso.toLowerCase().replace(/\\/g, '/')
}

export function stessoFile(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && chiave(a) === chiave(b)
}

export function nomeFile(percorso: string): string {
  const parti = percorso.split(/[\\/]/)
  return parti[parti.length - 1] || percorso
}

export function cartellaDi(percorso: string): string {
  const i = Math.max(percorso.lastIndexOf('/'), percorso.lastIndexOf('\\'))
  return i < 0 ? '' : percorso.slice(0, i)
}

function separatore(percorso: string): string {
  return percorso.includes('\\') ? '\\' : '/'
}

/** Unisce una cartella e un percorso relativo, risolvendo «.» e «..». */
export function unisci(cartella: string, relativo: string): string {
  const sep = separatore(cartella)
  const radiceUnix = cartella.startsWith('/')
  const pezzi = cartella.split(/[\\/]/).filter((p, i) => p !== '' || i === 0)
  for (const p of relativo.split(/[\\/]/)) {
    if (p === '' || p === '.') continue
    if (p === '..') {
      if (pezzi.length > 1) pezzi.pop()
    } else pezzi.push(p)
  }
  const unito = pezzi.join(sep)
  return radiceUnix && !unito.startsWith('/') ? '/' + unito : unito
}

/** Il percorso di `verso` visto da `daCartella`, con le barre dritte («../altro/x.fav»). */
export function relativo(daCartella: string, verso: string): string {
  const da = chiave(daCartella).split('/').filter(Boolean)
  const a = chiave(verso).split('/').filter(Boolean)
  const nomiA = verso.split(/[\\/]/).filter(Boolean)
  let i = 0
  while (i < da.length && i < a.length - 1 && da[i] === a[i]) i++
  const su = da.slice(i).map(() => '..')
  return [...su, ...nomiA.slice(i)].join('/')
}

// Una direttiva d'inclusione occupa un'intera riga. «Includi la libreria "x".» prende
// un modulo dalla libreria standard: non è un file del progetto, quindi non conta.
const RE_INCLUDI = /^\s*Includi\s+"((?:\\.|[^"\\])*)"\s*\.\s*$/i
const RE_INCLUDI_LIBRERIA = /^\s*Includi\s+la\s+libreria\s+/i

/** I percorsi dei file che `contenuto` include (già risolti rispetto a `percorso`). */
export function estraiInclusioni(contenuto: string, percorso: string): string[] {
  const base = cartellaDi(percorso)
  const out: string[] = []
  let dentro = false // dentro una stringa su più righe: lì «Includi» non è una direttiva
  for (const riga of contenuto.split('\n')) {
    if (!dentro) {
      if (!RE_INCLUDI_LIBRERIA.test(riga)) {
        const m = RE_INCLUDI.exec(riga)
        if (m) out.push(unisci(base, m[1].replace(/\\(.)/g, '$1')))
      }
    }
    dentro = aggiornaStringa(riga, dentro)
  }
  return out
}

function aggiornaStringa(riga: string, dentro: boolean): boolean {
  for (let i = 0; i < riga.length; i++) {
    const c = riga[i]
    if (c === '\\') {
      i++
      continue
    }
    if (c === '"') dentro = !dentro
  }
  return dentro
}

/** Le righe «Includi …» di un testo, con il loro numero (1-based). */
export function righeInclusioni(contenuto: string): { riga: number; percorso: string }[] {
  const out: { riga: number; percorso: string }[] = []
  contenuto.split('\n').forEach((testo, i) => {
    if (RE_INCLUDI_LIBRERIA.test(testo)) return
    const m = RE_INCLUDI.exec(testo)
    if (m) out.push({ riga: i + 1, percorso: m[1].replace(/\\(.)/g, '$1') })
  })
  return out
}

/** Il grafo delle inclusioni: per ogni file .fav, i file che include. */
export type GrafoInclusioni = Record<string, string[]>

/** La storia a cui appartiene `percorso`: il file «in cima» che include (anche a catena) questo. */
export function radiceDi(percorso: string, grafo: GrafoInclusioni, preferita?: string | null): string {
  const inclusoDa = (f: string): string[] =>
    Object.keys(grafo).filter((g) => grafo[g].some((x) => stessoFile(x, f)))
  let corrente = percorso
  const visti = new Set<string>([chiave(corrente)])
  for (;;) {
    const sopra = inclusoDa(corrente).filter((g) => !visti.has(chiave(g)))
    if (sopra.length === 0) return corrente
    const scelto =
      (preferita && sopra.find((g) => stessoFile(g, preferita))) ||
      sopra.slice().sort((a, b) => nomeFile(a).localeCompare(nomeFile(b), 'it'))[0]
    visti.add(chiave(scelto))
    corrente = scelto
  }
}

/** I file di una storia: la radice e, in ordine d'inclusione, tutti quelli che include. */
export function membriDi(radice: string, grafo: GrafoInclusioni): string[] {
  const out: string[] = []
  const visti = new Set<string>()
  const visita = (f: string): void => {
    if (visti.has(chiave(f))) return
    visti.add(chiave(f))
    out.push(f)
    const chiaveGrafo = Object.keys(grafo).find((g) => stessoFile(g, f))
    for (const x of chiaveGrafo ? grafo[chiaveGrafo] : []) visita(x)
  }
  visita(radice)
  return out
}

/** Un nome di file valido per una storia: niente percorsi, solo lettere, numeri, - _ e spazi. */
export function nomeFileValido(nome: string): string | null {
  const n = nome.trim()
  if (!n) return 'Scrivi un nome.'
  const senza = n.replace(/\.fav$/i, '')
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _\-]*$/u.test(senza)) {
    return 'Il nome può avere lettere, numeri, spazi, - e _ (senza cartelle né punti).'
  }
  return null
}

export function conEstensione(nome: string): string {
  const n = nome.trim()
  return /\.fav$/i.test(n) ? n : n + '.fav'
}
