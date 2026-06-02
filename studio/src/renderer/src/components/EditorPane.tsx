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
  const pendingEdit = useStudio((s) => s.pendingEdit)
  const updateContent = useStudio((s) => s.updateContent)
  const setCursor = useStudio((s) => s.setCursor)
  const saveActive = useStudio((s) => s.saveActive)
  const compileActive = useStudio((s) => s.compileActive)

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const editApplicatoRef = useRef<number>(0)

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
  // Dipende da `activePath` (primitivo), NON da `active`: quest'ultimo cambia
  // identità a ogni battitura (lo store ricrea openFiles), e ri-eseguire questo
  // effetto a ogni tasto è inutile.
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco || !activePath) return
    const model = editor.getModel()
    if (!model) return

    const markers: MonacoEditor.IMarkerData[] = problems
      .filter((d) => stessoPercorso(d.file, activePath) && d.line)
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
  }, [problems, activePath])

  // Salto a riga richiesto dal pannello Problemi. CRITICO: dipende SOLO da
  // `reveal` (che cambia identità a ogni nuova richiesta, via nonce) e da
  // `activePath`. NON da `active`: se dipendesse da `active` — che cambia a ogni
  // battitura — il cursore verrebbe rispinto alla posizione del reveal a ogni
  // tasto, scrivendo il testo al contrario (bug osservato editando la riga di un
  // errore dopo averci cliccato sopra nel pannello Problemi).
  useEffect(() => {
    const editor = editorRef.current
    if (!reveal || !activePath || !editor) return
    if (!stessoPercorso(reveal.path, activePath)) return
    editor.revealLineInCenter(reveal.line)
    editor.setPosition({ lineNumber: reveal.line, column: reveal.col })
    editor.focus()
  }, [reveal, activePath])

  // Modifica programmatica dal map editor (Fase 6a): applica gli edit via Monaco
  // (executeEdits) così l'UNDO è nativo e onChange aggiorna lo store. Dipende SOLO
  // da pendingEdit (nonce) e activePath, MAI da `active` (vedi nota sul reveal). Il
  // ref evita di riapplicare lo stesso nonce a un re-render.
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!pendingEdit || !editor || !monaco || !activePath) return
    if (!stessoPercorso(pendingEdit.path, activePath)) return
    if (pendingEdit.nonce === editApplicatoRef.current) return
    const model = editor.getModel()
    if (!model) return
    editApplicatoRef.current = pendingEdit.nonce

    const ops: MonacoEditor.IIdentifiedSingleEditOperation[] = []
    for (const e of pendingEdit.edits) {
      if (e.kind === 'append') {
        const lastLine = model.getLineCount()
        const lastCol = model.getLineMaxColumn(lastLine)
        const testo = model.getValue()
        const prefisso = testo.endsWith('\n') || testo === '' ? '' : '\n'
        ops.push({
          range: new monaco.Range(lastLine, lastCol, lastLine, lastCol),
          text: prefisso + e.text + '\n',
          forceMoveMarkers: true
        })
      } else if (e.kind === 'replaceLines') {
        ops.push({
          range: new monaco.Range(e.startLine, 1, e.endLine, model.getLineMaxColumn(e.endLine)),
          text: e.text
        })
      } else {
        const lineCount = model.getLineCount()
        if (e.endLine < lineCount) {
          ops.push({
            range: new monaco.Range(e.startLine, 1, e.endLine + 1, 1),
            text: ''
          })
        } else {
          const sl = e.startLine > 1 ? e.startLine - 1 : e.startLine
          const sc = e.startLine > 1 ? model.getLineMaxColumn(e.startLine - 1) : 1
          ops.push({
            range: new monaco.Range(sl, sc, e.endLine, model.getLineMaxColumn(e.endLine)),
            text: ''
          })
        }
      }
    }
    editor.executeEdits('favella-visual', ops)
    editor.pushUndoStop()
  }, [pendingEdit, activePath])

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
      // key per-percorso: ogni file ha il proprio editor/modello, rimontato al
      // cambio scheda. defaultValue (NON value): l'editor è "uncontrolled" sul
      // testo — Monaco possiede il buffer e il cursore, lo store si aggiorna via
      // onChange. Con `value` controllato il round-trip a ogni tasto resettava il
      // cursore (testo digitato al contrario). 'path' rimosso per evitare la cache
      // dei modelli per-URI fra i rimontaggi.
      key={active.path}
      language={active.language}
      defaultValue={active.content}
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
