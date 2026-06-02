import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { Sidecar } from './sidecar'
import { registraFileSystemIPC } from './fsapi'
import type { EngineEvent } from '../shared/protocol'

let mainWindow: BrowserWindow | null = null
let gameWindow: BrowserWindow | null = null
let sidecar: Sidecar | null = null
// Payload (path + buffer live) passato dall'IDE alla finestra di gioco al lancio.
let gameLaunch: { path: string; source?: string } | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#1a1a1e',
    title: 'Favella Studio',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Apri i link esterni nel browser di sistema, non in una finestra Electron.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Dev: URL del renderer servito da Vite (HMR). Prod: file statico buildato.
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createGameWindow(): void {
  // Finestra di gioco dedicata (stile Godot): stessa build del renderer, caricata
  // con l'hash '#game' che ne seleziona la radice React (vedi main.tsx).
  if (gameWindow && !gameWindow.isDestroyed()) {
    gameWindow.focus()
    gameWindow.webContents.send('game-relaunch', gameLaunch)
    return
  }
  gameWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 820,
    minHeight: 560,
    show: false,
    backgroundColor: '#15151a',
    title: 'Favella — Gioco',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  gameWindow.setMenuBarVisibility(false)
  gameWindow.on('ready-to-show', () => gameWindow?.show())
  gameWindow.on('closed', () => {
    gameWindow = null
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    gameWindow.loadURL(`${devUrl}#game`)
  } else {
    gameWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'game' })
  }
}

function startSidecar(): void {
  const emit = (event: EngineEvent): void => {
    // In chiusura la finestra può essere già distrutta: non scriverci sopra.
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('engine-event', event)
    }
  }
  sidecar = new Sidecar(emit)
  sidecar.start()
}

app.whenReady().then(() => {
  // Canale RPC unico: il renderer chiede, il main inoltra al sidecar.
  ipcMain.handle('rpc', async (_e, method: string, params: unknown) => {
    if (!sidecar) throw new Error('Sidecar non inizializzato')
    return sidecar.request(method, params)
  })
  ipcMain.handle('sidecar:status', () => sidecar?.getStatus() ?? 'stopped')
  ipcMain.handle('sidecar:restart', () => {
    sidecar?.stop()
    startSidecar()
  })

  // Finestra di gioco dedicata: l'IDE passa path + buffer live, poi la finestra
  // li recupera al caricamento e avvia la partita.
  ipcMain.handle('game:open', (_e, payload: { path: string; source?: string }) => {
    gameLaunch = payload
    createGameWindow()
  })
  ipcMain.handle('game:launchPayload', () => gameLaunch)

  // Salvataggio partite su file .favsave (dialoghi nativi + I/O sul main).
  ipcMain.handle('game:writeSave', async (_e, save: unknown) => {
    const win = gameWindow ?? mainWindow ?? undefined
    const res = await dialog.showSaveDialog(win!, {
      title: 'Salva partita',
      defaultPath: 'partita.favsave',
      filters: [{ name: 'Partita Favella', extensions: ['favsave'] }]
    })
    if (res.canceled || !res.filePath) return { ok: false }
    await writeFile(res.filePath, JSON.stringify(save, null, 2), 'utf-8')
    return { ok: true, path: res.filePath }
  })
  ipcMain.handle('game:readSave', async () => {
    const win = gameWindow ?? mainWindow ?? undefined
    const res = await dialog.showOpenDialog(win!, {
      title: 'Carica partita',
      properties: ['openFile'],
      filters: [{ name: 'Partita Favella', extensions: ['favsave'] }]
    })
    if (res.canceled || res.filePaths.length === 0) return null
    try {
      return JSON.parse(await readFile(res.filePaths[0], 'utf-8'))
    } catch {
      return null
    }
  })

  registraFileSystemIPC()

  startSidecar()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    sidecar?.stop()
    app.quit()
  }
})

app.on('before-quit', () => sidecar?.stop())
