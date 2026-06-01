// Tipi del protocollo JSON-RPC condivisi fra main, preload e renderer.
// Devono restare allineati a favella_server.py.

export interface RpcRequest {
  jsonrpc: '2.0'
  id?: number | string | null
  method: string
  params?: unknown
}

export interface RpcResponse<T = unknown> {
  jsonrpc: '2.0'
  id: number | string | null
  result?: T
  error?: RpcError
}

export interface RpcError {
  code: number
  message: string
  data?: unknown
}

// Notifiche dal sidecar verso l'IDE (senza id), inoltrate al renderer.
export interface RpcNotification {
  jsonrpc: '2.0'
  method: string
  params?: unknown
}

// --- Payload dei metodi della Fase 0 ---

export interface EngineVersion {
  engine: string
  sidecar: string
  python: string
}

export interface EngineLexicon {
  verbs: string[]
  reserved: string[]
  directions: string[]
}

export interface ServerReady {
  sidecar: string
  engineLoaded: boolean
  engineError: string | null
}

// Eventi che il main inoltra al renderer su un canale unico.
export type EngineEvent =
  | { kind: 'ready'; data: ServerReady }
  | { kind: 'notification'; method: string; params: unknown }
  | { kind: 'status'; status: SidecarStatus; detail?: string }

export type SidecarStatus = 'starting' | 'ready' | 'crashed' | 'restarting' | 'stopped'

// --- Compile & diagnostica (Fase 2) ---

export type Severity = 'error' | 'warning'

export interface Diagnostic {
  message: string
  file: string
  line: number | null
  col: number | null
  severity: Severity
  code: string
  // Posizione best-effort (semantica senza riga certa): niente salto preciso.
  imprecise: boolean
}

export interface WorldSummary {
  rooms: string[]
  objects: string[]
  rulesCount: number
  eventsCount: number
  variables: string[]
  dialogueNodes: number
  start: string | null
}

export interface CompileResult {
  ok: boolean
  errors: Diagnostic[]
  warnings: Diagnostic[]
  worldSummary: WorldSummary | null
}

// --- File system (Fase 1) ---

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

export interface OpenedProject {
  root: string
  tree: FileNode[]
}
