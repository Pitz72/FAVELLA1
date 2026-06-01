import { contextBridge, ipcRenderer } from 'electron'
import type {
  EngineEvent,
  SidecarStatus,
  FileNode,
  OpenedProject
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
