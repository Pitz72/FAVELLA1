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

// --- Sessione di gioco (Fase 3) ---

export type Outcome = 'vinta' | 'persa' | 'terminata'

// Un'opzione di dialogo proponibile al nodo corrente (già filtrata e resa).
export interface DialogueOption {
  index: number
  text: string
}

// Istantanea read-only dello stato di gioco, allineata a _stato_partita() del sidecar.
export interface GameState {
  gameOver: boolean
  outcome: Outcome | null
  inDialogue: boolean
  dialogueOptions: DialogueOption[]
  room: string | null
  turn: number
}

export interface SessionResult {
  ok: boolean
  output: string
  running: boolean
  state: GameState | null
  // Presenti solo quando ok=false: diagnostiche d'autore (perché non si gioca).
  errors?: Diagnostic[]
}

// --- Mappa del mondo e Inspector (Fase 4) ---

export interface GraphRoom {
  id: string
  name: string
  isStart: boolean
}

export interface GraphEdge {
  from: string
  to: string
  direction: string
}

export interface WorldGraph {
  ok: boolean
  rooms: GraphRoom[]
  edges: GraphEdge[]
  // Presenti solo quando ok=false (compilazione fallita in anteprima).
  errors?: Diagnostic[]
}

export type VariableKind = 'stato' | 'contatore'
export type ObjectKind = 'oggetto' | 'contenitore' | 'supporto' | 'personaggio'

export interface SnapVariable {
  name: string
  value: string | number | null
  kind: VariableKind
}

export interface SnapObject {
  id: string
  name: string
  positionId: string | null
  positionLabel: string | null
  properties: string[]
  kind: ObjectKind
}

export interface WorldSnapshot {
  currentRoom: string | null
  currentRoomName: string | null
  turn: number
  status: 'in_corso' | Outcome
  inDialogue: boolean
  // [Livello 7] Capacità di trasporto: oggetti portati / massimo (null = illimitata).
  carryUsed: number
  carryMax: number | null
  variables: SnapVariable[]
  inventory: { id: string; name: string }[]
  objects: SnapObject[]
}

// --- Debugger passo-passo (Fase 5) ---

// Uno snapshot per turno con il comando che l'ha prodotto (null = stato iniziale).
export interface DebugEntry {
  turn: number
  command: string | null
  snapshot: WorldSnapshot
}

export interface SessionHistory {
  entries: DebugEntry[]
}

// --- Salvataggio partite (command-log) ---
export interface Savegame {
  version: number
  path: string
  source: string | null
  commands: string[]
  turn: number
}

// --- Editor visuali (Fase 6a): outline + serializzazione ---

// Ancora sorgente di una frase: file + riga iniziale/finale nel sorgente
// ORIGINALE (rimappato dagli Includi). In multi-file il file è indispensabile.
export interface OutlineSpan {
  file: string
  line: number
  endLine: number
}

export interface OutlineExit {
  direction: string
  to: string
  toName: string
  span: OutlineSpan | null
  // True = auto-ritorno implicito (nessuna frase propria; si edita l'originale).
  implicit: boolean
}

export interface OutlineRoom {
  id: string
  name: string
  isStart: boolean
  defSpan: OutlineSpan | null
  descSpan: OutlineSpan | null
  descConditional: boolean
  description: string
  exits: OutlineExit[]
}

export interface OutlineProperty {
  name: string
  span: OutlineSpan | null
}

export interface OutlineLocation {
  id: string
  name: string
  prep: string | null
  span: OutlineSpan | null
}

export interface OutlineObject {
  id: string
  name: string
  kind: ObjectKind
  prendibile: boolean
  defSpan: OutlineSpan | null
  descSpan: OutlineSpan | null
  descConditional: boolean
  description: string
  location: OutlineLocation | null
  properties: OutlineProperty[]
  aliases: OutlineProperty[]
}

// Coppia di proprietà OPPOSTE (mutuamente esclusive): aperta↔chiusa (default del
// motore) + quelle dichiarate con 'X e Y sono opposte.'. L'IDE le offre come
// selettori a due stati nell'inspector oggetti.
export interface OutlinePair {
  a: string
  b: string
}

export interface Outline {
  ok: boolean
  rooms: OutlineRoom[]
  objects: OutlineObject[]
  // Direzioni canoniche valide in questo mondo (base + personalizzate dichiarate).
  directions: string[]
  // Coppie di proprietà opposte note nel mondo (default + dichiarate dall'autore).
  opposites: OutlinePair[]
  // Span della frase «Il giocatore comincia in X.» (null se assente): permette
  // all'editor stanze di SOSTITUIRLA invece di accumularne di nuove.
  startSpan: OutlineSpan | null
  errors: Diagnostic[]
}

