import { app, dialog, ipcMain, shell, BrowserWindow } from 'electron'
import { readdir, readFile, writeFile, rename, stat, mkdir, copyFile } from 'fs/promises'
import { join, basename, dirname, resolve, sep } from 'path'
import type { FileNode, OpenedProject } from '../shared/protocol'
import { copiaProgetto, cartellaVuota, staDentro } from './copia'

// Cartelle da non mostrare mai nell'albero del progetto.
const IGNORATE = new Set([
  'node_modules', '.git', '.venv', 'venv', '__pycache__',
  'out', 'release', 'dist', 'dist-engine', '.idea', '.vscode'
])

// Radice del progetto aperto: gli handler fs:read/fs:write accettano SOLO path
// al suo interno (difesa in profondità: il renderer è sandboxed, ma il main non
// deve comunque fare da proxy verso il filesystem globale).
let projectRoot: string | null = null

function dentroIlProgetto(percorso: string): boolean {
  if (!projectRoot) return false
  const risolto = resolve(percorso)
  const root = resolve(projectRoot)
  return risolto === root || risolto.startsWith(root + sep)
}

function verificaPercorso(percorso: string): void {
  if (!dentroIlProgetto(percorso)) {
    throw new Error('Accesso negato: il percorso è fuori dalla cartella del progetto.')
  }
}

/**
 * Scrittura ATOMICA: scrive su un file temporaneo accanto alla destinazione e
 * poi lo rinomina (rename è atomico sullo stesso volume). Un crash a metà
 * scrittura non può troncare il file di destinazione.
 */
export async function scriviFileAtomico(percorso: string, contenuto: string): Promise<void> {
  const tmp = percorso + '.tmp-favella'
  await writeFile(tmp, contenuto, 'utf-8')
  await rename(tmp, percorso)
}

async function costruisciAlbero(dir: string): Promise<FileNode[]> {
  let voci
  try {
    voci = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const nodi: FileNode[] = []
  for (const v of voci) {
    if (v.name.startsWith('.') || IGNORATE.has(v.name)) continue
    const percorso = join(dir, v.name)
    if (v.isDirectory()) {
      nodi.push({
        name: v.name,
        path: percorso,
        type: 'dir',
        children: await costruisciAlbero(percorso)
      })
    } else if (v.isFile()) {
      nodi.push({ name: v.name, path: percorso, type: 'file' })
    }
  }
  // Cartelle prima, poi file; ciascun gruppo in ordine alfabetico.
  nodi.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name, 'it')
  })
  return nodi
}

/**
 * Il testo di partenza di una storia nuova: una stanza con la sua descrizione e il
 * giocatore già lì. Così la storia compila subito e i pannelli (Mondo, Personaggi,
 * Regole, Mappa, Prova) hanno da che cosa partire. Il titolo viene dal nome del file.
 */
export function modelloStoria(percorsoFile: string): string {
  const base = basename(percorsoFile).replace(/\.fav$/i, '').replace(/[-_]+/g, ' ').trim()
  const titolo = base ? base.charAt(0).toUpperCase() + base.slice(1) : 'La mia storia'
  return [
    `# ${titolo}`,
    '# Scrivi qui la tua storia, oppure usa i pannelli: Mondo, Personaggi, Regole.',
    '',
    'La piazza è una stanza.',
    'La descrizione della piazza è "Sei al centro di una piazza silenziosa.".',
    'Il giocatore comincia in piazza.',
    ''
  ].join('\n')
}

// [1.2.1] Le risorse che viaggiano con l'app: nel pacchetto stanno in resources/, in
// sviluppo nel repository (la guida in studio/guida/, la storia d'esempio in esempi/).
function risorsa(nelPacchetto: string, inSviluppo: string): string {
  return app.isPackaged ? join(process.resourcesPath, nelPacchetto) : resolve(app.getAppPath(), inSviluppo)
}
const GUIDA_PDF = (): string => risorsa(join('guida', 'guida-favella-studio.pdf'), join('guida', 'guida-favella-studio.pdf'))
const ESEMPIO = (): string => risorsa(join('esempi', 'la-casa-di-via-stradivari'), join('..', 'esempi', 'materiale-didattico'))

