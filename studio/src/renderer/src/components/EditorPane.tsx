import { useEffect, useRef } from 'react'
import Editor, {
  type Monaco,
  type OnMount
} from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useStudio, stessoPercorso } from '../store'
import { FAVELLA_LANG_ID, definisciTemi, registraLinguaFavella } from '../monaco/favella-language'
import { aspettoCorrente, suAspetto, temaMonaco } from '../aspetto'
import { modificaMinima } from '../utils/modifiche'

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
  const saveAll = useStudio((s) => s.saveAll)
  const compileActive = useStudio((s) => s.compileActive)

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  // Una modifica già in sospeso quando l'editor compare è già dentro il testo con cui parte:
  // si applicano solo quelle che arrivano dopo.
  const editApplicatoRef = useRef<number>(useStudio.getState().pendingEdit?.nonce ?? 0)

  const active = openFiles.find((f) => f.path === activePath)

  const handleBeforeMount = (monaco: Monaco): void => {
    definisciTemi(monaco)
    if (lexicon) registraLinguaFavella(monaco, lexicon)
  }

  // [Studio 1.2] Se il motore risponde DOPO l'apertura del file, il lessico arriva tardi:
  // si registra la lingua allora e la si dà al modello (prima il testo restava senza
  // colori finché non si riapriva il file).
  useEffect(() => {
    const monaco = monacoRef.current
    const model = editorRef.current?.getModel()
    if (!monaco || !model || !lexicon || !activePath?.toLowerCase().endsWith('.fav')) return
    registraLinguaFavella(monaco, lexicon)
    if (model.getLanguageId() !== FAVELLA_LANG_ID) monaco.editor.setModelLanguage(model, FAVELLA_LANG_ID)
  }, [lexicon, activePath])

  // Il tema segue la Leggibilità (notte/carta, contrasto).
  useEffect(() => suAspetto((a) => monacoRef.current?.editor.setTheme(temaMonaco(a))), [])

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    monaco.editor.setTheme(temaMonaco(aspettoCorrente()))
    // I .fav sono LF per convenzione (gli span del round-trip lo assumono):
    // anche se nel buffer arrivasse del CRLF, il modello resta in LF e ogni
    // Invio inserisce '\n'. Cintura e bretelle rispetto alla normalizzazione
    // fatta all'apertura del file nello store.
    editor.getModel()?.setEOL(monaco.editor.EndOfLineSequence.LF)
    editor.onDidChangeCursorPosition((e) => setCursor(e.position.lineNumber, e.position.column))
    // Ctrl+S salva tutta la storia: un pannello può aver cambiato più di un file.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      void saveAll()
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

    // Lo store dà il testo che il file deve avere dopo la modifica: a Monaco si passa
    // solo la parte che cambia, così il cursore resta dov'è e l'annulla toglie proprio
    // quella modifica.
    const cambio = modificaMinima(model.getValue(), pendingEdit.finale)
    if (!cambio) return
    const da = model.getPositionAt(cambio.da)
    const a = model.getPositionAt(cambio.a)
    editor.executeEdits('favella-visual', [
      {
        range: new monaco.Range(da.lineNumber, da.column, a.lineNumber, a.column),
        text: cambio.testo,
        forceMoveMarkers: true
      }
    ])
    editor.pushUndoStop()
  }, [pendingEdit, activePath])

  if (!active) {
    return (
      <div className="vuoto">
        <p className="vuoto-titolo">Nessun file aperto</p>
        <p>Scegli un file della storia dall’elenco a sinistra, o dalla barra in alto.</p>
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
      theme={temaMonaco(aspettoCorrente())}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={(v) => updateContent(active.path, v ?? '')}
      options={{
        fontSize: 15,
        lineHeight: 26,
        accessibilitySupport: 'auto',
        ariaLabel: `Il testo di ${active.name}`,
        fontFamily: "'Source Code Pro', 'Cascadia Code', Consolas, monospace",
        minimap: { enabled: false },
        padding: { top: 14, bottom: 14 },
        renderLineHighlight: 'line',
        cursorBlinking: 'smooth',
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
