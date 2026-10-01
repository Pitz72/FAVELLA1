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
      // Palette di marca (la stessa del manuale): ciano per le parole del linguaggio,
      // smeraldo per i testi, ambra per numeri e punti, fiamma per le [interpolazioni].
      { token: 'comment', foreground: '6f8aa3', fontStyle: 'italic' },
      { token: 'string', foreground: '34d399' },
      { token: 'string.quote', foreground: '34d399' },
      { token: 'string.escape', foreground: 'fb923c' },
      { token: 'variable', foreground: 'fb923c' },
      { token: 'keyword', foreground: '5cf3ff', fontStyle: 'bold' },
      { token: 'type', foreground: 'a78bfa' },
      { token: 'constant', foreground: 'f59e0b' },
      { token: 'number', foreground: 'f59e0b' },
      { token: 'identifier', foreground: 'e8f0f8' },
      { token: 'delimiter', foreground: 'f59e0b', fontStyle: 'bold' }
    ],
    colors: {
      'editor.background': '#060c17',
      'editor.foreground': '#e8f0f8',
      'editorLineNumber.foreground': '#3d5873',
      'editorLineNumber.activeForeground': '#93a9bf',
      'editor.selectionBackground': '#16466a',
      'editor.lineHighlightBackground': '#0a1422',
      'editorCursor.foreground': '#22d3ee',
      'editorWidget.background': '#0f1e33',
      'editorWidget.border': '#1b3149',
      'editorIndentGuide.background1': '#13263c',
      'scrollbarSlider.background': '#1b314966'
    }
  })
}