// Specifica strutturata per generare una frase .fav canonica (lato sidecar).
// I nomi (name/from/to/place) sono VISUALIZZATI (con articolo).
export type SerializeSpec =
  | { op: 'room_def'; name: string }
  | { op: 'object_def'; name: string; kind: ObjectKind }
  | { op: 'description'; name: string; text: string }
  | { op: 'connection'; from: string; direction: string; to: string }
  | { op: 'position'; name: string; prep: string; place: string }
  | { op: 'property'; name: string; property: string }
  | { op: 'prendibile'; name: string }
  | { op: 'alias'; name: string; alias: string }
  | { op: 'start'; name: string }
  | { op: 'direction_decl'; a: string; b: string }
  | { op: 'opposite_decl'; a: string; b: string }
  | {
      op: 'rule'
      verb: string
      target: SerializeRuleTarget | null
      condition?: RuleCondition | null
      response: string
      consequences: RuleConsequence[]
    }
  | { op: 'event'; mode: 'al' | 'ogni'; n: number; response: string; consequences: RuleConsequence[] }
  // Stati & contatori. 'state_decl'/'counter_decl' dichiarano la variabile;
  // 'state_init' (ri)assegna il valore iniziale di uno stato; 'state_values_comment'
  // emette il commento canonico '# valori di X: …' (ignorato dal motore).
  | { op: 'state_decl'; name: string }
  | { op: 'state_init'; name: string; value: string }
  | { op: 'counter_decl'; name: string }
  | { op: 'state_values_comment'; name: string; values: string[] }

export interface SerializeResult {
  ok: boolean
  text?: string
  error?: string
}

// --- Editor visuale di regole/eventi (Fase 6c) ---

// Condizione booleana (albero ricorsivo). Negazione (`not`) solo su has/prop/var
// (la grammatica nega infisso: «non ha», «non è»); contatori e gruppi non negabili.
export type RuleCondition =
  | { op: 'has'; id: string; name: string }
  | { op: 'prop'; id: string; name: string; prop: string }
  | { op: 'var'; name: string; value: string; kind: 'stato' | 'contatore' }
  | { op: 'count'; name: string; cmp: '==' | '>=' | '>' | '<'; value: number }
  | { op: 'not'; term: RuleCondition }
  | { op: 'and'; terms: RuleCondition[] }
  | { op: 'or'; terms: RuleCondition[] }
  | { op: 'unknown' }

// Conseguenza eseguibile (catena «e adesso …»).
export type RuleConsequence =
  | { op: 'prop'; id: string; name: string; prop: string }
  | { op: 'var'; name: string; value: string; kind: 'stato' | 'contatore' }
  | { op: 'count'; name: string; mode: 'aumenta' | 'diminuisci' | 'diventa'; value: number }
  // In scrittura (6c.3) il builder calcola la preposizione concordata e passa
  // prep/place (come l'op 'position'); in lettura restano assenti (il sidecar
  // ripiega su dest/destName). dest: id stanza/oggetto, o 'inventario'/'nulla'.
  | { op: 'move'; id: string; name: string; dest: string; destName: string; prep?: string; place?: string }
  | { op: 'end'; outcome: 'vinci' | 'perdi' | 'termina' }
  | { op: 'unknown' }

export interface RuleTarget {
  kind: 'object' | 'direction'
  id: string
  name: string
  prep: string | null
  secondaryId: string | null
  secondaryName: string | null
}

// Bersaglio in SCRITTURA (op 'rule'): solo i campi che il serializzatore emette
// (niente id, che servono solo in lettura per l'identità).
export interface SerializeRuleTarget {
  kind: 'object' | 'direction'
  name: string
  prep: string | null
  secondaryName: string | null
}

export interface Rule {
  span: OutlineSpan | null
  verb: string
  target: RuleTarget | null
  condition: RuleCondition | null
  response: string
  consequences: RuleConsequence[]
}

export interface GameEvent {
  span: OutlineSpan | null
  mode: 'al' | 'ogni'
  n: number
  response: string
  consequences: RuleConsequence[]
}

export interface RulesMenu {
  verbs: string[]
  objects: { id: string; name: string; kind: ObjectKind }[]
  rooms: { id: string; name: string }[]
  directions: string[]
  states: string[]
  counters: string[]
  // Valori ammessi per ogni stato (osservati ∪ commento canonico). Alimenta il
  // dropdown del valore-stato nel builder di regole. Mappa id-stato -> valori.
  stateValues: Record<string, string[]>
}

export interface WorldRules {
  ok: boolean
  rules: Rule[]
  events: GameEvent[]
  menu: RulesMenu
  errors: Diagnostic[]
}

// --- Pannello Stati & Contatori ---

// Uno STATO globale (variabile enum-like). 'values' è l'elenco curato dei valori
// ammessi (valore iniziale ∪ commento canonico '# valori di X: …'). Gli span
// permettono all'IDE di modificare/eliminare le frasi via splice Monaco.
export interface VarState {
  name: string
  initial: string | null
  initialSpan: OutlineSpan | null
  declSpan: OutlineSpan | null
  values: string[]
  valuesComment: { span: OutlineSpan | null; values: string[] } | null
}

export interface VarCounter {
  name: string
  declSpan: OutlineSpan | null
}

export interface WorldVariables {
  ok: boolean
  states: VarState[]
  counters: VarCounter[]
  errors: Diagnostic[]
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
