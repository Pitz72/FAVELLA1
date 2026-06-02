import { dialog, ipcMain, BrowserWindow } from 'electron'
import { readdir, readFile, writeFile, stat } from 'fs/promises'
import { join, basename, dirname } from 'path'
import type { FileNode, OpenedProject } from '../shared/protocol'

// Cartelle da non mostrare mai nell'albero del progetto.
const IGNORATE = new Set([
  'node_modules', '.git', '.venv', 'venv', '__pycache__',
  'out', 'release', 'dist', 'dist-engine', '.idea', '.vscode'
])

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

/** Registra gli handler IPC per il file system. Da chiamare a app.whenReady(). */
export function registraFileSystemIPC(): void {
  ipcMain.handle('project:open', async (e): Promise<OpenedProject | null> => {
    const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
    const res = await dialog.showOpenDialog(win!, {
      title: 'Apri cartella progetto FAVELLA',
      properties: ['openDirectory']
    })
    if (res.canceled || res.filePaths.length === 0) return null
    const root = res.filePaths[0]
    return { root, tree: await costruisciAlbero(root) }
  })

  // Nuovo progetto: l'utente sceglie cartella e nome (dialogo «Salva con nome»,
  // che permette anche di creare una cartella nuova), si crea un .fav VUOTO da
  // riempire da zero e si apre la sua cartella come progetto.
  ipcMain.handle(
    'project:new',
    async (e): Promise<(OpenedProject & { openPath: string }) | null> => {
      const win = BrowserWindow.fromWebContents(e.sender) ?? undefined
      const res = await dialog.showSaveDialog(win!, {
        title: 'Nuovo progetto FAVELLA — scegli cartella e nome',
        defaultPath: 'storia.fav',
        filters: [{ name: 'Storia FAVELLA', extensions: ['fav'] }]
      })
      if (res.canceled || !res.filePath) return null
      let file = res.filePath
      if (!file.toLowerCase().endsWith('.fav')) file += '.fav'
      // Crea il file VUOTO solo se non esiste già (non sovrascrivere nulla).
      try {
        await stat(file)
      } catch {
        await writeFile(file, '', 'utf-8')
      }
      const root = dirname(file)
      return { root, tree: await costruisciAlbero(root), openPath: file }
    }
  )

  ipcMain.handle('project:tree', async (_e, root: string): Promise<FileNode[]> => {
    return costruisciAlbero(root)
  })

  ipcMain.handle('fs:read', async (_e, percorso: string): Promise<string> => {
    return readFile(percorso, 'utf-8')
  })

  ipcMain.handle('fs:write', async (_e, percorso: string, contenuto: string): Promise<void> => {
    await writeFile(percorso, contenuto, 'utf-8')
  })

  ipcMain.handle('fs:exists', async (_e, percorso: string): Promise<boolean> => {
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
