import { contextBridge, ipcRenderer } from 'electron'
import type {
  EngineEvent,
  SidecarStatus,
  FileNode,
  OpenedProject,
  CompileResult,
  SessionResult,
  WorldGraph,
  WorldSnapshot,
  SessionHistory,
  Savegame,
  Outline,
  SerializeSpec,
  SerializeResult
} from '../shared/protocol'

// Superficie minima e tipizzata esposta al renderer. Nessun accesso diretto a
// Node o al processo figlio: tutto passa per IPC verso il main.
const api = {
  /** Chiama un metodo RPC del motore FAVELLA via sidecar. */
  rpc<T = unknown>(method: string, params?: unknown): Promise<T> {
    return ipcRenderer.invoke('rpc', method, params)
  },
  /** Stato corrente del sidecar. */
  sidecarStatus(): Promise<SidecarStatus> {
    return ipcRenderer.invoke('sidecar:status')
  },
  /** Forza un riavvio del sidecar. */
  restartSidecar(): Promise<void> {
    return ipcRenderer.invoke('sidecar:restart')
  },
  /**
   * Compila un file .fav e restituisce diagnostiche strutturate (Fase 2).
   * Se `source` è dato, compila il buffer live invece del contenuto su disco
   * (gli Includi sono comunque risolti dal disco rispetto alla cartella di `path`).
   */
  compile(path: string, source?: string): Promise<CompileResult> {
    return ipcRenderer.invoke('rpc', 'compile', { path, source })
  },
  // --- Sessione di gioco (Fase 3) ---
  /**
   * Avvia una partita compilando `path` (o il buffer live `source`, se dato).
   * Restituisce l'output iniziale e lo stato; su errore di compilazione,
   * `ok=false` con le diagnostiche d'autore.
   */
  startGame(path: string, source?: string): Promise<SessionResult> {
    return ipcRenderer.invoke('rpc', 'session.start', { path, source })
  },
  /** Invia un comando alla partita attiva (anche il numero/testo di un'opzione di dialogo). */
  sendCommand(command: string): Promise<SessionResult> {
    return ipcRenderer.invoke('rpc', 'session.send', { command })
  },
  /** Riavvia la partita rigiocando lo stesso sorgente da cui è nata. */
  resetGame(): Promise<SessionResult> {
    return ipcRenderer.invoke('rpc', 'session.reset', {})
  },

  // --- Mappa del mondo e Inspector (Fase 4) ---
  /**
   * Topologia del mondo per la Mappa. Senza `path` usa il mondo della partita
   * attiva; con `path` (+ `source`) compila il file/buffer per un'anteprima.
   */
  worldGraph(path?: string, source?: string): Promise<WorldGraph> {
    return ipcRenderer.invoke('rpc', 'world.graph', path ? { path, source } : {})
  },
  /** Stato live della partita attiva (posizione, turno, variabili, inventario, oggetti). */
  worldSnapshot(): Promise<WorldSnapshot> {
    return ipcRenderer.invoke('rpc', 'world.snapshot', {})
  },
  /** [Fase 5] History della partita (uno snapshot per turno) per il debugger. */
  sessionHistory(): Promise<SessionHistory> {
    return ipcRenderer.invoke('rpc', 'session.history', {})
  },

  // --- Editor visuali (Fase 6a) ---
  /**
   * Modello editabile di stanze/oggetti con lo span sorgente di ogni frase.
   * Senza `path` usa la storia della partita attiva; con `path` (+ `source`)
   * legge il file/buffer live.
   */
  worldOutline(path?: string, source?: string): Promise<Outline> {
    return ipcRenderer.invoke('rpc', 'world.outline', path ? { path, source } : {})
  },
  /** Genera la frase .fav canonica da una specifica strutturata (round-trip, scrittura). */
  serializeStatement(spec: SerializeSpec): Promise<SerializeResult> {
    return ipcRenderer.invoke('rpc', 'outline.serialize', spec)
  },

  // --- Salvataggio partite (command-log) ---
  /** Esporta il salvataggio della partita attiva (sequenza di comandi + storia). */
  gameSave(): Promise<Savegame> {
    return ipcRenderer.invoke('rpc', 'session.save', {})
  },
  /** Carica un salvataggio: ricompila e ri-esegue i comandi. */
  gameLoad(save: Savegame): Promise<SessionResult> {
    return ipcRenderer.invoke('rpc', 'session.load', { save })
  },
  /** Mostra il dialogo «Salva con nome» e scrive il `.favsave`. */
  writeSaveFile(save: Savegame): Promise<{ ok: boolean; path?: string }> {
    return ipcRenderer.invoke('game:writeSave', save)
  },
  /** Mostra il dialogo «Apri» e legge un `.favsave` (null se annullato). */
  readSaveFile(): Promise<Savegame | null> {
    return ipcRenderer.invoke('game:readSave')
  },

  // --- Finestra di gioco dedicata (stile Godot) ---
  /** [IDE] Apre la finestra di gioco passando il file attivo (e il buffer live). */
  openGameWindow(path: string, source?: string): Promise<void> {
    return ipcRenderer.invoke('game:open', { path, source })
  },
  /** [finestra di gioco] Recupera il payload di lancio (path + buffer) dall'IDE. */
  gameLaunchPayload(): Promise<{ path: string; source?: string } | null> {
    return ipcRenderer.invoke('game:launchPayload')
  },
  /** [finestra di gioco] Notifica di rilancio (l'IDE ha ripremuto ▶ Gioca). */
  onGameRelaunch(cb: (payload: { path: string; source?: string } | null) => void): () => void {
    const handler = (_e: unknown, payload: { path: string; source?: string } | null): void => cb(payload)
    ipcRenderer.on('game-relaunch', handler)
    return () => ipcRenderer.removeListener('game-relaunch', handler)
  },

  // --- Guardia «modifiche non salvate» in uscita ---
  /** Conferma la chiusura della finestra IDE (dopo aver gestito i file sporchi). */
  confirmClose(): Promise<void> {
    return ipcRenderer.invoke('app:confirmClose')
  },
  /** Il main chiede al renderer di gestire la chiusura (guardia file non salvati). */
  onRequestClose(callback: () => void): () => void {
    const handler = (): void => callback()
    ipcRenderer.on('app:request-close', handler)
    return () => ipcRenderer.removeListener('app:request-close', handler)
  },

  /** Sottoscrive gli eventi del motore (ready, notifiche, cambi di stato). */
  onEngineEvent(callback: (event: EngineEvent) => void): () => void {
    const handler = (_e: unknown, event: EngineEvent): void => callback(event)
    ipcRenderer.on('engine-event', handler)
    return () => ipcRenderer.removeListener('engine-event', handler)
  },

  // --- File system (Fase 1) ---
  /** Apre il dialog di sistema per scegliere una cartella-progetto. */
  openProject(): Promise<OpenedProject | null> {
    return ipcRenderer.invoke('project:open')
  },
  /** Crea un nuovo progetto: cartella + nome scelti dall'utente, .fav vuoto, e lo apre. */
  newProject(): Promise<(OpenedProject & { openPath: string }) | null> {
    return ipcRenderer.invoke('project:new')
  },
  /** Ricarica l'albero dei file di un progetto già aperto. */
  refreshTree(root: string): Promise<FileNode[]> {
    return ipcRenderer.invoke('project:tree', root)
  },
  /** Legge il contenuto testuale di un file. */
  readFile(path: string): Promise<string> {
    return ipcRenderer.invoke('fs:read', path)
  },
  /** Scrive il contenuto testuale di un file. */
  writeFile(path: string, content: string): Promise<void> {
    return ipcRenderer.invoke('fs:write', path, content)
  }
}

contextBridge.exposeInMainWorld('favella', api)

export type FavellaApi = typeof api
