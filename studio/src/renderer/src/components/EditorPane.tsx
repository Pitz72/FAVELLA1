import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import { useStudio } from '../store'
import { FAVELLA_THEME, registraLinguaFavella } from '../monaco/favella-language'

export default function EditorPane(): JSX.Element {
  const openFiles = useStudio((s) => s.openFiles)
  const activePath = useStudio((s) => s.activePath)
  const lexicon = useStudio((s) => s.lexicon)
  const updateContent = useStudio((s) => s.updateContent)
  const setCursor = useStudio((s) => s.setCursor)
  const saveActive = useStudio((s) => s.saveActive)

  const active = openFiles.find((f) => f.path === activePath)

  const handleBeforeMount = (monaco: Monaco): void => {
    if (lexicon) registraLinguaFavella(monaco, lexicon)
  }

  const handleMount: OnMount = (editor, monaco) => {
    monaco.editor.setTheme(FAVELLA_THEME)
    editor.onDidChangeCursorPosition((e) => setCursor(e.position.lineNumber, e.position.column))
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      void saveActive()
    })
  }

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
