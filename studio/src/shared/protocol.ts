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
  // [Livello 7] Bonus di capacità («X dà N spazi.»): 0 = nessuno.
  carryBonus: number
  carryBonusSpan: OutlineSpan | null
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
  // [Livello 7] Capacità di trasporto BASE («Il giocatore può portare N oggetti.»):
  // null = illimitata (default).
  carryBase: number | null
  carryBaseSpan: OutlineSpan | null
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
  // [Livello 7] capacità di trasporto: base globale e bonus per-oggetto.
  | { op: 'carry_base'; value: number }
  | { op: 'carry_bonus'; name: string; value: number }
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
  | {
      op: 'demon'
      mode: 'ogni' | 'quando'
      condition: RuleCondition | null
      response: string
      consequences: RuleConsequence[]
    }
  // Stati & contatori. 'state_decl'/'counter_decl' dichiarano la variabile;
  // 'state_init' (ri)assegna il valore iniziale di uno stato; 'state_values_comment'
  // emette il commento canonico '# valori di X: …' (ignorato dal motore).
  | { op: 'state_decl'; name: string }
  | { op: 'state_init'; name: string; value: string }
  | { op: 'counter_decl'; name: string }
  | { op: 'counter_init'; name: string; value: number }
  | { op: 'state_values_comment'; name: string; values: string[] }
  // Dialoghi/NPC (Fase 6b). 'npc_decl' promuove un oggetto a personaggio;
  // 'dialogue_start' ne fissa il nodo d'ingresso; 'node_line' è la battuta
  // dell'NPC al nodo; 'dialogue_option' è una scelta del giocatore (con esito
  // conduce/chiude, condizione e conseguenze opzionali).
  | { op: 'npc_decl'; name: string }
  | { op: 'dialogue_start'; name: string; node: string }
  | { op: 'node_line'; speaker: string; node: string; line: string }
  | {
      op: 'dialogue_option'
      node: string
      text: string
      condition?: RuleCondition | null
      outcome: 'conduce' | 'chiude'
      dest?: string
      consequences: RuleConsequence[]
    }

export interface SerializeResult {
  ok: boolean
  text?: string
  error?: string
}

// [Autoformat / blocco C] Riordino canonico del sorgente di un file singolo.
export interface ReorderResult {
  ok: boolean
  text?: string
  reason?: string
}

// [Fase 7 / packaging] Export della storia come HTML autoportante (Pyodide).
export interface ExportResult {
  ok: boolean
  html?: string
  title?: string
  reason?: string
}

// --- Editor visuale di regole/eventi (Fase 6c) ---

// Condizione booleana (albero ricorsivo). Negazione (`not`) solo su has/prop/var
// (la grammatica nega infisso: «non ha», «non è»); contatori e gruppi non negabili.
export type CountCmp = '==' | '!=' | '>=' | '>' | '<' | '<='

// [v1.0.0 / Tema 1] La quantità di un confronto o di una mutazione di contatore.
// Un letterale resta un NUMBER semplice (forma storica: l'editor visuale lo edita
// con un campo numerico). Le forme DINAMICHE introdotte nei Temi sono oggetti con
// 'kind': `di [contatore]` → {kind:'var'}, `un numero fra A e B` → {kind:'rand'}.
// L'editor visuale non le ricostruisce ancora (→ «modifica nel testo»); servono
// solo a mostrarle correttamente in sola lettura e a non corromperle al salvataggio.
export type Operando =
  | number
  | { kind: 'var'; name: string }
  | { kind: 'rand'; min: number; max: number }

export type RuleCondition =
  | { op: 'has'; id: string; name: string }
  | { op: 'prop'; id: string; name: string; prop: string }
  | { op: 'var'; name: string; value: string; kind: 'stato' | 'contatore' }
  | { op: 'count'; name: string; cmp: CountCmp; value: Operando }
  // [0.18.0 / B1] posizione del giocatore: «il giocatore è in [stanza]».
  | { op: 'playerIn'; room: string; name: string }
  // [v1.0.0 / Tema 3] confronto stato↔stato: «X è come Y» (entrambi stati).
  | { op: 'varEq'; name: string; other: string }
  // [v1.0.0 / Tema 2c] probabilità: «càpita (N su M)».
  | { op: 'chance'; num: number; den: number }
  | { op: 'not'; term: RuleCondition }
  | { op: 'and'; terms: RuleCondition[] }
  | { op: 'or'; terms: RuleCondition[] }
  | { op: 'unknown' }

