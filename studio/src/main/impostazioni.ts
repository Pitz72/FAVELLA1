import { app } from 'electron'
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

// Le impostazioni dell'app che il processo principale deve conoscere prima del renderer
// (le preferenze d'interfaccia stanno invece nel localStorage del renderer).

export interface Impostazioni {
  /** null = non ancora chiesto; true/false = la risposta di chi usa Studio. */
  aggiornamentiAutomatici: boolean | null
}

const PREDEFINITE: Impostazioni = { aggiornamentiAutomatici: null }

function percorso(): string {
  return join(app.getPath('userData'), 'impostazioni.json')
}

export function leggiImpostazioni(): Impostazioni {
  try {
    const dati = JSON.parse(readFileSync(percorso(), 'utf-8')) as Partial<Impostazioni>
    return {
      aggiornamentiAutomatici:
        typeof dati.aggiornamentiAutomatici === 'boolean' ? dati.aggiornamentiAutomatici : null
    }
  } catch {
    return { ...PREDEFINITE }
  }
}

export function scriviImpostazioni(cambi: Partial<Impostazioni>): void {
  const file = percorso()
  const tmp = file + '.tmp'
  try {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(tmp, JSON.stringify({ ...leggiImpostazioni(), ...cambi }, null, 2), 'utf-8')
    renameSync(tmp, file)
  } catch {
    /* best-effort: al prossimo avvio si richiede */
  }
}
