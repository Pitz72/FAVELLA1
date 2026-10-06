import { app, BrowserWindow, ipcMain, shell, dialog, Menu } from 'electron'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { Sidecar } from './sidecar'
import { registraFileSystemIPC, scriviFileAtomico } from './fsapi'
import { avviaAggiornamenti } from './updater'
import type { EngineEvent, Savegame } from '../shared/protocol'

let mainWindow: BrowserWindow | null = null
let gameWindow: BrowserWindow | null = null
let sidecar: Sidecar | null = null
// Payload (path + buffer live + buffer degli altri file della storia) passato dall'IDE
// alla finestra di gioco al lancio.
let gameLaunch: { path: string; source?: string; sources?: Record<string, string> } | null = null
// Chiusura in due tempi. Ogni richiesta di chiusura (la finestra, Alt+F4, Cmd+Q, un
// aggiornamento) passa prima dal renderer, che conosce i file non salvati e chiede; solo
// quando il renderer conferma (`app:confirmClose`) si ferma il motore e si esce davvero.
// Prima della 1.2 il motore si fermava SUBITO all'uscita: se poi si annullava, Studio
// restava aperto senza motore.
let uscitaConfermata = false
let uscitaInCorso = false

/** Ferma il motore e chiude l'app (dopo la conferma del renderer). */
function esciDavvero(): void {
  if (uscitaInCorso) return
  uscitaInCorso = true
  const s = sidecar
  sidecar = null
  void (s ? s.stop() : Promise.resolve()).finally(() => {
    uscitaConfermata = true
    app.quit()
  })
}

/** Chiede al renderer di gestire la chiusura; senza finestra si esce subito. */
function chiediChiusura(): void {
  // Un renderer andato in crash non può più rispondere: si esce senza chiedere.
  if (
    mainWindow &&
    !mainWindow.isDestroyed() &&
    !mainWindow.webContents.isDestroyed() &&
    !mainWindow.webContents.isCrashed()
  ) {
    mainWindow.webContents.send('app:request-close')
  } else {
    esciDavvero()
  }
}

// Chi sta usando la partita nel motore: lo Studio (la Prova) o la finestra di gioco. La
// sessione è una sola: quando passa all'altra finestra, quella di prima lo deve sapere.
type Proprietario = 'studio' | 'finestra'
function annunciaProprietario(chi: Proprietario): void {
  for (const w of [mainWindow, gameWindow]) {
    if (w && !w.isDestroyed() && !w.webContents.isDestroyed()) w.webContents.send('game:owner', chi)
  }
}

// Icona della finestra (Linux e sviluppo; su Windows/macOS la dà il pacchetto).
// In produzione il file può non esserci: allora si lascia quella del sistema.
function iconaFinestra(): string | undefined {
  const percorso = join(__dirname, '../../branding/icone/icon.png')
  return existsSync(percorso) ? percorso : undefined
}

