// Registrazione della lingua `favella` in Monaco: tokenizer Monarch alimentato
// dal lessico REALE del motore (engine.lexicon), così l'highlighting resta in
// lockstep col linguaggio. Commenti `#`, stringhe `"…"` con interpolazione [var].
import type { Monaco } from '@monaco-editor/react'
import type { EngineLexicon } from '../../../shared/protocol'

export const FAVELLA_LANG_ID = 'favella'
export const FAVELLA_THEME = 'favella-dark'

let registrata = false

export function registraLinguaFavella(monaco: Monaco, lexicon: EngineLexicon): void {
  if (registrata) return
  registrata = true

  monaco.languages.register({ id: FAVELLA_LANG_ID, extensions: ['.fav'], aliases: ['FAVELLA', 'favella'] })

  monaco.languages.setMonarchTokensProvider(FAVELLA_LANG_ID, {
    defaultToken: '',
    ignoreCase: true,
    // \b non funziona con gli accenti (è): usiamo confini basati su lookahead.
    tokenizer: {
      root: [
        [/#.*$/, 'comment'],
        [/"/, { token: 'string.quote', next: '@stringa' }],
        [/\b\d+\b/, 'number'],
        // Parole: confronto contro le tre classi del lessico del motore.
        [/[A-Za-zÀ-ÿ']+/, {
          cases: {
            [`@keywordsRiservate`]: 'keyword',
            [`@keywordsVerbi`]: 'type',
            [`@keywordsDirezioni`]: 'constant',
            '@default': 'identifier'
          }
        }],
        [/[.:]/, 'delimiter']
      ],
      stringa: [
        [/\[[^\]]*\]/, 'variable'], // interpolazione [var]
        [/\\./, 'string.escape'],
        [/[^"\\[]+/, 'string'],
        [/"/, { token: 'string.quote', next: '@pop' }]
      ]
    },
    // Le tre liste consultate dai `cases` sopra.
    keywordsRiservate: lexicon.reserved,
    keywordsVerbi: lexicon.verbs,
    keywordsDirezioni: lexicon.directions
    // I campi extra sono leciti: Monarch li espone ai `cases` per nome.
  } as never)

  monaco.languages.setLanguageConfiguration(FAVELLA_LANG_ID, {
    comments: { lineComment: '#' },
    brackets: [['[', ']']],
    autoClosingPairs: [
      { open: '"', close: '"' },
      { open: '[', close: ']' }
    ],
    surroundingPairs: [
      { open: '"', close: '"' },
      { open: '[', close: ']' }
    ]
  })

  // Completamento base: keyword + verbi + direzioni del linguaggio.
  monaco.languages.registerCompletionItemProvider(FAVELLA_LANG_ID, {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }
      const kind = monaco.languages.CompletionItemKind
      const suggerimenti = [
        ...lexicon.reserved.map((k) => ({ label: k, kind: kind.Keyword, insertText: k, range })),
        ...lexicon.verbs.map((v) => ({ label: v, kind: kind.Function, insertText: v, range })),
        ...lexicon.directions.map((d) => ({ label: d, kind: kind.Constant, insertText: d, range }))
      ]
      return { suggestions: suggerimenti }
    }
  })

  monaco.editor.defineTheme(FAVELLA_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'string', foreground: 'c3e88d' },
      { token: 'string.quote', foreground: 'c3e88d' },
      { token: 'string.escape', foreground: 'f78c6c' },
      { token: 'variable', foreground: 'f78c6c' },
      { token: 'keyword', foreground: '4e9aec', fontStyle: 'bold' },
      { token: 'type', foreground: 'c792ea' },
      { token: 'constant', foreground: 'ffcb6b' },
      { token: 'number', foreground: 'ffcb6b' },
      { token: 'identifier', foreground: 'e1e1e6' },
      { token: 'delimiter', foreground: '89ddff' }
    ],
    colors: {
      'editor.background': '#1a1a1e',
      'editor.foreground': '#e1e1e6',
      'editorLineNumber.foreground': '#4b4b55',
      'editorLineNumber.activeForeground': '#9ca3af',
      'editor.selectionBackground': '#2d4a6b',
      'editor.lineHighlightBackground': '#24242b',
      'editorCursor.foreground': '#4e9aec',
      'editorWidget.background': '#24242b',
      'editorWidget.border': '#34343d'
    }
  })
}
