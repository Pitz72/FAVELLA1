// Registrazione della lingua `favella` in Monaco: tokenizer Monarch alimentato
// dal lessico REALE del motore (engine.lexicon), così l'highlighting resta in
// lockstep col linguaggio. Commenti `#`, stringhe `"…"` con interpolazione [var].
import type { Monaco } from '@monaco-editor/react'
import type { EngineLexicon } from '../../../shared/protocol'

export const FAVELLA_LANG_ID = 'favella'
// [Studio 1.2] I temi sono quattro (vedi definisciTemi e aspetto.ts).
export const FAVELLA_THEME = 'favella-notte'

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
}

let temiDefiniti = false

type Tinte = {
  base: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'
  sfondo: string
  testo: string
  commento: string
  stringa: string
  parola: string
  verbo: string
  costante: string
  variabile: string
  numeriRiga: string
  numeriRigaAttivo: string
  selezione: string
  rigaAttiva: string
  cursore: string
  widget: string
  bordo: string
}

function tema(t: Tinte): Parameters<Monaco['editor']['defineTheme']>[1] {
  return {
    base: t.base,
    inherit: true,
    rules: [
      // Palette di marca (la stessa del manuale): parole del linguaggio, testi, numeri e
      // punti, interpolazioni. I commenti restano leggibili (contrasto AA anche loro).
      { token: 'comment', foreground: t.commento, fontStyle: 'italic' },
      { token: 'string', foreground: t.stringa },
      { token: 'string.quote', foreground: t.stringa },
      { token: 'string.escape', foreground: t.variabile },
      { token: 'variable', foreground: t.variabile },
      { token: 'keyword', foreground: t.parola, fontStyle: 'bold' },
      { token: 'type', foreground: t.verbo },
      { token: 'constant', foreground: t.costante },
      { token: 'number', foreground: t.costante },
      { token: 'identifier', foreground: t.testo },
      { token: 'delimiter', foreground: t.costante, fontStyle: 'bold' }
    ],
    colors: {
      'editor.background': '#' + t.sfondo,
      'editor.foreground': '#' + t.testo,
      'editorLineNumber.foreground': '#' + t.numeriRiga,
      'editorLineNumber.activeForeground': '#' + t.numeriRigaAttivo,
      'editor.selectionBackground': '#' + t.selezione,
      'editor.lineHighlightBackground': '#' + t.rigaAttiva,
      'editor.lineHighlightBorder': '#' + t.rigaAttiva,
      'editorCursor.foreground': '#' + t.cursore,
      'editorWidget.background': '#' + t.widget,
      'editorWidget.border': '#' + t.bordo,
      'editorSuggestWidget.background': '#' + t.widget,
      'editorSuggestWidget.border': '#' + t.bordo,
      'editorHoverWidget.background': '#' + t.widget,
      'editorHoverWidget.border': '#' + t.bordo,
      'editorIndentGuide.background1': '#' + t.rigaAttiva,
      'scrollbarSlider.background': '#' + t.bordo + '99',
      'scrollbarSlider.hoverBackground': '#' + t.bordo,
      'focusBorder': '#' + t.cursore
    }
  }
}

/** I quattro temi dell'editor: notte e carta, ognuno anche ad alto contrasto. */
export function definisciTemi(monaco: Monaco): void {
  if (temiDefiniti) return
  temiDefiniti = true
  monaco.editor.defineTheme('favella-notte', tema({
    base: 'vs-dark', sfondo: '07101d', testo: 'e8f0f8', commento: '8ea7be', stringa: '34d399', parola: '5cf3ff',
    verbo: 'b9a4ff', costante: 'f5b13d', variabile: 'fb923c', numeriRiga: '7590ab', numeriRigaAttivo: 'c4d4e3',
    selezione: '1b4a6b', rigaAttiva: '0d1a2c', cursore: '22d3ee', widget: '0f2032', bordo: '25455f'
  }))
  monaco.editor.defineTheme('favella-notte-alto', tema({
    base: 'hc-black', sfondo: '000000', testo: 'ffffff', commento: 'c9d6e2', stringa: '6ff5bd', parola: '8ffbff',
    verbo: 'd3c4ff', costante: 'ffd27a', variabile: 'ffb070', numeriRiga: 'a9bccd', numeriRigaAttivo: 'ffffff',
    selezione: '0b5d80', rigaAttiva: '101820', cursore: '8ffbff', widget: '0a0f14', bordo: 'a9bccd'
  }))
  monaco.editor.defineTheme('favella-carta', tema({
    base: 'vs', sfondo: 'fcfaf5', testo: '1c2632', commento: '5b6875', stringa: '0d6b4c', parola: '0b6680',
    verbo: '6a3fb0', costante: '9a5300', variabile: 'b4470b', numeriRiga: '5f6b77', numeriRigaAttivo: '1c2632',
    selezione: 'c9e5ee', rigaAttiva: 'f2ede2', cursore: '0b6680', widget: 'ffffff', bordo: 'c9c2b3'
  }))
  monaco.editor.defineTheme('favella-carta-alto', tema({
    base: 'hc-light', sfondo: 'ffffff', testo: '000000', commento: '2e3a46', stringa: '004d35', parola: '00475a',
    verbo: '4a1f8f', costante: '6b3500', variabile: '8a3000', numeriRiga: '333d47', numeriRigaAttivo: '000000',
    selezione: 'a9d6e5', rigaAttiva: 'f0f0f0', cursore: '00475a', widget: 'ffffff', bordo: '333d47'
  }))
}
