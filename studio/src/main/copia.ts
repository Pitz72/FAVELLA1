import { cp, mkdir, readdir, rename, writeFile } from 'fs/promises'
import { basename, dirname, join, relative, resolve, sep } from 'path'

// «Salva il progetto come…»: copia di una cartella-progetto in un'altra. Niente
// Electron qui dentro, così si può provare da solo.

// Cartelle da non portare mai dietro (le stesse che l'albero dei file non mostra).
const IGNORATE = new Set([
  'node_modules', '.git', '.venv', 'venv', '__pycache__',
  'out', 'release', 'dist', 'dist-engine', '.idea', '.vscode'
])

/** True se `figlio` sta dentro `padre` (o è lo stesso percorso). */
export function staDentro(padre: string, figlio: string): boolean {
  const p = resolve(padre)
  const f = resolve(figlio)
  return f === p || f.startsWith(p + sep)
}

/** Una cartella è «vuota» se non ha niente di visibile (i file nascosti non contano). */
export async function cartellaVuota(percorso: string): Promise<boolean> {
  try {
    const voci = await readdir(percorso)
    return voci.every((v) => v.startsWith('.'))
  } catch {
    return true // non esiste ancora: la si crea
  }
}

/**
 * Copia `da` dentro `a` (che dev'essere vuota o nuova) e poi scrive sopra i testi dati in
 * `testi` (percorso assoluto nel progetto di partenza → nuovo contenuto): sono le
 * modifiche non ancora salvate.
 */
export async function copiaProgetto(
  da: string,
  a: string,
  testi: Record<string, string> = {}
): Promise<void> {
  await mkdir(a, { recursive: true })
  await cp(da, a, {
    recursive: true,
    filter: (origine) => {
      const nome = basename(origine)
      if (resolve(origine) === resolve(da)) return true
      return !(nome.startsWith('.') || IGNORATE.has(nome))
    }
  })
  for (const [percorso, contenuto] of Object.entries(testi)) {
    if (!staDentro(da, percorso)) continue
    const destinazione = join(a, relative(resolve(da), resolve(percorso)))
    await mkdir(dirname(destinazione), { recursive: true })
    const tmp = destinazione + '.tmp-favella'
    await writeFile(tmp, contenuto, 'utf-8')
    await rename(tmp, destinazione)
  }
}
