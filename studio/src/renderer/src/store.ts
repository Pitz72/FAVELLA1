import { create } from 'zustand'
import type { FileNode, EngineLexicon, SidecarStatus } from '../../shared/protocol'
import { FAVELLA_LANG_ID } from './monaco/favella-language'

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
  setCursor: (line, column) => set({ cursor: { line, column } })
}))
