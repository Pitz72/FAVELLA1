import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { Sidecar } from './sidecar'
import { registraFileSystemIPC } from './fsapi'
import type { EngineEvent } from '../shared/protocol'

let mainWindow: BrowserWindow | null = null
let sidecar: Sidecar | null = null

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
