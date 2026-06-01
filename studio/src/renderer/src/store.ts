import { create } from 'zustand'
import type {
  FileNode,
  EngineLexicon,
  SidecarStatus,
  Diagnostic,
  WorldSummary
} from '../../shared/protocol'
import { FAVELLA_LANG_ID } from './monaco/favella-language'

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

export interface OpenFile {
  path: string
  name: string
  content: string
  savedContent: string
  language: string
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

  // Azioni
  openProject: () => Promise<void>
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
}

function linguaDa(name: string): string {
  return name.toLowerCase().endsWith('.fav') ? FAVELLA_LANG_ID : 'plaintext'
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

  openProject: async () => {
    const res = await window.favella.openProject()
    if (!res) return
    set({ projectRoot: res.root, tree: res.tree })
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
    set((s) => ({ reveal: { path, line, col, nonce: (s.reveal?.nonce ?? 0) + 1 } }))
}))
