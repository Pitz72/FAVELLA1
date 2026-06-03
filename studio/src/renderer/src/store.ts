import { create } from 'zustand'
import type {
  FileNode,
  EngineLexicon,
  SidecarStatus,
  Diagnostic,
  WorldSummary,
  GameState,
  WorldGraph,
  WorldSnapshot,
  DebugEntry,
  Outline,
  OutlineSpan,
  SerializeSpec,
  WorldRules,
  WorldVariables
} from '../../shared/protocol'
import { FAVELLA_LANG_ID } from './monaco/favella-language'

/** Vista attiva del dock destro (null = dock chiuso). */
export type RightTab =
  | 'gioca'
  | 'mappa'
  | 'stanze'
  | 'stato'
  | 'debug'
  | 'oggetti'
  | 'regole'
  | 'stati'
  | null

/** Confronto di percorsi tollerante (Windows: case-insensitive, slash misti). */
export function stessoPercorso(a: string | null, b: string | null): boolean {
  if (!a || !b) return false
  const norm = (p: string): string => p.toLowerCase().replace(/\\/g, '/')
  return norm(a) === norm(b)
}

/** Richiesta di portare il cursore a una posizione (dal pannello Problemi). */
export interface RevealRequest {
  path: string
  line: number
  col: number
  nonce: number
}

/** Scelta dell'utente nel dialogo «modifiche non salvate». */
export type UnsavedChoice = 'save' | 'discard' | 'cancel'

/** Richiesta in sospeso di conferma «modifiche non salvate» (modal integrato). */
export interface UnsavedPrompt {
  names: string[]
  resolve: (choice: UnsavedChoice) => void
}

export interface OpenFile {
  path: string
  name: string
  content: string
  savedContent: string
  language: string
}

/**
 * Modifica programmatica del buffer (editor visuali, Fase 6a). EditorPane la
 * applica via Monaco (executeEdits) così l'UNDO è nativo; in parallelo lo store
 * aggiorna subito il contenuto per ricaricare mappa/outline senza attendere il
 * giro asincrono di onChange.
 */
export type BufferEdit =
  | { kind: 'append'; text: string }
  | { kind: 'deleteLines'; startLine: number; endLine: number }
  | { kind: 'replaceLines'; startLine: number; endLine: number; text: string }

export interface PendingEdit {
  path: string
  edits: BufferEdit[]
  nonce: number
}

/** Applica una BufferEdit al testo (stessa logica replicata in Monaco da EditorPane). */
export function applicaBufferEdit(content: string, edit: BufferEdit): string {
  if (edit.kind === 'append') {
    const base = content.endsWith('\n') || content === '' ? content : content + '\n'
    return base + edit.text + '\n'
  }
  const righe = content.split('\n')
  if (edit.kind === 'replaceLines') {
    // Sostituisce le righe [startLine..endLine] con il nuovo testo (1-based).
    righe.splice(edit.startLine - 1, edit.endLine - edit.startLine + 1, edit.text)
    return righe.join('\n')
  }
  // deleteLines: rimuove le righe [startLine..endLine] (1-based, incluse).
  righe.splice(edit.startLine - 1, edit.endLine - edit.startLine + 1)
  return righe.join('\n')
}