// La barra dei menu (File, Modifica…) non serve: Studio ha i suoi comandi dentro la
// finestra, e una barra vuota a metà schermo è solo rumore. Su macOS la barra dei menu
// è del sistema e da lì passano ⌘C, ⌘V, ⌘Q: se ne lascia una minima, con i soli ruoli.
function impostaMenu(): void {
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }])
    )
  } else {
    Menu.setApplicationMenu(null)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#1a1a1e',
    title: 'Favella Studio',
    icon: iconaFinestra(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  mainWindow.setMenuBarVisibility(false)

  // Senza menu non ci sono più le scorciatoie degli strumenti di sviluppo: in sviluppo
  // (non nell'app installata) si rimettono a mano.
  if (!app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (_e, input) => {
      const aperti = input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')
      if (input.type === 'keyDown' && aperti) mainWindow?.webContents.toggleDevTools()
    })
  }

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Guardia «modifiche non salvate»: vedi chiediChiusura / esciDavvero.
  mainWindow.on('close', (e) => {
    if (uscitaConfermata) return
    e.preventDefault()
    chiediChiusura()
  })

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
    icon: iconaFinestra(),
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
    // La partita torna libera: lo Studio può riprenderla nella Prova.
    annunciaProprietario('studio')
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
  impostaMenu()
  // Canale RPC unico: il renderer chiede, il main inoltra al sidecar.
  ipcMain.handle('rpc', async (_e, method: string, params: unknown) => {
    if (!sidecar) throw new Error('Sidecar non inizializzato')
    return sidecar.request(method, params)
  })
  ipcMain.handle('sidecar:status', () => sidecar?.getStatus() ?? 'stopped')
  ipcMain.handle('sidecar:lastError', () => sidecar?.getLastStderr() ?? '')
  ipcMain.handle('sidecar:restart', async () => {
    await sidecar?.stop()
    startSidecar()
  })
  ipcMain.on('game:claim', (_e, chi: Proprietario) => annunciaProprietario(chi))

  // Finestra di gioco dedicata: l'IDE passa path + buffer live, poi la finestra
  // li recupera al caricamento e avvia la partita.
  ipcMain.handle('game:open', (_e, payload: { path: string; source?: string; sources?: Record<string, string> }) => {
    gameLaunch = payload
    createGameWindow()
    annunciaProprietario('finestra')
  })
  ipcMain.handle('game:launchPayload', () => gameLaunch)

  // La finestra di gioco segnala un avanzamento: inoltralo all'IDE perché
  // ricarichi i pannelli live (Stato/Debug/Mappa) dal sidecar condiviso.
  ipcMain.on('game:advanced', () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('game-advanced')
    }
  })

  // Salvataggio partite su file .favsave (dialoghi nativi + I/O sul main).
  ipcMain.handle('game:writeSave', async (_e, save: unknown) => {
    const win = gameWindow ?? mainWindow ?? undefined
    const res = await dialog.showSaveDialog(win!, {
      title: 'Salva partita',
      defaultPath: 'partita.favsave',
      filters: [{ name: 'Partita Favella', extensions: ['favsave'] }]
    })
    if (res.canceled || !res.filePath) return { ok: false }
    await scriviFileAtomico(res.filePath, JSON.stringify(save, null, 2))
    return { ok: true, path: res.filePath }
  })
  ipcMain.handle('game:writeExport', async (_e, payload: { html: string; name: string }) => {
    const win = mainWindow ?? undefined
    const res = await dialog.showSaveDialog(win!, {
      title: 'Esporta gioco (HTML)',
      defaultPath: (payload.name || 'gioco') + '.html',
      filters: [{ name: 'Gioco FAVELLA (HTML)', extensions: ['html'] }]
    })
    if (res.canceled || !res.filePath) return { ok: false }
    await scriviFileAtomico(res.filePath, payload.html)
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
    // Validazione di forma: un file corrotto o di formato estraneo non deve
    // fallire in silenzio (l'utente deve sapere PERCHÉ il caricamento non va).
    try {
      const save = JSON.parse(await readFile(res.filePaths[0], 'utf-8')) as Partial<Savegame>
      const valido =
        typeof save === 'object' && save !== null &&
        typeof save.path === 'string' &&
        Array.isArray(save.commands) &&
        save.commands.every((c) => typeof c === 'string') &&
        typeof save.turn === 'number'
      if (!valido) throw new Error('formato non riconosciuto')
      return save
    } catch (err) {
      dialog.showMessageBox(win!, {
        type: 'error',
        title: 'Caricamento partita',
        message: 'Il file di salvataggio è danneggiato o non è una partita Favella.',
        detail: err instanceof Error ? err.message : String(err)
      })
      return null
    }
  })

  // Guardia «modifiche non salvate»: il dialogo è un modal React integrato nel
  // renderer (stile IDE). Qui resta solo la conferma di chiusura effettiva.
  ipcMain.handle('app:confirmClose', () => {
    esciDavvero()
  })

  registraFileSystemIPC()

  startSidecar()
  createWindow()
  avviaAggiornamenti(() => mainWindow, esciDavvero)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit() // l'arresto del sidecar è centralizzato in before-quit
  }
})

// Uscita dall'app (Cmd+Q, menu di sistema): come la chiusura della finestra, passa prima
// dalla guardia «modifiche non salvate». Lo stop del motore (graduale, max ~3 s, niente
// processi Python orfani) avviene in esciDavvero, dopo la conferma.
app.on('before-quit', (e) => {
  if (uscitaConfermata) return
  e.preventDefault()
  chiediChiusura()
})
