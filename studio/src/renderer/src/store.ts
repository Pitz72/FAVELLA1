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
  WorldVariables,
  WorldDialogues,
  WorldWords,
  Pulsantiera,
  OutlineExit,
  ReferencesResult,
  UpdaterStatus
} from '../../shared/protocol'
import { FAVELLA_LANG_ID } from './monaco/favella-language'
import { SEZIONI, type Sezione } from './sezioni'
import {
  chiave,
  stessoFile,
  nomeFile,
  cartellaDi,
  unisci,
  relativo,
  estraiInclusioni,
  righeInclusioni,
  radiceDi,
  membriDi,
  conEstensione,
  type GrafoInclusioni
} from './utils/progetto'
import { calcolaContenuti, type Modifica, type FileDaModificare } from './utils/modifiche'

/** Vista attiva del dock destro (null = dock chiuso). */
export type RightTab =
  | 'gioca'
  | 'mappa'
  | 'stanze'
  | 'stato'
  | 'debug'
  | 'oggetti'
  | 'personaggi'
  | 'regole'
  | 'stati'
  | 'dialoghi'
  | 'parole'
  | null

/** Confronto di percorsi tollerante (Windows: case-insensitive, slash misti). */
export function stessoPercorso(a: string | null, b: string | null): boolean {
  return stessoFile(a, b)
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
 * Modifica programmatica del buffer (editor visuali, mappa, rinomina…). EditorPane la
 * applica via Monaco (executeEdits, come cambio minimo) così l'UNDO è nativo; in
 * parallelo lo store aggiorna subito il contenuto per ricaricare mappa e pannelli senza
 * attendere il giro asincrono di onChange. Riguarda solo il file aperto: gli altri file
 * della storia cambiano nei loro buffer, e Monaco li legge quando li si apre.
 */
export interface PendingEdit {
  path: string
  /** Il testo intero che il file deve avere dopo la modifica. */
  finale: string
  nonce: number
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
  gameButtons: Pulsantiera | null
  gameRunning: boolean
  gameBusy: boolean
  gameError: string | null
  gameNotice: string | null
  // [UX T6] Errore dell'ultima azione di un editor visuale (serializzazione fallita,
  // frase in un file incluso, direzione non valida…): mostrato INLINE nel dock, dove
  // l'azione è nata, invece che solo nel toast globale. Si pulisce all'azione riuscita
  // successiva o con la ✕ del banner.
  editError: string | null
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
  // Editor dialoghi/NPC (Fase 6b)
  dialogues: WorldDialogues | null
  dialoguesLoading: boolean
  words: WorldWords | null
  wordsLoading: boolean
  pendingEdit: PendingEdit | null
  // [Studio 1.1] Storie a più file. `inclusioniDisco` è il grafo degli «Includi» letto dai
  // file sul disco (i buffer aperti, più nuovi, lo correggono: vedi grafoCorrente);
  // `revisione` sale a ogni cambio del testo, da qualunque parte arrivi, e fa ricompilare;
  // `destinazioneNuovi` è il file che riceve le cose nuove (null = il file aperto).
  inclusioniDisco: GrafoInclusioni
  revisione: number
  destinazioneNuovi: string | null
  // [Studio 0.10] Interfaccia a sezioni: il testo si può affiancare ai pannelli
  // visuali; la Prova ha una colonna a lato (partita / mappa / debug); la
  // leggibilità (zoom) e i pannelli ripiegabili si ricordano fra le sessioni.
  affiancaTesto: boolean
  provaLato: 'stato' | 'mappa' | 'debug'
  zoom: number
  esploraAperto: boolean
  problemiAperti: boolean
  // Auto-updater
  updaterStatus: UpdaterStatus
  updateModalOpen: boolean

  // Azioni
  setUpdaterStatus: (s: UpdaterStatus) => void
  setUpdateModalOpen: (v: boolean) => void
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
  compileFile: (path: string, source?: string, sources?: Record<string, string>) => Promise<void>
  compileActive: () => Promise<void>
  requestReveal: (path: string, line: number, col: number) => void
  // Dock destro
  setRightTab: (tab: RightTab) => void
  closeDock: () => void
  setSezione: (sezione: Sezione) => void
  setAffiancaTesto: (v: boolean) => void
  setProvaLato: (lato: 'stato' | 'mappa' | 'debug') => void
  setZoom: (z: number) => void
  setEsploraAperto: (v: boolean) => void
  setProblemiAperti: (v: boolean) => void
  // Gioco (Fase 3)
  startGame: () => Promise<void>
  startGameWith: (path: string, source?: string, sources?: Record<string, string>) => Promise<void>
  launchGameWindow: () => void
  sendGameCommand: (command: string) => Promise<void>
  resetGame: () => Promise<void>
  saveGame: () => Promise<void>
  loadGame: () => Promise<void>
  clearGameNotice: () => void
  clearEditError: () => void
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
  // Editor dialoghi/NPC (Fase 6b)
  loadDialogues: () => Promise<void>
  loadWords: () => Promise<void>
  mapAddConnection: (
    fromId: string,
    direction: string,
    toId: string,
    opposite?: string
  ) => Promise<void>
  mapDeleteConnection: (aId: string, bId: string) => Promise<void>
  mapAddRoom: (name: string) => Promise<void>
  // Cambia direzione e/o destinazione di un'uscita, vista da `daId`; la toglie.
  cambiaUscita: (a: {
    daId: string
    uscita: OutlineExit
    direzione?: string
    versoId?: string
    opposta?: string
  }) => Promise<void>
  eliminaUscita: (uscita: OutlineExit) => Promise<void>
  // [Studio 1.1] Il cuore delle modifiche: applica N modifiche, anche su file diversi.
  applica: (mods: Modifica[]) => Promise<boolean>
  ricarica: () => Promise<void>
  // Editor oggetti (6a.4): genera/sostituisce o elimina una frase.
  applyStatement: (spec: SerializeSpec, span?: OutlineSpan | null) => Promise<void>
  deleteStatement: (span: OutlineSpan) => Promise<void>
  // Editor dialoghi (6b): appende PIÙ frasi in un solo edit (es. un nodo = battuta
  // + nodo d'ingresso + opzioni), evitando lo staleness degli span fra edit separati.
  appendStatements: (specs: SerializeSpec[]) => Promise<void>
  // [Studio 1.1] Riordina il testo in modo sensato: ogni file della storia, nel suo file.
  riordinaStoria: () => Promise<void>
  // [Studio 1.1] Rinomina una stanza/un oggetto in tutte le frasi che lo citano.
  rinominaElemento: (nome: string, nuovoNome: string) => Promise<boolean>
  riferimentiElemento: (nome: string) => Promise<ReferencesResult | null>
  eliminaFrasi: (spans: OutlineSpan[]) => Promise<boolean>
  // [Fase 7] Esporta la storia come HTML autoportante (dialogo di salvataggio).
  exportGame: () => Promise<void>
  // Rinomina un nodo di dialogo PROPAGANDO il nuovo nome a tutte le frasi che lo
  // citano (battuta, opzioni del nodo, nodo d'ingresso, ogni «conduce al nodo»).
  renameDialogueNode: (oldLabel: string, newLabel: string) => Promise<void>
  // Elimina un intero nodo: la battuta + tutte le sue opzioni + l'eventuale
  // «comincia con» che vi punta.
  deleteDialogueNode: (label: string) => Promise<void>
  // [Studio 1.1] Storie a più file e «Salva con nome».
  aggiornaInclusioni: () => Promise<void>
  impostaDestinazioneNuovi: (path: string | null) => void
  nuovoFileStoria: (nome: string, includi: boolean) => Promise<boolean>
  includiFile: (percorso: string, radice?: string) => Promise<boolean>
  togliInclusione: (percorso: string) => Promise<boolean>
  salvaConNome: () => Promise<void>
  salvaProgettoCome: () => Promise<void>
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

// [Studio 0.10] Preferenze d'interfaccia: persistite, best-effort.
function leggiPref<T>(chiave: string, def: T, valida: (v: unknown) => v is T): T {
  try {
    const grezzo = localStorage.getItem('favella.' + chiave)
    if (grezzo !== null) {
      const v = JSON.parse(grezzo)
      if (valida(v)) return v
    }
  } catch {
    /* ignora: si usa il default */
  }
  return def
}
function salvaPref(chiave: string, valore: unknown): void {
  try {
    localStorage.setItem('favella.' + chiave, JSON.stringify(valore))
  } catch {
    /* persistenza best-effort */
  }
}
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isZoom = (v: unknown): v is number => typeof v === 'number' && v >= 0.8 && v <= 2
const isLato = (v: unknown): v is 'stato' | 'mappa' | 'debug' => v === 'stato' || v === 'mappa' || v === 'debug'
// L'ultima sotto-scheda aperta in ogni sezione (si riparte da dove si era).
const ultimaSotto: Partial<Record<Sezione, Exclude<RightTab, null>>> = {}

// --- Storie a più file ---------------------------------------------------------
//
// Una storia può stare in un file solo o essere divisa in moduli: il file principale
// include gli altri con «Includi "nome.fav".». Tutto ciò che Studio fa sul mondo (le
// mappe, gli editor, la prova) lavora sulla STORIA intera, cioè sul file principale con i
// suoi moduli, qualunque file sia aperto nell'editor.

export interface InfoStoria {
  /** Il file principale: quello che nessun altro include. */
  radice: string
  /** La radice e i moduli che include, nell'ordine d'inclusione. */
  membri: string[]
  grafo: GrafoInclusioni
}

// Quando un modulo è incluso da più storie, si resta su quella dove si era.
let ultimaRadice: string | null = null

/** Il grafo delle inclusioni: quello letto dal disco, con i buffer aperti (più nuovi) sopra. */
export function grafoCorrente(disco: GrafoInclusioni, aperti: OpenFile[]): GrafoInclusioni {
  const out: GrafoInclusioni = { ...disco }
  const perChiave = new Map<string, string>()
  for (const k of Object.keys(disco)) perChiave.set(chiave(k), k)
  for (const f of aperti) {
    if (!f.path.toLowerCase().endsWith('.fav')) continue
    const k = perChiave.get(chiave(f.path)) ?? f.path
    out[k] = estraiInclusioni(f.content, f.path)
  }
  return out
}

export function infoStoria(
  s: Pick<StudioState, 'activePath' | 'openFiles' | 'inclusioniDisco'>
): InfoStoria | null {
  if (!s.activePath || !s.activePath.toLowerCase().endsWith('.fav')) return null
  const grafo = grafoCorrente(s.inclusioniDisco, s.openFiles)
  const radice = radiceDi(s.activePath, grafo, ultimaRadice)
  ultimaRadice = radice
  return { radice, membri: membriDi(radice, grafo), grafo }
}

/** I buffer dei file .fav aperti (anche non salvati): il motore li legge al posto del disco. */
function fontiAperte(aperti: OpenFile[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of aperti) if (f.path.toLowerCase().endsWith('.fav')) out[f.path] = f.content
  return out
}

interface ContestoStoria {
  radice: string
  /** Il buffer della radice, se aperta (altrimenti il motore la legge dal disco). */
  sorgente: string | undefined
  fonti: Record<string, string>
}

function contestoStoria(s: StudioState): ContestoStoria | null {
  const st = infoStoria(s)
  if (!st) return null
  const fonti = fontiAperte(s.openFiles)
  const k = Object.keys(fonti).find((x) => stessoFile(x, st.radice))
  return { radice: st.radice, sorgente: k ? fonti[k] : undefined, fonti }
}

/** Dove vanno le cose nuove: il file scelto, o quello aperto se è della storia, o la radice. */
function destinazioneEffettiva(s: StudioState): string | null {
  const st = infoStoria(s)
  if (!st) return null
  if (s.destinazioneNuovi && st.membri.some((m) => stessoFile(m, s.destinazioneNuovi))) return s.destinazioneNuovi
  if (s.activePath && st.membri.some((m) => stessoFile(m, s.activePath))) return s.activePath
  return st.radice
}

async function serializza(
  spec: SerializeSpec
): Promise<{ ok: true; testo: string } | { ok: false; errore: string }> {
  try {
    const r = await window.favella.serializeStatement(spec)
    if (!r.ok || !r.text) return { ok: false, errore: r.error ?? 'Operazione non riuscita.' }
    return { ok: true, testo: r.text }
  } catch (e) {
    return { ok: false, errore: 'Errore di serializzazione: ' + messaggioErrore(e) }
  }
}

/**
 * Una direzione, pronta per una frase «collega»: se non è ancora valida nel mondo va
 * dichiarata IN COPPIA OPPOSTA (quella data dall'autore, o quella di default per le
 * verticali comuni). Restituisce la frase di dichiarazione (vuota se non serve) e
 * l'opposta, che serve a riscrivere i ritorni.
 */
async function preparaDirezione(
  outline: Outline,
  dir: string,
  opposta?: string
): Promise<{ ok: true; dichiarazione: string; opposta: string } | { ok: false; errore: string }> {
  if (outline.directions.includes(dir)) {
    return { ok: true, dichiarazione: '', opposta: outline.oppositeDirections?.[dir] ?? OPPOSTE_VERTICALI[dir] ?? '' }
  }
  const opp = (opposta ?? '').trim().toLowerCase() || OPPOSTE_VERTICALI[dir]
  if (!opp) {
    return {
      ok: false,
      errore: `«${dir}» non è una direzione valida. Usa «Nuova direzione» per dichiararla con la sua opposta.`
    }
  }
  const r = await serializza({ op: 'direction_decl', a: dir, b: opp })
  if (!r.ok) return r
  return { ok: true, dichiarazione: r.testo + '\n', opposta: opp }
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
  gameButtons: null,
  gameRunning: false,
  gameBusy: false,
  gameError: null,
  gameNotice: null,
  editError: null,
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
  dialogues: null,
  dialoguesLoading: false,
  words: null,
  wordsLoading: false,
  pendingEdit: null,
  inclusioniDisco: {},
  revisione: 0,
  destinazioneNuovi: null,
  affiancaTesto: leggiPref('affiancaTesto', false, isBool),
  provaLato: leggiPref('provaLato', 'stato', isLato),
  zoom: leggiPref('zoom', 1.1, isZoom),
  esploraAperto: leggiPref('esploraAperto', true, isBool),
  problemiAperti: leggiPref('problemiAperti', false, isBool),
  updaterStatus: { type: 'idle' },
  updateModalOpen: false,

  openProject: async () => {
    const res = await window.favella.openProject()
    if (!res) return
    set({ projectRoot: res.root, tree: res.tree, destinazioneNuovi: null, inclusioniDisco: {} })
    void get().aggiornaInclusioni()
  },


  newProject: async () => {
    const res = await window.favella.newProject()
    if (!res) return
    set({ projectRoot: res.root, tree: res.tree, destinazioneNuovi: null, inclusioniDisco: {} })
    void get().aggiornaInclusioni()
    // Apre subito il .fav vuoto appena creato, pronto da riempire.
    const name = res.openPath.split(/[\\/]/).pop() ?? 'storia.fav'
    await get().openFile({ name, path: res.openPath, type: 'file' })
  },

  refreshTree: async () => {
    const root = get().projectRoot
    if (!root) return
    set({ tree: await window.favella.refreshTree(root) })
    await get().aggiornaInclusioni()
  },

  openFile: async (node) => {
    if (node.type !== 'file') return
    const esistente = get().openFiles.find((f) => f.path === node.path)
    if (esistente) {
      set({ activePath: node.path })
      return
    }
    // Normalizza i fine-riga a LF: gli span del round-trip (sidecar) e gli splice
    // degli editor visuali (split('\n')) assumono LF. Un file CRLF (editor
    // esterno, git autocrlf) farebbe slittare gli splice corrompendo il sorgente.
    // Al salvataggio il file resta LF: è la convenzione dei .fav.
    const content = (await window.favella.readFile(node.path)).replace(/\r\n?/g, '\n')
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
      openFiles: s.openFiles.map((f) => (f.path === path ? { ...f, content } : f)),
      revisione: s.revisione + 1
    }))
  },

  saveFile: async (path) => {
    const file = get().openFiles.find((f) => f.path === path)
    if (!file) return
    await window.favella.writeFile(path, file.content)
    set((s) => ({
      openFiles: s.openFiles.map((f) =>
        f.path === path ? { ...f, savedContent: f.content } : f
      ),
      inclusioniDisco: { ...s.inclusioniDisco, [path]: estraiInclusioni(file.content, path) }
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

  compileFile: async (path, source, sources) => {
    if (!path.toLowerCase().endsWith('.fav')) return
    set({ compiling: true })
    try {
      const res = await window.favella.compile(path, source, sources)
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
    // Compila la STORIA (il file principale coi suoi moduli) sui buffer live, anche non
    // salvati: la diagnostica è sempre aggiornata, qualunque file sia aperto.
    const ctx = contestoStoria(get())
    if (!ctx) return
    await get().compileFile(ctx.radice, ctx.sorgente, ctx.fonti)
  },

  requestReveal: (path, line, col) => {
    // Un problema si corregge nel testo, nel file in cui sta (anche un modulo incluso): lo
    // si porta davanti e, se il testo non è affiancato, si torna alla Storia.
    const vai = (p: string): void =>
      set((s) => ({
        activePath: p,
        reveal: { path: p, line, col, nonce: (s.reveal?.nonce ?? 0) + 1 },
        rightTab: s.affiancaTesto ? s.rightTab : null
      }))
    const aperto = get().openFiles.find((f) => stessoFile(f.path, path))
    if (aperto) vai(aperto.path)
    else void get().openFile({ name: nomeFile(path), path, type: 'file' }).then(() => vai(path))
  },

  // --- Dock destro ----------------------------------------------------------

  setRightTab: (tab) => set({ rightTab: tab }),
  closeDock: () => set({ rightTab: null }),

  // [Studio 0.10] Cambia sezione: la Storia è il testo (nessun pannello); le altre
  // riaprono l'ultima sotto-scheda usata, o la prima.
  setSezione: (sezione) => {
    const attuale = get().rightTab
    if (attuale) {
      const sezAttuale = SEZIONI.find((d) => d.sotto.some((x) => x.tab === attuale))
      if (sezAttuale) ultimaSotto[sezAttuale.id] = attuale
    }
    if (sezione === 'storia') {
      set({ rightTab: null })
      return
    }
    const def = SEZIONI.find((d) => d.id === sezione)
    const prima = def?.sotto[0]?.tab ?? null
    const salvata = ultimaSotto[sezione]
    set({ rightTab: salvata ?? prima })
  },
  setAffiancaTesto: (v) => {
    salvaPref('affiancaTesto', v)
    set({ affiancaTesto: v })
  },
  setProvaLato: (lato) => {
    salvaPref('provaLato', lato)
    set({ provaLato: lato })
  },
  setZoom: (z) => {
    const v = Math.max(0.8, Math.min(2, Math.round(z * 100) / 100))
    salvaPref('zoom', v)
    set({ zoom: v })
  },
  setEsploraAperto: (v) => {
    salvaPref('esploraAperto', v)
    set({ esploraAperto: v })
  },
  setProblemiAperti: (v) => {
    salvaPref('problemiAperti', v)
    set({ problemiAperti: v })
  },
  setUpdaterStatus: (updaterStatus) => set({ updaterStatus }),
  setUpdateModalOpen: (updateModalOpen) => set({ updateModalOpen }),

  // --- Gioco (Fase 3) -------------------------------------------------------

  // Avvia una partita su un file/buffer espliciti. È il cuore usato sia dal dock
  // inline (startGame) sia dalla finestra di gioco dedicata (che non ha activePath).
  startGameWith: async (path, source, sources) => {
    set({ gameBusy: true, gameError: null })
    try {
      const res = await window.favella.startGame(path, source, sources)
      if (!res.ok) {
        set({
          gameBusy: false,
          gameRunning: false,
          gameState: null,
          gameButtons: null,
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
        gameButtons: res.buttons ?? null,
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
    const ctx = contestoStoria(get())
    if (!ctx) {
      set({
        rightTab: 'gioca',
        gameBusy: false,
        gameRunning: false,
        gameState: null,
        gameButtons: null,
        gameLines: [],
        gameError: 'Apri un file .fav nell’editor per avviare il gioco.'
      })
      return
    }
    set({ rightTab: 'gioca' })
    await get().startGameWith(ctx.radice, ctx.sorgente, ctx.fonti)
  },

  // [IDE] Apre la finestra di gioco dedicata sul file .fav attivo (buffer live).
  launchGameWindow: () => {
    const ctx = contestoStoria(get())
    if (!ctx) return
    void window.favella.openGameWindow(ctx.radice, ctx.sorgente, ctx.fonti)
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
        gameButtons: res.buttons ?? null,
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
        gameButtons: res.buttons ?? null,
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
        gameButtons: res.buttons ?? null,
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

  clearEditError: () => set({ editError: null }),

  // --- Mappa + Inspector (Fase 4) -------------------------------------------

  loadWorldGraph: async () => {
    // Con una partita attiva, la mappa è quella del mondo giocato; altrimenti si
    // compila il buffer .fav attivo per un'anteprima della topologia.
    const { gameRunning } = get()
    const ctx = contestoStoria(get())
    set({ worldLoading: true })
    try {
      let graph: WorldGraph
      if (gameRunning) {
        graph = await window.favella.worldGraph()
      } else if (ctx) {
        graph = await window.favella.worldGraph(ctx.radice, ctx.sorgente, ctx.fonti)
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
    const ctx = contestoStoria(get())
    if (!ctx) {
      set({ outline: null })
      return
    }
    set({ outlineLoading: true })
    try {
      const o = await window.favella.worldOutline(ctx.radice, ctx.sorgente, ctx.fonti)
      set({ outlineLoading: false, outline: o })
    } catch {
      set({ outlineLoading: false })
    }
  },

  loadRules: async () => {
    const ctx = contestoStoria(get())
    if (!ctx) {
      set({ rules: null })
      return
    }
    set({ rulesLoading: true })
    try {
      const r = await window.favella.worldRules(ctx.radice, ctx.sorgente, ctx.fonti)
      set({ rulesLoading: false, rules: r })
    } catch {
      set({ rulesLoading: false })
    }
  },

  loadVariables: async () => {
    const ctx = contestoStoria(get())
    if (!ctx) {
      set({ variables: null })
      return
    }
    set({ variablesLoading: true })
    try {
      const v = await window.favella.worldVariables(ctx.radice, ctx.sorgente, ctx.fonti)
      set({ variablesLoading: false, variables: v })
    } catch {
      set({ variablesLoading: false })
    }
  },

  loadWords: async () => {
    const ctx = contestoStoria(get())
    if (!ctx) {
      set({ words: null })
      return
    }
    set({ wordsLoading: true })
    try {
      const w = await window.favella.worldWords(ctx.radice, ctx.sorgente, ctx.fonti)
      set({ wordsLoading: false, words: w })
    } catch {
      set({ wordsLoading: false })
    }
  },

  loadDialogues: async () => {
    const ctx = contestoStoria(get())
    if (!ctx) {
      set({ dialogues: null })
      return
    }
    set({ dialoguesLoading: true })
    try {
      const d = await window.favella.worldDialogues(ctx.radice, ctx.sorgente, ctx.fonti)
      set({ dialoguesLoading: false, dialogues: d })
    } catch {
      set({ dialoguesLoading: false })
    }
  },

  // --- Modifiche al testo, dai pannelli e dalla mappa ------------------------
  //
  // Ogni modifica passa da `applica`: calcola il testo nuovo di OGNI file toccato (una
  // frase può stare in un file incluso, non solo in quello davanti agli occhi), lo
  // mette nei buffer (con l'annulla nativo di Monaco per il file aperto) e ricarica i
  // pannelli. Niente si salva da solo: i file cambiati restano «da salvare».

  applica: async (mods) => {
    set({ editError: null })
    if (mods.length === 0) return true
    const s = get()
    const destinazione = destinazioneEffettiva(s)
    if (!destinazione) {
      set({ editError: 'Apri un file .fav per modificare la storia.' })
      return false
    }
    // Il testo di partenza di ogni file toccato: il buffer se è aperto, altrimenti il disco.
    const dati = new Map<string, FileDaModificare>()
    const daDisco = new Map<string, string>()
    const toccati = new Set<string>()
    for (const m of mods) {
      toccati.add(m.tipo === 'aggiungi' ? (m.file ?? destinazione) : m.tipo === 'file' ? m.file : m.span.file)
    }
    for (const f of toccati) {
      const aperto = s.openFiles.find((x) => stessoFile(x.path, f))
      if (aperto) {
        dati.set(chiave(f), { file: aperto.path, contenuto: aperto.content })
        continue
      }
      try {
        const testo = (await window.favella.readFile(f)).replace(/\r\n?/g, '\n')
        dati.set(chiave(f), { file: f, contenuto: testo })
        daDisco.set(chiave(f), testo)
      } catch (e) {
        set({ editError: `Non riesco a leggere «${nomeFile(f)}»: ${messaggioErrore(e)}` })
        return false
      }
    }
    const esito = calcolaContenuti(mods, dati, destinazione)
    if (!esito.ok) {
      set({ editError: esito.errore })
      return false
    }
    set((cur) => {
      const aperti = cur.openFiles.slice()
      for (const [k, nuovo] of esito.contenuti) {
        const i = aperti.findIndex((x) => chiave(x.path) === k)
        if (i >= 0) {
          aperti[i] = { ...aperti[i], content: nuovo }
        } else {
          const info = dati.get(k)!
          aperti.push({
            path: info.file,
            name: nomeFile(info.file),
            content: nuovo,
            savedContent: daDisco.get(k) ?? info.contenuto,
            language: linguaDa(info.file)
          })
        }
      }
      const perAttivo = cur.activePath ? esito.contenuti.get(chiave(cur.activePath)) : undefined
      return {
        openFiles: aperti,
        revisione: cur.revisione + 1,
        pendingEdit:
          perAttivo !== undefined
            ? { path: cur.activePath as string, finale: perAttivo, nonce: (cur.pendingEdit?.nonce ?? 0) + 1 }
            : cur.pendingEdit
      }
    })
    await get().ricarica()
    return true
  },

  ricarica: async () => {
    await Promise.all([
      get().loadOutline(),
      get().loadWorldGraph(),
      get().loadRules(),
      get().loadVariables(),
      get().loadDialogues(),
      get().loadWords()
    ])
  },

  // Genera la frase canonica dalla spec e la SCRIVE: se 'span' è dato SOSTITUISCE
  // quella frase (nel file in cui sta), altrimenti la AGGIUNGE in fondo al file dei
  // nuovi elementi.
  applyStatement: async (spec, span) => {
    set({ editError: null })
    const r = await serializza(spec)
    if (!r.ok) {
      set({ editError: r.errore })
      return
    }
    await get().applica([span ? { tipo: 'sostituisci', span, testo: r.testo } : { tipo: 'aggiungi', testo: r.testo }])
  },

  deleteStatement: async (span) => {
    await get().applica([{ tipo: 'elimina', span }])
  },

  // Serializza N spec e le appende come UN UNICO blocco (una riga per frase): così non
  // ci sono span che slittano fra una frase e l'altra.
  appendStatements: async (specs) => {
    set({ editError: null })
    if (specs.length === 0) return
    const testi: string[] = []
    for (const spec of specs) {
      const r = await serializza(spec)
      if (!r.ok) {
        set({ editError: r.errore })
        return
      }
      testi.push(r.testo)
    }
    await get().applica([{ tipo: 'aggiungi', testo: testi.join('\n') }])
  },

  mapAddRoom: async (name) => {
    const nome = name.trim()
    if (!nome) return
    await get().applyStatement({ op: 'room_def', name: nome })
  },

  // Una connessione nuova fra due stanze. Se la direzione non è ancora valida nel mondo
  // la si dichiara IN COPPIA OPPOSTA (quella data dall'autore, o quella di default per
  // le verticali comuni): senza opposta non si scrive niente.
  mapAddConnection: async (fromId, direction, toId, opposite) => {
    set({ editError: null })
    const { outline } = get()
    if (!outline) return
    const da = outline.rooms.find((r) => r.id === fromId)
    const a = outline.rooms.find((r) => r.id === toId)
    if (!da || !a) return
    const dir = direction.trim().toLowerCase()
    if (da.exits.some((e) => e.direction === dir)) {
      set({ editError: `«${da.name}» ha già un’uscita a ${dir}: scegli un’altra direzione.` })
      return
    }
    const p = await preparaDirezione(outline, dir, opposite)
    if (!p.ok) {
      set({ editError: p.errore })
      return
    }
    const r = await serializza({ op: 'connection', from: da.name, direction: dir, to: a.name })
    if (!r.ok) {
      set({ editError: r.errore })
      return
    }
    await get().applica([{ tipo: 'aggiungi', testo: p.dichiarazione + r.testo }])
  },

  // Cambia una connessione già scritta: la direzione e/o la stanza dall'altra parte,
  // viste dalla stanza `daId`. Se l'uscita è solo il ritorno automatico di un'altra frase
  // («Y collega nord a X» dà a X l'uscita a sud) si riscrive quella frase d'origine, con
  // la direzione opposta: il ritorno segue da solo.
  cambiaUscita: async ({ daId, uscita, direzione, versoId, opposta }) => {
    set({ editError: null })
    const { outline } = get()
    if (!outline) return
    const stanza = outline.rooms.find((r) => r.id === daId)
    const destinazione = outline.rooms.find((r) => r.id === (versoId ?? uscita.to))
    if (!stanza || !destinazione) return
    if (!uscita.span) {
      set({ editError: 'Questa uscita non ha una frase da cambiare: modificala nel testo.' })
      return
    }
    const dir = (direzione ?? uscita.direction).trim().toLowerCase()
    if (stanza.exits.some((e) => e !== uscita && e.direction === dir)) {
      set({ editError: `«${stanza.name}» ha già un’uscita a ${dir}: scegli un’altra direzione.` })
      return
    }
    const p = await preparaDirezione(outline, dir, opposta)
    if (!p.ok) {
      set({ editError: p.errore })
      return
    }
    const spec: SerializeSpec = uscita.implicit
      ? { op: 'connection', from: destinazione.name, direction: p.opposta, to: stanza.name }
      : { op: 'connection', from: stanza.name, direction: dir, to: destinazione.name }
    const r = await serializza(spec)
    if (!r.ok) {
      set({ editError: r.errore })
      return
    }
    const mods: Modifica[] = [{ tipo: 'sostituisci', span: uscita.span, testo: r.testo }]
    if (p.dichiarazione) mods.push({ tipo: 'aggiungi', testo: p.dichiarazione.replace(/\n$/, '') })
    await get().applica(mods)
  },

  // Toglie una connessione (e con lei il ritorno): la frase «collega» da cui nasce.
  eliminaUscita: async (uscita) => {
    if (!uscita.span) {
      set({ editError: 'Questa uscita non ha una frase da togliere: modificala nel testo.' })
      return
    }
    await get().applica([{ tipo: 'elimina', span: uscita.span }])
  },

  mapDeleteConnection: async (aId, bId) => {
    set({ editError: null })
    const { outline } = get()
    if (!outline) return
    // La frase 'collega' ESPLICITA che unisce le due stanze, in una qualunque direzione.
    let span: OutlineSpan | null = null
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
      set({ editError: 'Connessione non trovata nel sorgente (forse generata da un’altra frase).' })
      return
    }
    await get().applica([{ tipo: 'elimina', span }])
  },

  // --- Riordino, rinomina, eliminazione ---------------------------------------

  // Riordina il testo in modo sensato: ogni file della storia, nel suo file.
  riordinaStoria: async () => {
    const ctx = contestoStoria(get())
    if (!ctx) return
    let res
    try {
      res = await window.favella.reorderStory(ctx.radice, ctx.sorgente, ctx.fonti)
    } catch (e) {
      set({ gameNotice: 'Riordino non riuscito: ' + messaggioErrore(e) })
      return
    }
    if (!res.ok) {
      set({ gameNotice: res.reason ?? 'Riordino non riuscito.' })
      return
    }
    const cambiati = res.files.filter((f) => f.changed)
    if (cambiati.length === 0) {
      set({ gameNotice: 'Il testo è già in ordine.' })
      return
    }
    const ok = await get().applica(cambiati.map((f) => ({ tipo: 'file' as const, file: f.path, testo: f.text })))
    if (ok) {
      set({
        gameNotice:
          cambiati.length === 1
            ? 'Testo riordinato.'
            : `Testo riordinato in ${cambiati.length} file. Ricordati di salvare.`
      })
    }
  },

  // Cambia il nome di una stanza o di un oggetto in ogni frase che lo cita.
  rinominaElemento: async (nome, nuovoNome) => {
    set({ editError: null })
    const ctx = contestoStoria(get())
    if (!ctx) return false
    let res
    try {
      res = await window.favella.renameEntity(ctx.radice, ctx.sorgente, ctx.fonti, nome, nuovoNome)
    } catch (e) {
      set({ editError: 'Rinomina non riuscita: ' + messaggioErrore(e) })
      return false
    }
    if (!res.ok) {
      set({ editError: res.reason ?? 'Rinomina non riuscita.' })
      return false
    }
    if (res.files.length === 0) return true
    const ok = await get().applica(res.files.map((f) => ({ tipo: 'file' as const, file: f.path, testo: f.text })))
    if (ok && res.mentions.length > 0) {
      set({
        gameNotice:
          `Rinominato. Il vecchio nome compare ancora in ${res.mentions.length === 20 ? 'più di 19' : res.mentions.length} ` +
          'testi (descrizioni, risposte): controllali.'
      })
    }
    return ok
  },

  // Che cosa porterebbe via l'eliminazione di una stanza o di un oggetto.
  riferimentiElemento: async (nome) => {
    const ctx = contestoStoria(get())
    if (!ctx) return null
    try {
      const res = await window.favella.entityReferences(ctx.radice, ctx.sorgente, ctx.fonti, nome)
      if (!res.ok) {
        set({ editError: res.reason ?? 'Non riesco a leggere i riferimenti.' })
        return null
      }
      return res
    } catch (e) {
      set({ editError: 'Non riesco a leggere i riferimenti: ' + messaggioErrore(e) })
      return null
    }
  },

  // Toglie le frasi indicate (le stesse che `riferimentiElemento` ha elencato).
  eliminaFrasi: async (spans) => {
    const visti = new Set<string>()
    const mods: Modifica[] = []
    for (const sp of spans) {
      const k = chiave(sp.file) + ':' + sp.line
      if (visti.has(k)) continue
      visti.add(k)
      mods.push({ tipo: 'elimina', span: sp })
    }
    return get().applica(mods)
  },

  exportGame: async () => {
    const ctx = contestoStoria(get())
    if (!ctx) return
    let res
    try {
      res = await window.favella.exportGameHtml(ctx.radice, ctx.sorgente, ctx.fonti)
    } catch (e) {
      set({ gameNotice: 'Esportazione non riuscita: ' + messaggioErrore(e) })
      return
    }
    if (!res.ok || !res.html) {
      set({ gameNotice: res.reason ?? 'Esportazione non riuscita.' })
      return
    }
    try {
      const w = await window.favella.writeExport(res.html, res.title ?? 'gioco')
      if (w.ok) set({ gameNotice: 'Gioco esportato in HTML: ' + (w.path ?? '') })
    } catch (e) {
      set({ gameNotice: 'Salvataggio non riuscito: ' + messaggioErrore(e) })
    }
  },

  // --- Dialoghi: rinomina e elimina un nodo ------------------------------------

  renameDialogueNode: async (oldLabel, newLabel) => {
    set({ editError: null })
    const d = get().dialogues
    const nl = newLabel.trim()
    if (!d?.ok || !nl || nl === oldLabel) return
    // Raccoglie ogni frase che cita l'etichetta vecchia, con la spec rigenerata.
    const jobs: { span: OutlineSpan; spec: SerializeSpec }[] = []
    for (const nd of d.nodes) {
      const isThisNode = nd.label === oldLabel
      if (isThisNode && nd.lineSpan && nd.speaker) {
        jobs.push({
          span: nd.lineSpan,
          spec: { op: 'node_line', speaker: nd.speaker.name, node: nl, line: nd.line }
        })
      }
      for (const o of nd.options) {
        if (!o.span) continue
        const pointsHere = o.dest === oldLabel
        if (!isThisNode && !pointsHere) continue
        jobs.push({
          span: o.span,
          spec: {
            op: 'dialogue_option',
            node: isThisNode ? nl : nd.label,
            text: o.text,
            condition: o.condition,
            outcome: o.outcome,
            dest:
              o.outcome === 'conduce'
                ? pointsHere
                  ? nl
                  : (o.dest ?? undefined)
                : undefined,
            consequences: o.consequences
          }
        })
      }
    }
    for (const npc of d.npcs) {
      if (npc.startNode === oldLabel && npc.startSpan) {
        jobs.push({ span: npc.startSpan, spec: { op: 'dialogue_start', name: npc.name, node: nl } })
      }
    }
    if (jobs.length === 0) return
    const mods: Modifica[] = []
    for (const j of jobs) {
      const r = await serializza(j.spec)
      if (!r.ok) {
        set({ editError: r.errore || 'Rinomina non riuscita (opzione troppo complessa: usa il testo).' })
        return
      }
      mods.push({ tipo: 'sostituisci', span: j.span, testo: r.testo })
    }
    await get().applica(mods)
  },

  // Elimina un intero nodo: la battuta, le sue opzioni e il «comincia con» che vi punta.
  deleteDialogueNode: async (label) => {
    const d = get().dialogues
    if (!d?.ok) return
    const spans: OutlineSpan[] = []
    const nd = d.nodes.find((n) => n.label === label)
    if (nd?.lineSpan) spans.push(nd.lineSpan)
    if (nd) for (const o of nd.options) if (o.span) spans.push(o.span)
    for (const npc of d.npcs) if (npc.startNode === label && npc.startSpan) spans.push(npc.startSpan)
    if (spans.length === 0) return
    await get().eliminaFrasi(spans)
  },

  // --- Storie a più file ---------------------------------------------------------

  aggiornaInclusioni: async () => {
    const nodi = get().tree
    const files: FileNode[] = []
    const raccogli = (lista: FileNode[]): void => {
      for (const n of lista) {
        if (n.type === 'dir') raccogli(n.children ?? [])
        else if (n.name.toLowerCase().endsWith('.fav')) files.push(n)
      }
    }
    raccogli(nodi)
    const out: GrafoInclusioni = {}
    await Promise.all(
      files.map(async (f) => {
        try {
          out[f.path] = estraiInclusioni((await window.favella.readFile(f.path)).replace(/\r\n?/g, '\n'), f.path)
        } catch {
          out[f.path] = []
        }
      })
    )
    set({ inclusioniDisco: out })
  },

  impostaDestinazioneNuovi: (path) => set({ destinazioneNuovi: path }),

  // Un file nuovo accanto agli altri. Con `includi` la storia principale lo include subito.
  nuovoFileStoria: async (nome, includi) => {
    const s = get()
    const st = infoStoria(s)
    if (!s.projectRoot) return false
    const dir = st ? cartellaDi(st.radice) : s.projectRoot
    const nomeFinale = conEstensione(nome)
    const percorso = unisci(dir, nomeFinale)
    try {
      if (await window.favella.pathExists(percorso)) {
        set({ editError: `«${nomeFinale}» esiste già in questa cartella.` })
        return false
      }
      await window.favella.writeFile(percorso, '')
    } catch (e) {
      set({ editError: 'Non riesco a creare il file: ' + messaggioErrore(e) })
      return false
    }
    await get().refreshTree()
    // Si include PRIMA di aprirlo: una volta aperto, il file nuovo sarebbe «la storia» da solo.
    if (includi && st) {
      const ok = await get().includiFile(percorso, st.radice)
      if (!ok) return false
    }
    await get().openFile({ name: nomeFinale, path: percorso, type: 'file' })
    // Il file nuovo è il posto giusto dove mettere le prossime cose.
    if (includi && st) set({ destinazioneNuovi: percorso })
    return true
  },

  // Aggiunge «Includi "x.fav".» alla storia principale (in cima, dopo gli altri Includi).
  includiFile: async (percorso, radicePassata) => {
    const grafo = grafoCorrente(get().inclusioniDisco, get().openFiles)
    const radice = radicePassata ?? infoStoria(get())?.radice
    if (!radice) return false
    if (membriDi(radice, grafo).some((m) => stessoFile(m, percorso))) return true
    const aperto = get().openFiles.find((f) => stessoFile(f.path, radice))
    let contenuto: string
    if (aperto) contenuto = aperto.content
    else {
      try {
        contenuto = (await window.favella.readFile(radice)).replace(/\r\n?/g, '\n')
      } catch (e) {
        set({ editError: 'Non riesco a leggere la storia principale: ' + messaggioErrore(e) })
        return false
      }
    }
    // Un modulo non può includere chi lo include (sarebbe un giro senza fine).
    if (membriDi(percorso, grafo).some((m) => stessoFile(m, radice))) {
      set({ editError: 'Quel file include già questa storia: includerlo farebbe un giro senza fine.' })
      return false
    }
    const riga = `Includi "${relativo(cartellaDi(radice), percorso)}".`
    const esistenti = righeInclusioni(contenuto)
    const dopo = esistenti.length ? esistenti[esistenti.length - 1].riga : 0
    const righe = contenuto.split('\n')
    righe.splice(dopo, 0, riga)
    return get().applica([{ tipo: 'file', file: radice, testo: righe.join('\n') }])
  },

  // Toglie «Includi "x.fav".» dalla storia principale: il file resta sul disco, ma non è più della storia.
  togliInclusione: async (percorso) => {
    const st = infoStoria(get())
    if (!st) return false
    // L'inclusione sta nel file che include `percorso` (non per forza la radice).
    const chi = st.membri.find((m) => {
      const k = Object.keys(st.grafo).find((g) => stessoFile(g, m))
      return !!k && st.grafo[k].some((x) => stessoFile(x, percorso))
    })
    if (!chi) return false
    const aperto = get().openFiles.find((f) => stessoFile(f.path, chi))
    let contenuto: string
    if (aperto) contenuto = aperto.content
    else {
      try {
        contenuto = (await window.favella.readFile(chi)).replace(/\r\n?/g, '\n')
      } catch (e) {
        set({ editError: 'Non riesco a leggere il file: ' + messaggioErrore(e) })
        return false
      }
    }
    const base = cartellaDi(chi)
    const righe = contenuto.split('\n')
    const target = righeInclusioni(contenuto).find((r) => stessoFile(unisci(base, r.percorso), percorso))
    if (!target) return false
    righe.splice(target.riga - 1, 1)
    return get().applica([{ tipo: 'file', file: chi, testo: righe.join('\n') }])
  },

  // «Salva con nome»: copia il file davanti a te in un altro file (dentro il progetto) e
  // passa a quello. Il file di prima resta com'è sul disco.
  salvaConNome: async () => {
    const s = get()
    const attivo = s.openFiles.find((f) => f.path === s.activePath)
    if (!attivo || !s.projectRoot) return
    let destinazione: string | null
    try {
      destinazione = await window.favella.chooseSavePath(attivo.name)
    } catch (e) {
      set({ gameNotice: 'Salva con nome non riuscito: ' + messaggioErrore(e) })
      return
    }
    if (!destinazione) return
    if (stessoFile(destinazione, attivo.path)) {
      await get().saveFile(attivo.path)
      return
    }
    // Gli «Includi» sono relativi: se il file cambia cartella vanno riscritti.
    let testo = attivo.content
    const vecchia = cartellaDi(attivo.path)
    const nuova = cartellaDi(destinazione)
    if (!stessoFile(vecchia, nuova)) {
      const righe = testo.split('\n')
      for (const inc of righeInclusioni(testo)) {
        const assoluto = unisci(vecchia, inc.percorso)
        righe[inc.riga - 1] = `Includi "${relativo(nuova, assoluto)}".`
      }
      testo = righe.join('\n')
    }
    try {
      await window.favella.writeFile(destinazione, testo)
    } catch (e) {
      set({ gameNotice: 'Non riesco a salvare: ' + messaggioErrore(e) })
      return
    }
    await get().refreshTree()
    // La scheda passa al file nuovo; il vecchio, se era sporco, torna com'è sul disco.
    const nome = nomeFile(destinazione)
    set((cur) => ({
      openFiles: [
        ...cur.openFiles.filter((f) => !stessoFile(f.path, attivo.path)),
        { path: destinazione as string, name: nome, content: testo, savedContent: testo, language: linguaDa(nome) }
      ],
      activePath: destinazione,
      revisione: cur.revisione + 1
    }))
    set({ gameNotice: `Salvato come «${nome}».` })
  },

  // «Salva il progetto come…»: copia tutta la cartella (storia e moduli) in una cartella
  // nuova e passa a lavorare lì.
  salvaProgettoCome: async () => {
    const s = get()
    if (!s.projectRoot) return
    const testi: Record<string, string> = {}
    for (const f of s.openFiles) if (f.content !== f.savedContent) testi[f.path] = f.content
    let res
    try {
      res = await window.favella.saveProjectAs(testi)
    } catch (e) {
      set({ gameNotice: 'Salva il progetto come… non riuscito: ' + messaggioErrore(e) })
      return
    }
    if (!res) return
    // Ogni percorso aperto cambia radice; i buffer sporchi sono già nella copia.
    const rimappa = (p: string): string => {
      const v = chiave(res.oldRoot)
      return chiave(p).startsWith(v) ? res.root + p.slice(res.oldRoot.length) : p
    }
    set((cur) => ({
      projectRoot: res.root,
      tree: res.tree,
      openFiles: cur.openFiles.map((f) => ({ ...f, path: rimappa(f.path), savedContent: f.content })),
      activePath: cur.activePath ? rimappa(cur.activePath) : null,
      destinazioneNuovi: cur.destinazioneNuovi ? rimappa(cur.destinazioneNuovi) : null,
      revisione: cur.revisione + 1
    }))
    await get().aggiornaInclusioni()
    set({ gameNotice: 'Progetto salvato in «' + nomeFile(res.root) + '»: ora lavori sulla copia.' })
  }
}))