interface StudioState {
  // Progetto
  projectRoot: string | null
  tree: FileNode[]
  // Editor
  openFiles: OpenFile[]
  activePath: string | null
  // Motore
  lexicon: EngineLexicon | null
  sidecarStatus: SidecarStatus
  // Cursore (per la status bar)
  cursor: { line: number; column: number }
  // Compilazione & diagnostica (Fase 2)
  problems: Diagnostic[]
  problemsFile: string | null
  worldSummary: WorldSummary | null
  compiling: boolean
  reveal: RevealRequest | null
  // Dock destro (Fasi 3-4): quale vista è attiva
  rightTab: RightTab
  // Gioco (Fase 3)
  gameLines: string[]
  gameState: GameState | null
  gameRunning: boolean
  gameBusy: boolean
  gameError: string | null
  gameNotice: string | null
  // Mappa + Inspector (Fase 4)
  worldGraph: WorldGraph | null
  worldSnapshot: WorldSnapshot | null
  worldLoading: boolean
  // Debugger (Fase 5)
  debugHistory: DebugEntry[]
  debugLoading: boolean
  // Guardia «modifiche non salvate»: richiesta di conferma in sospeso (modal)
  unsavedPrompt: UnsavedPrompt | null
  // Editor visuali (Fase 6a)
  outline: Outline | null
  outlineLoading: boolean
  // Editor di regole/eventi (Fase 6c)
  rules: WorldRules | null
  rulesLoading: boolean
  // Pannello Stati & Contatori
  variables: WorldVariables | null
  variablesLoading: boolean
  mapEditMode: boolean
  pendingEdit: PendingEdit | null
  // Larghezza del dock destro (px), ridimensionabile dall'utente
  dockWidth: number

  // Azioni
  openProject: () => Promise<void>
  newProject: () => Promise<void>
  refreshTree: () => Promise<void>
  openFile: (node: FileNode) => Promise<void>
  closeFile: (path: string) => void
  setActive: (path: string) => void
  updateContent: (path: string, content: string) => void
  saveFile: (path: string) => Promise<void>
  saveActive: () => Promise<void>
  saveAll: () => Promise<void>
  setLexicon: (lex: EngineLexicon) => void
  setSidecarStatus: (s: SidecarStatus) => void
  setCursor: (line: number, column: number) => void
  compileFile: (path: string, source?: string) => Promise<void>
  compileActive: () => Promise<void>
  requestReveal: (path: string, line: number, col: number) => void
  // Dock destro
  setRightTab: (tab: RightTab) => void
  closeDock: () => void
  // Gioco (Fase 3)
  startGame: () => Promise<void>
  startGameWith: (path: string, source?: string) => Promise<void>
  launchGameWindow: () => void
  sendGameCommand: (command: string) => Promise<void>
  resetGame: () => Promise<void>
  saveGame: () => Promise<void>
  loadGame: () => Promise<void>
  clearGameNotice: () => void
  // Mappa + Inspector (Fase 4)
  loadWorldGraph: () => Promise<void>
  loadWorldSnapshot: () => Promise<void>
  // Debugger (Fase 5)
  loadDebugHistory: () => Promise<void>
  // Guardia «modifiche non salvate»: apre il modal e attende la scelta
  askUnsaved: (names: string[]) => Promise<UnsavedChoice>
  resolveUnsaved: (choice: UnsavedChoice) => void
  // Editor visuali (Fase 6a)
  loadOutline: () => Promise<void>
  // Editor di regole/eventi (Fase 6c)
  loadRules: () => Promise<void>
  // Pannello Stati & Contatori
  loadVariables: () => Promise<void>
  setMapEditMode: (on: boolean) => void
  setDockWidth: (px: number) => void
  mapAddConnection: (
    fromId: string,
    direction: string,
    toId: string,
    opposite?: string
  ) => Promise<void>
  mapDeleteConnection: (aId: string, bId: string) => Promise<void>
  mapAddRoom: (name: string) => Promise<void>
  // Editor oggetti (6a.4): genera/sostituisce o elimina una frase nel file attivo.
  applyStatement: (spec: SerializeSpec, span?: OutlineSpan | null) => Promise<void>
  deleteStatement: (span: OutlineSpan) => Promise<void>
}

function linguaDa(name: string): string {
  return name.toLowerCase().endsWith('.fav') ? FAVELLA_LANG_ID : 'plaintext'
}

/**
 * Direzioni verticali comuni NON native di FAVELLA (le native sono solo
 * nord/sud/est/ovest). Se l'autore ne sceglie una dalla mappa e non è ancora
 * dichiarata, l'IDE la auto-dichiara con la sua opposta ("Alto e basso sono
 * direzioni opposte."). Per ogni altra direzione non dichiarata si avvisa.
 */