/** Registra gli handler IPC per il file system. Da chiamare a app.whenReady(). */
export function registraFileSystemIPC(): void {
  // [1.2.1] «Guida di Favella Studio»: il PDF incluso nell'app, nel lettore del sistema.
  ipcMain.handle('help:openGuide', async (): Promise<{ ok: boolean; message?: string }> => {
    const pdf = GUIDA_PDF()
    try {
      await stat(pdf)
    } catch {
      return { ok: false, message: 'Non trovo la guida in questa installazione: si scarica anche da www.favella.eu/studio.' }
    }
    const errore = await shell.openPath(pdf)
    return errore ? { ok: false, message: 'Non riesco ad aprire la guida: ' + errore } : { ok: true }
  })

  // [1.2.1] «Apri la storia d'esempio»: «La Casa di Via Stradivari», quella della guida.
  // Le risorse dell'app non si possono modificare: la prima volta la si copia nei
  // Documenti (Favella Studio/La Casa di Via Stradivari); le volte dopo si riapre la
  // copia, con le modifiche che ci hai fatto.
  ipcMain.handle('project:openExample', async (): Promise<(OpenedProject & { openPath: string }) | null> => {
    const dest = join(app.getPath('documents'), 'Favella Studio', 'La Casa di Via Stradivari')
    let esiste = true
    try {
      await stat(join(dest, 'storia.fav'))
    } catch {
      esiste = false
    }
    if (!esiste) {
      const sorgente = ESEMPIO()
      await mkdir(dest, { recursive: true })
      for (const nome of await readdir(sorgente)) {
        if (nome.toLowerCase().endsWith('.fav')) await copyFile(join(sorgente, nome), join(dest, nome))
      }
    }
    projectRoot = dest
    return { root: dest, tree: await costruisciAlbero(dest), openPath: join(dest, 'storia.fav') }
  })

  ipcMain.handle('project:open', async (e): Promise<OpenedProject | null> => {
    const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
    const res = await dialog.showOpenDialog(win!, {
      title: 'Apri cartella progetto FAVELLA',
      properties: ['openDirectory']
    })
    if (res.canceled || res.filePaths.length === 0) return null
    const root = res.filePaths[0]
    projectRoot = root
    return { root, tree: await costruisciAlbero(root) }
  })


  // Apri una storia: il selettore di CARTELLE di Windows non mostra i file, quindi qui si
  // sceglie direttamente un .fav; la sua cartella diventa il progetto e il file si apre.
  // (Introdotto nella 1.1.1, tolto per errore nella 1.1.3, ripristinato nella 1.2.0.)
  ipcMain.handle(
    'project:openFile',
    async (e): Promise<(OpenedProject & { openPath: string }) | null> => {
      const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
      const res = await dialog.showOpenDialog(win!, {
        title: 'Apri una storia FAVELLA',
        properties: ['openFile'],
        filters: [
          { name: 'Storia FAVELLA', extensions: ['fav'] },
          { name: 'Tutti i file', extensions: ['*'] }
        ]
      })
      if (res.canceled || res.filePaths.length === 0) return null
      const file = res.filePaths[0]
      const root = dirname(file)
      projectRoot = root
      return { root, tree: await costruisciAlbero(root), openPath: file }
    }
  )

  // Nuovo progetto: l'utente sceglie cartella e nome (dialogo «Salva con nome»,
  // che permette anche di creare una cartella nuova), si crea un .fav col modello
  // di partenza e si apre la sua cartella come progetto.
  ipcMain.handle(
    'project:new',
    async (e): Promise<(OpenedProject & { openPath: string }) | null> => {
      const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
      const res = await dialog.showSaveDialog(win!, {
        title: 'Nuova storia — scegli la cartella e il nome del file',
        defaultPath: 'storia.fav',
        filters: [{ name: 'Storia FAVELLA', extensions: ['fav'] }]
      })
      if (res.canceled || !res.filePath) return null
      let file = res.filePath
      if (!file.toLowerCase().endsWith('.fav')) file += '.fav'
      // Crea il file col modello iniziale solo se non esiste già (non sovrascrivere nulla).
      try {
        await stat(file)
      } catch {
        await scriviFileAtomico(file, modelloStoria(file))
      }
      const root = dirname(file)
      projectRoot = root
      return { root, tree: await costruisciAlbero(root), openPath: file }
    }
  )

  // «Salva con nome»: il dialogo di sistema, aperto nella cartella del progetto. Il file
  // deve restare DENTRO il progetto (altrimenti la scrittura sarebbe negata e gli
  // «Includi» relativi si romperebbero): per una copia altrove c'è «Salva il progetto come…».
  ipcMain.handle('dialog:savePath', async (e, nomeProposto: string): Promise<string | null> => {
    if (!projectRoot) return null
    const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
    const res = await dialog.showSaveDialog(win!, {
      title: 'Salva con nome',
      defaultPath: join(projectRoot, nomeProposto || 'storia.fav'),
      filters: [{ name: 'Storia FAVELLA', extensions: ['fav'] }]
    })
    if (res.canceled || !res.filePath) return null
    let file = res.filePath
    if (!file.toLowerCase().endsWith('.fav')) {
      file += '.fav'
      // Il dialogo ha già chiesto conferma per il nome scelto, non per quello con l'estensione.
      try {
        await stat(file)
        const r = await dialog.showMessageBox(win!, {
          type: 'question',
          buttons: ['Sostituisci', 'Annulla'],
          defaultId: 1,
          cancelId: 1,
          title: 'Salva con nome',
          message: `«${basename(file)}» esiste già. Lo sostituisco?`
        })
        if (r.response !== 0) return null
      } catch {
        /* non esiste: nessuna conferma da chiedere */
      }
    }
    if (!dentroIlProgetto(file)) {
      await dialog.showMessageBox(win!, {
        type: 'info',
        title: 'Salva con nome',
        message: 'Scegli un posto dentro la cartella del progetto.',
        detail:
          'Per salvare una copia della storia in un’altra cartella usa «Salva il progetto come…»: ' +
          'copia tutti i file della storia in una cartella nuova e la apre.'
      })
      return null
    }
    return file
  })

  // «Salva il progetto come…»: copia tutta la cartella in una cartella nuova (o vuota) e
  // passa a lavorare lì. I testi non salvati arrivano dal renderer (`testi`) e finiscono
  // nella COPIA: il progetto di partenza resta com'era sul disco.
  ipcMain.handle(
    'project:copyTo',
    async (e, testi: Record<string, string>): Promise<{ root: string; tree: FileNode[]; oldRoot: string } | null> => {
      if (!projectRoot) return null
      const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
      const res = await dialog.showOpenDialog(win!, {
        title: 'Salva il progetto come… — scegli una cartella nuova o vuota',
        buttonLabel: 'Salva qui',
        properties: ['openDirectory', 'createDirectory']
      })
      if (res.canceled || res.filePaths.length === 0) return null
      const destinazione = res.filePaths[0]
      if (staDentro(projectRoot, destinazione)) {
        await dialog.showMessageBox(win!, {
          type: 'info',
          title: 'Salva il progetto come…',
          message: 'La cartella di destinazione è dentro questo stesso progetto.',
          detail: 'Scegline una fuori: crea una cartella nuova e scegli quella.'
        })
        return null
      }
      if (!(await cartellaVuota(destinazione))) {
        await dialog.showMessageBox(win!, {
          type: 'info',
          title: 'Salva il progetto come…',
          message: 'La cartella scelta non è vuota.',
          detail: 'Per non sovrascrivere niente, scegli una cartella vuota o creane una nuova.'
        })
        return null
      }
      const oldRoot = projectRoot
      await copiaProgetto(oldRoot, destinazione, testi)
      projectRoot = destinazione
      return { root: destinazione, tree: await costruisciAlbero(destinazione), oldRoot }
    }
  )

  ipcMain.handle('project:tree', async (_e, root: string): Promise<FileNode[]> => {
    if (!dentroIlProgetto(root)) return []
    return costruisciAlbero(root)
  })

  ipcMain.handle('fs:read', async (_e, percorso: string): Promise<string> => {
    verificaPercorso(percorso)
    return readFile(percorso, 'utf-8')
  })

  ipcMain.handle('fs:write', async (_e, percorso: string, contenuto: string): Promise<void> => {
    verificaPercorso(percorso)
    await scriviFileAtomico(percorso, contenuto)
  })

  ipcMain.handle('fs:exists', async (_e, percorso: string): Promise<boolean> => {
    if (!dentroIlProgetto(percorso)) return false
    try {
      await stat(percorso)
      return true
    } catch {
      return false
    }
  })

  // Util di comodo per il renderer.
  ipcMain.handle('path:basename', (_e, percorso: string): string => basename(percorso))
}