// Conseguenza eseguibile (catena «e adesso …»).
export type RuleConsequence =
  | { op: 'prop'; id: string; name: string; prop: string }
  | { op: 'var'; name: string; value: string; kind: 'stato' | 'contatore' }
  | { op: 'count'; name: string; mode: 'aumenta' | 'diminuisci' | 'diventa'; value: Operando }
  // In scrittura (6c.3) il builder calcola la preposizione concordata e passa
  // prep/place (come l'op 'position'); in lettura restano assenti (il sidecar
  // ripiega su dest/destName). dest: id stanza/oggetto, o 'inventario'/'nulla'.
  | { op: 'move'; id: string; name: string; dest: string; destName: string; prep?: string; place?: string }
  // [0.18.0 / B2] teletrasporto del giocatore: «e adesso il giocatore è in [stanza]».
  | { op: 'teleport'; room: string; name: string }
  // [0.18.0 / B3] 'message' opzionale = testo d'esito personalizzato («vinci "…"»).
  | { op: 'end'; outcome: 'vinci' | 'perdi' | 'termina'; message?: string | null }
  // [v1.0.0 / Tema 3] copia stato↔stato: «X diventa Y» (Y è un altro stato).
  | { op: 'varCopy'; name: string; from: string }
  // [v1.0.0 / Tema 2b] estrazione: «X diventa uno fra a, b, c».
  | { op: 'pick'; name: string; values: string[]; kind: 'stato' | 'contatore' }
  // [v1.0.0 / Tema 4a] buio commutabile di una stanza: «la radura diventa buia/illuminata».
  | { op: 'dark'; room: string; name: string; dark: boolean }
  // [v1.0.0 / A5] movimento di un personaggio: «la guardia va in corridoio» (dest fissa)
  // o «il gatto cambia stanza» (adiacente, a caso). prep/place calcolati dalla UI come 'move'.
  | {
      op: 'movePNG'
      png: string
      name: string
      adjacent: boolean
      dest: string | null
      destName: string | null
      prep?: string
      place?: string
    }
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

// [Livello 8] Demone (sentinella): sorveglia una condizione a ogni turno e scatta
// da solo. 'ogni' = ogni turno in cui è vera; 'quando' = appena diventa vera (una volta).
export interface Demon {
  span: OutlineSpan | null
  mode: 'ogni' | 'quando'
  condition: RuleCondition | null
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
  demons: Demon[]
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
  // [0.16.0] Valore iniziale (default 0) e span della frase «X parte da N.» (null se assente).
  initial: number
  initialSpan: OutlineSpan | null
}

export interface WorldVariables {
  ok: boolean
  states: VarState[]
  counters: VarCounter[]
  errors: Diagnostic[]
}

// --- Editor visuale dei dialoghi (Fase 6b) ---

// Una scelta del giocatore a un nodo. 'outcome' = ramificazione ('conduce' al
// nodo 'dest') o fine conversazione ('chiude'). Condizione/conseguenze riusano la
// shape JSON delle regole; quando assenti l'opzione è sempre disponibile/senza effetti.
export interface DialogueOptionView {
  text: string
  span: OutlineSpan | null
  condition: RuleCondition | null
  outcome: 'conduce' | 'chiude'
  dest: string | null
  consequences: RuleConsequence[]
}

// Un nodo del grafo di dialogo: la battuta dell'NPC ('line') + le opzioni del
// giocatore. 'speaker' è l'NPC che vi parla (dalla frase «X al nodo "n" dice …»).
export interface DialogueNode {
  label: string
  speaker: { id: string; name: string } | null
  line: string
  lineSpan: OutlineSpan | null
  options: DialogueOptionView[]
}

// Un personaggio (NPC). 'startNode' è l'etichetta del nodo d'ingresso del dialogo.
export interface DialogueNpc {
  id: string
  name: string
  startNode: string | null
  defSpan: OutlineSpan | null
  startSpan: OutlineSpan | null
}

export interface DialoguesMenu {
  npcs: { id: string; name: string }[]
  nodeLabels: string[]
  objects: { id: string; name: string; kind: ObjectKind }[]
  rooms: { id: string; name: string }[]
  directions: string[]
  states: string[]
  counters: string[]
  stateValues: Record<string, string[]>
}

export interface WorldDialogues {
  ok: boolean
  npcs: DialogueNpc[]
  nodes: DialogueNode[]
  menu: DialoguesMenu
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