const OPPOSTE_VERTICALI: Record<string, string> = {
  alto: 'basso',
  basso: 'alto',
  sopra: 'sotto',
  sotto: 'sopra'
}

/**
 * Spezza l'output del motore in righe per la console, senza la riga vuota finale.
 * Rimuove le righe dell'ELENCO numerato delle opzioni di dialogo (formato del
 * motore «  N. testo»): nell'IDE le opzioni sono rese come bottoni, quindi nel
 * testo sarebbero un doppione. La battuta dell'NPC (senza numero) resta.
 */
const RE_OPZIONE_DIALOGO = /^\s*\d+\.\s/

function righeConsole(output: string): string[] {
  if (!output) return []
  const righe = output
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l) => !RE_OPZIONE_DIALOGO.test(l))
  while (righe.length && righe[righe.length - 1] === '') righe.pop()
  return righe
}

function messaggioErrore(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export const useStudio = create<StudioState>((set, get) => ({
  projectRoot: null,
  tree: [],
  openFiles: [],
  activePath: null,
  lexicon: null,
  sidecarStatus: 'starting',
  cursor: { line: 1, column: 1 },
  problems: [],
  problemsFile: null,
  worldSummary: null,
  compiling: false,
  reveal: null,
  rightTab: null,
  gameLines: [],
  gameState: null,
  gameRunning: false,
  gameBusy: false,
  gameError: null,
  gameNotice: null,
  worldGraph: null,
  worldSnapshot: null,
  worldLoading: false,
  debugHistory: [],
  debugLoading: false,
  unsavedPrompt: null,
  outline: null,
  outlineLoading: false,
  rules: null,
  rulesLoading: false,
  variables: null,
  variablesLoading: false,
  mapEditMode: false,
  pendingEdit: null,
  dockWidth: 440,

  openProject: async () => {
    const res = await window.favella.openProject()
    if (!res) return
    set({ projectRoot: res.root, tree: res.tree })
  },

  newProject: async () => {
    const res = await window.favella.newProject()
    if (!res) return
    set({ projectRoot: res.root, tree: res.tree })
    // Apre subito il .fav vuoto appena creato, pronto da riempire.
    const name = res.openPath.split(/[\\/]/).pop() ?? 'storia.fav'
    await get().openFile({ name, path: res.openPath, type: 'file' })
  },

  refreshTree: async () => {
    const root = get().projectRoot
    if (!root) return
    set({ tree: await window.favella.refreshTree(root) })
  },

  openFile: async (node) => {
    if (node.type !== 'file') return
    const esistente = get().openFiles.find((f) => f.path === node.path)
    if (esistente) {
      set({ activePath: node.path })
      return
    }
    const content = await window.favella.readFile(node.path)
    const file: OpenFile = {
      path: node.path,
      name: node.name,
      content,
      savedContent: content,
      language: linguaDa(node.name)
    }
    set((s) => ({ openFiles: [...s.openFiles, file], activePath: node.path }))
  },

  closeFile: (path) => {
    set((s) => {
      const rimasti = s.openFiles.filter((f) => f.path !== path)
      let active = s.activePath
      if (active === path) {
        active = rimasti.length ? rimasti[rimasti.length - 1].path : null
      }
      return { openFiles: rimasti, activePath: active }
    })
  },

  setActive: (path) => set({ activePath: path }),

  updateContent: (path, content) => {
    set((s) => ({
      openFiles: s.openFiles.map((f) => (f.path === path ? { ...f, content } : f))
    }))
  },

  saveFile: async (path) => {
    const file = get().openFiles.find((f) => f.path === path)
    if (!file) return
    await window.favella.writeFile(path, file.content)
    set((s) => ({
      openFiles: s.openFiles.map((f) =>
        f.path === path ? { ...f, savedContent: f.content } : f
      )
    }))
  },

  saveActive: async () => {
    const active = get().activePath
    if (active) await get().saveFile(active)
  },

  saveAll: async () => {
    const sporchi = get().openFiles.filter((f) => f.content !== f.savedContent)
    for (const f of sporchi) await get().saveFile(f.path)
  },

  setLexicon: (lex) => set({ lexicon: lex }),
  setSidecarStatus: (s) => set({ sidecarStatus: s }),
  setCursor: (line, column) => set({ cursor: { line, column } }),

  compileFile: async (path, source) => {
    if (!path.toLowerCase().endsWith('.fav')) return
    set({ compiling: true })
    try {
      const res = await window.favella.compile(path, source)
      set({
        problems: [...res.errors, ...res.warnings],
        problemsFile: path,
        worldSummary: res.worldSummary,
        compiling: false
      })
    } catch (e) {
      // Sidecar non pronto / in crash: mostra un problema sintetico, non azzera.
      set({
        compiling: false,
        problemsFile: path,
        problems: [
          {
            message: 'Compilazione non riuscita: ' + (e instanceof Error ? e.message : String(e)),
            file: path,
            line: null,
            col: null,
            severity: 'error',
            code: 'sidecar',
            imprecise: true
          }
        ]
      })
    }
  },

  compileActive: async () => {
    const { activePath, openFiles } = get()
    if (!activePath) return
    const file = openFiles.find((f) => f.path === activePath)
    if (!file || !activePath.toLowerCase().endsWith('.fav')) return
    // Compila il BUFFER live (anche non salvato): diagnostica sempre aggiornata.
    await get().compileFile(activePath, file.content)
  },

  requestReveal: (path, line, col) =>
    set((s) => ({ reveal: { path, line, col, nonce: (s.reveal?.nonce ?? 0) + 1 } })),

  // --- Dock destro ----------------------------------------------------------

  setRightTab: (tab) => set({ rightTab: tab }),
  closeDock: () => set({ rightTab: null }),

  // --- Gioco (Fase 3) -------------------------------------------------------

  // Avvia una partita su un file/buffer espliciti. È il cuore usato sia dal dock
  // inline (startGame) sia dalla finestra di gioco dedicata (che non ha activePath).
  startGameWith: async (path, source) => {
    set({ gameBusy: true, gameError: null })
    try {
      const res = await window.favella.startGame(path, source)
      if (!res.ok) {
        set({
          gameBusy: false,
          gameRunning: false,
          gameState: null,
          gameLines: [],
          gameError: res.errors?.[0]?.message ?? 'Compilazione fallita: correggi gli errori e riprova.',
          worldSnapshot: null
        })
        return
      }
      set({
        gameBusy: false,
        gameError: null,
        gameLines: righeConsole(res.output),
        gameState: res.state,
        gameRunning: res.running
      })
      void get().loadWorldGraph()
      void get().loadWorldSnapshot()
      window.favella.notifyGameAdvanced() // avvisa l'IDE (pannelli live)
    } catch (e) {
      set({ gameBusy: false, gameRunning: false, gameError: messaggioErrore(e) })
    }
  },

  // Avvio inline nel dock dell'IDE (gioca il file .fav attivo, buffer live).
  startGame: async () => {
    const { activePath, openFiles } = get()
    if (!activePath || !activePath.toLowerCase().endsWith('.fav')) {
      set({
        rightTab: 'gioca',
        gameBusy: false,
        gameRunning: false,
        gameState: null,
        gameLines: [],
        gameError: 'Apri un file .fav nell’editor per avviare il gioco.'
      })
      return
    }
    const file = openFiles.find((f) => f.path === activePath)
    set({ rightTab: 'gioca' })
    await get().startGameWith(activePath, file?.content)
  },

  // [IDE] Apre la finestra di gioco dedicata sul file .fav attivo (buffer live).
  launchGameWindow: () => {
    const { activePath, openFiles } = get()
    if (!activePath || !activePath.toLowerCase().endsWith('.fav')) return
    const file = openFiles.find((f) => f.path === activePath)
    void window.favella.openGameWindow(activePath, file?.content)
  },

  sendGameCommand: async (command) => {
    const testo = command.trim()
    if (!testo) return
    const { gameRunning, gameBusy } = get()
    if (!gameRunning || gameBusy) return
    // Eco del comando del giocatore in console, poi la risposta del motore.
    set((s) => ({ gameBusy: true, gameLines: [...s.gameLines, '> ' + testo] }))
    try {
      const res = await window.favella.sendCommand(testo)
      set((s) => ({
        gameBusy: false,
        gameLines: [...s.gameLines, ...righeConsole(res.output)],
        gameState: res.state,
        gameRunning: res.running
      }))
      // Aggiorna lo stato live (inspector + evidenziazione stanza sulla mappa).
      void get().loadWorldSnapshot()
      window.favella.notifyGameAdvanced() // avvisa l'IDE (pannelli live)
    } catch (e) {
      set((s) => ({
        gameBusy: false,
        gameRunning: false,
        gameLines: [...s.gameLines, '[errore] ' + messaggioErrore(e)]
      }))
    }
  },

  resetGame: async () => {
    set({ gameBusy: true, gameError: null })
    try {
      const res = await window.favella.resetGame()
      if (!res.ok) {
        set({
          gameBusy: false,
          gameRunning: false,
          gameError: res.errors?.[0]?.message ?? 'Riavvio non riuscito.'
        })
        return
      }
      set({
        gameBusy: false,
        gameError: null,
        gameLines: righeConsole(res.output),
        gameState: res.state,
        gameRunning: res.running
      })
      void get().loadWorldGraph()
      void get().loadWorldSnapshot()
      window.favella.notifyGameAdvanced() // avvisa l'IDE (pannelli live)
    } catch (e) {
      set({ gameBusy: false, gameRunning: false, gameError: messaggioErrore(e) })
    }
  },

  // --- Salvataggio partite (command-log) ------------------------------------

  saveGame: async () => {
    if (!get().gameState) return // nessuna partita da salvare
    try {
      const save = await window.favella.gameSave()
      const res = await window.favella.writeSaveFile(save)
      if (res.ok) set({ gameNotice: `Partita salvata (turno ${save.turn}).` })
    } catch (e) {
      set({ gameError: messaggioErrore(e) })
    }
  },

  loadGame: async () => {
    let save
    try {
      save = await window.favella.readSaveFile()
    } catch (e) {
      set({ gameError: messaggioErrore(e) })
      return
    }
    if (!save) return // annullato
    set({ gameBusy: true, gameError: null })
    try {
      const res = await window.favella.gameLoad(save)
      if (!res.ok) {
        set({
          gameBusy: false,
          gameRunning: false,
          gameError: res.errors?.[0]?.message ?? 'Caricamento fallito: la storia non compila più.'
        })
        return
      }
      set({
        gameBusy: false,
        gameError: null,
        gameNotice: `Partita caricata (turno ${save.turn}).`,
        gameLines: righeConsole(res.output),
        gameState: res.state,
        gameRunning: res.running
      })
      void get().loadWorldGraph()
      void get().loadWorldSnapshot()
      window.favella.notifyGameAdvanced() // avvisa l'IDE (pannelli live)
    } catch (e) {
      set({ gameBusy: false, gameRunning: false, gameError: messaggioErrore(e) })
    }
  },

  clearGameNotice: () => set({ gameNotice: null }),

  // --- Mappa + Inspector (Fase 4) -------------------------------------------

  loadWorldGraph: async () => {
    // Con una partita attiva, la mappa è quella del mondo giocato; altrimenti si
    // compila il buffer .fav attivo per un'anteprima della topologia.
    const { gameRunning, activePath, openFiles } = get()
    set({ worldLoading: true })
    try {
      let graph: WorldGraph
      if (gameRunning) {
        graph = await window.favella.worldGraph()
      } else if (activePath?.toLowerCase().endsWith('.fav')) {
        const file = openFiles.find((f) => f.path === activePath)
        graph = await window.favella.worldGraph(activePath, file?.content)
      } else {
        set({ worldLoading: false, worldGraph: null })
        return
      }
      set({ worldLoading: false, worldGraph: graph })
    } catch {
      set({ worldLoading: false })
    }
  },

  loadWorldSnapshot: async () => {
    // Legge SEMPRE dal sidecar condiviso: la partita può girare nella finestra di
    // gioco dedicata (store separato), quindi non ci si può basare sullo stato di
    // gioco LOCALE di questa finestra. Se il sidecar non ha una sessione, l'RPC
    // solleva → snapshot null (i pannelli mostrano «avvia una partita»).
    try {
      set({ worldSnapshot: await window.favella.worldSnapshot() })
    } catch {
      set({ worldSnapshot: null })
    }
  },

  // --- Debugger (Fase 5) ----------------------------------------------------

  loadDebugHistory: async () => {
    set({ debugLoading: true })
    try {
      const h = await window.favella.sessionHistory()
      set({ debugLoading: false, debugHistory: h.entries })
    } catch {
      set({ debugLoading: false })
    }
  },

  // --- Guardia «modifiche non salvate» (modal integrato) --------------------

  askUnsaved: (names) =>
    new Promise<UnsavedChoice>((resolve) => {
      set({ unsavedPrompt: { names, resolve } })
    }),

  resolveUnsaved: (choice) => {
    const p = get().unsavedPrompt
    set({ unsavedPrompt: null })
    p?.resolve(choice)
  },

  // --- Editor visuali (Fase 6a) ----------------------------------------------

  loadOutline: async () => {
    const { activePath, openFiles } = get()
    if (!activePath?.toLowerCase().endsWith('.fav')) {
      set({ outline: null })
      return
    }
    const file = openFiles.find((f) => f.path === activePath)
    set({ outlineLoading: true })
    try {
      const o = await window.favella.worldOutline(activePath, file?.content)
      set({ outlineLoading: false, outline: o })
    } catch {
      set({ outlineLoading: false })
    }
  },

  loadRules: async () => {
    const { activePath, openFiles } = get()
    if (!activePath?.toLowerCase().endsWith('.fav')) {
      set({ rules: null })
      return
    }
    const file = openFiles.find((f) => f.path === activePath)
    set({ rulesLoading: true })
    try {
      const r = await window.favella.worldRules(activePath, file?.content)
      set({ rulesLoading: false, rules: r })
    } catch {
      set({ rulesLoading: false })
    }
  },

  loadVariables: async () => {
    const { activePath, openFiles } = get()
    if (!activePath?.toLowerCase().endsWith('.fav')) {
      set({ variables: null })
      return
    }
    const file = openFiles.find((f) => f.path === activePath)
    set({ variablesLoading: true })
    try {
      const v = await window.favella.worldVariables(activePath, file?.content)
      set({ variablesLoading: false, variables: v })
    } catch {
      set({ variablesLoading: false })
    }
  },

  setMapEditMode: (on) => set({ mapEditMode: on }),

  setDockWidth: (px) => set({ dockWidth: Math.max(320, Math.min(900, Math.round(px))) }),

  // mapAddConnection/mapDeleteConnection applicano un edit al file ATTIVO:
  // aggiornano subito il contenuto nello store (così mappa/outline si ricaricano
  // sul testo nuovo) e segnalano a EditorPane di rispecchiarlo in Monaco (undo
  // nativo) via `pendingEdit`. Poi ricaricano outline + grafo.
  mapAddConnection: async (fromId, direction, toId, opposite) => {
    const { outline, activePath, openFiles } = get()
    if (!outline || !activePath) return
    const from = outline.rooms.find((r) => r.id === fromId)
    const to = outline.rooms.find((r) => r.id === toId)
    if (!from || !to) return
    const dir = direction.trim().toLowerCase()

    // Direzione valida nel mondo? Le native sono nord/sud/est/ovest; le altre
    // vanno dichiarate IN COPPIA OPPOSTA. L'opposta è quella indicata dall'autore
    // («Nuova direzione») oppure, per le verticali comuni, una di default. Se non
    // c'è opposta e la direzione non è valida, avviso e non scrivo nulla.
    let dichiarazione = ''
    if (!outline.directions.includes(dir)) {
      const opposta = (opposite ?? '').trim().toLowerCase() || OPPOSTE_VERTICALI[dir]
      if (!opposta) {
        set({
          gameNotice:
            `«${dir}» non è una direzione valida. Usa «➕ Nuova direzione» per ` +
            `dichiararla con la sua opposta.`
        })
        return
      }
      try {
        const d = await window.favella.serializeStatement({
          op: 'direction_decl', a: dir, b: opposta
        })
        if (d.ok && d.text) dichiarazione = d.text + '\n'
      } catch (e) {
        set({ gameNotice: 'Errore di serializzazione: ' + messaggioErrore(e) })
        return
      }
    }

    let res
    try {
      res = await window.favella.serializeStatement({
        op: 'connection', from: from.name, direction: dir, to: to.name
      })
    } catch (e) {
      set({ gameNotice: 'Errore di serializzazione: ' + messaggioErrore(e) })
      return
    }
    if (!res.ok || !res.text) {
      set({ gameNotice: res.error ?? 'Impossibile generare la connessione.' })
      return
    }
    // Applica al buffer attivo (append) — store + Monaco — poi ricarica. Se serve,
    // la dichiarazione della direzione precede la connessione (stesso append).
    const file = openFiles.find((f) => f.path === activePath)
    if (!file) return
    const edit: BufferEdit = { kind: 'append', text: dichiarazione + res.text }
    const nuovo = applicaBufferEdit(file.content, edit)
    set((s) => ({
      openFiles: s.openFiles.map((f) =>
        f.path === activePath ? { ...f, content: nuovo } : f
      ),
      pendingEdit: { path: activePath, edits: [edit], nonce: (s.pendingEdit?.nonce ?? 0) + 1 }
    }))
    await get().loadOutline()
    await get().loadWorldGraph()
  },

  mapDeleteConnection: async (aId, bId) => {
    const { outline, activePath, openFiles } = get()
    if (!outline || !activePath) return
    // Trova la frase 'collega' ESPLICITA (implicit=false, con span) che unisce le
    // due stanze, in una qualunque delle due direzioni.
    let span: { file: string; line: number; endLine: number } | null = null
    for (const rid of [aId, bId]) {
      const room = outline.rooms.find((r) => r.id === rid)
      if (!room) continue
      const altro = rid === aId ? bId : aId
      const ex = room.exits.find((e) => e.to === altro && !e.implicit && e.span)
      if (ex?.span) {
        span = ex.span
        break
      }
    }
    if (!span) {
      set({ gameNotice: 'Connessione non trovata nel sorgente (forse generata da un’altra frase).' })
      return
    }
    if (!stessoPercorso(span.file, activePath)) {
      set({
        gameNotice:
          'La connessione è definita in un altro file: aprilo per modificarla dalla mappa.'
      })
      return
    }
    const file = openFiles.find((f) => f.path === activePath)
    if (!file) return
    const edit: BufferEdit = {
      kind: 'deleteLines', startLine: span.line, endLine: span.endLine
    }
    const nuovo = applicaBufferEdit(file.content, edit)
    set((s) => ({
      openFiles: s.openFiles.map((f) =>
        f.path === activePath ? { ...f, content: nuovo } : f
      ),
      pendingEdit: { path: activePath, edits: [edit], nonce: (s.pendingEdit?.nonce ?? 0) + 1 }
    }))
    await get().loadOutline()
    await get().loadWorldGraph()
  },

  mapAddRoom: async (name) => {
    const { activePath, openFiles } = get()
    const nome = name.trim()
    if (!nome || !activePath) return
    let res
    try {
      res = await window.favella.serializeStatement({ op: 'room_def', name: nome })
    } catch (e) {
      set({ gameNotice: 'Errore di serializzazione: ' + messaggioErrore(e) })
      return
    }
    if (!res.ok || !res.text) {
      set({ gameNotice: res.error ?? 'Impossibile generare la stanza.' })
      return
    }
    const file = openFiles.find((f) => f.path === activePath)
    if (!file) return
    const edit: BufferEdit = { kind: 'append', text: res.text }
    const nuovo = applicaBufferEdit(file.content, edit)
    set((s) => ({
      openFiles: s.openFiles.map((f) =>
        f.path === activePath ? { ...f, content: nuovo } : f
      ),
      pendingEdit: { path: activePath, edits: [edit], nonce: (s.pendingEdit?.nonce ?? 0) + 1 }
    }))
    await get().loadOutline()
    await get().loadWorldGraph()
  },

  // Genera la frase canonica dalla spec e la SCRIVE nel buffer: se 'span' è dato
  // SOSTITUISCE quella frase (deve essere nel file attivo), altrimenti la AGGIUNGE
  // in fondo al file attivo. Aggiorna store + Monaco (undo) e ricarica l'outline.
  applyStatement: async (spec, span) => {
    const { activePath, openFiles } = get()
    if (!activePath) return
    let res
    try {
      res = await window.favella.serializeStatement(spec)
    } catch (e) {
      set({ gameNotice: 'Errore di serializzazione: ' + messaggioErrore(e) })
      return
    }
    if (!res.ok || !res.text) {
      set({ gameNotice: res.error ?? 'Operazione non riuscita.' })
      return
    }
    let edit: BufferEdit
    if (span) {
      if (!stessoPercorso(span.file, activePath)) {
        set({
          gameNotice:
            'Questa frase è in un altro file (incluso): aprilo per modificarla da qui.'
        })
        return
      }
      edit = { kind: 'replaceLines', startLine: span.line, endLine: span.endLine, text: res.text }
    } else {
      edit = { kind: 'append', text: res.text }
    }
    const file = openFiles.find((f) => f.path === activePath)
    if (!file) return
    const nuovo = applicaBufferEdit(file.content, edit)
    set((s) => ({
      openFiles: s.openFiles.map((f) => (f.path === activePath ? { ...f, content: nuovo } : f)),
      pendingEdit: { path: activePath, edits: [edit], nonce: (s.pendingEdit?.nonce ?? 0) + 1 }
    }))
    await get().loadOutline()
    await get().loadWorldGraph()
    await get().loadRules()
    await get().loadVariables()
  },

  deleteStatement: async (span) => {
    const { activePath, openFiles } = get()
    if (!activePath) return
    if (!stessoPercorso(span.file, activePath)) {
      set({ gameNotice: 'Questa frase è in un altro file (incluso): aprilo per modificarla da qui.' })
      return
    }
    const file = openFiles.find((f) => f.path === activePath)
    if (!file) return
    const edit: BufferEdit = { kind: 'deleteLines', startLine: span.line, endLine: span.endLine }
    const nuovo = applicaBufferEdit(file.content, edit)
    set((s) => ({
      openFiles: s.openFiles.map((f) => (f.path === activePath ? { ...f, content: nuovo } : f)),
      pendingEdit: { path: activePath, edits: [edit], nonce: (s.pendingEdit?.nonce ?? 0) + 1 }
    }))
    await get().loadOutline()
    await get().loadWorldGraph()
    await get().loadRules()
    await get().loadVariables()
  }
}))
