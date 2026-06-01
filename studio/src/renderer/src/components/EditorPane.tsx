import { useEffect, useRef } from 'react'
import Editor, {
  type Monaco,
  type OnMount
} from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useStudio, stessoPercorso } from '../store'
import { FAVELLA_THEME, registraLinguaFavella } from '../monaco/favella-language'

const MARKER_OWNER = 'favella'

export default function EditorPane(): JSX.Element {
  const openFiles = useStudio((s) => s.openFiles)
  const activePath = useStudio((s) => s.activePath)
  const lexicon = useStudio((s) => s.lexicon)
  const problems = useStudio((s) => s.problems)
  const reveal = useStudio((s) => s.reveal)
  const updateContent = useStudio((s) => s.updateContent)
  const setCursor = useStudio((s) => s.setCursor)
  const saveActive = useStudio((s) => s.saveActive)
  const compileActive = useStudio((s) => s.compileActive)

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const active = openFiles.find((f) => f.path === activePath)

  const handleBeforeMount = (monaco: Monaco): void => {
    if (lexicon) registraLinguaFavella(monaco, lexicon)
  }

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    monaco.editor.setTheme(FAVELLA_THEME)
    editor.onDidChangeCursorPosition((e) => setCursor(e.position.lineNumber, e.position.column))
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      void saveActive()
    })
    // Ctrl+B: forza una compilazione del buffer attivo (oltre all'auto-compile).
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      void compileActive()
    })
  }

  // Marker Monaco: traduce le diagnostiche del file attivo in setModelMarkers.
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco || !active) return
    const model = editor.getModel()
    if (!model) return

    const markers: MonacoEditor.IMarkerData[] = problems
      .filter((d) => stessoPercorso(d.file, active.path) && d.line)
      .map((d) => {
        const line = d.line as number
        const col = d.col ?? 1
        return {
          severity:
            d.severity === 'error'
              ? monaco.MarkerSeverity.Error
              : monaco.MarkerSeverity.Warning,
          message: d.imprecise
            ? d.message + '\n(posizione approssimata)'
            : d.message,
          startLineNumber: line,
          startColumn: col,
          endLineNumber: line,
          endColumn: model.getLineMaxColumn(line),
          source: d.code || MARKER_OWNER
        }
      })
    monaco.editor.setModelMarkers(model, MARKER_OWNER, markers)
  }, [problems, active, activePath])

  // Salto a riga richiesto dal pannello Problemi.
  useEffect(() => {
    const editor = editorRef.current
    if (!reveal || !active || !editor) return
    if (!stessoPercorso(reveal.path, active.path)) return
    editor.revealLineInCenter(reveal.line)
    editor.setPosition({ lineNumber: reveal.line, column: reveal.col })
    editor.focus()
  }, [reveal, active])

  if (!active) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-inner">
          <div className="big-logo">✦</div>
          <h2>Favella Studio</h2>
          <p>Apri una cartella e seleziona un file <code>.fav</code> per iniziare a scrivere.</p>
        </div>
      </div>
    )
  }

  return (
    <Editor
      key={active.path}
      path={active.path}
      language={active.language}
      value={active.content}
      theme={FAVELLA_THEME}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={(v) => updateContent(active.path, v ?? '')}
      options={{
        fontSize: 14,
        fontFamily: "'Cascadia Code', 'Consolas', monospace",
        minimap: { enabled: true },
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        tabSize: 2,
        wordWrap: 'on',
        smoothScrolling: true,
        automaticLayout: true
      }}
    />
  )
}
