// Configurazione di Monaco per un'app desktop OFFLINE: nessuna CDN. Bundliamo
// l'istanza locale di monaco-editor e i suoi web worker via Vite (?worker).
//
// Importiamo SOLO l'API core dell'editor (editor.api), NON il pacchetto completo
// `monaco-editor`: quest'ultimo registra decine di linguaggi (php, sql, ruby…) e
// i worker TS/CSS/HTML/JSON che non ci servono — FAVELLA è l'unico linguaggio e
// lo registriamo a runtime. Così il bundle resta snello.
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { loader } from '@monaco-editor/react'

// FAVELLA non usa i linguaggi TS/JSON/HTML/CSS: basta il worker base dell'editor.
self.MonacoEnvironment = {
  getWorker(): Worker {
    return new EditorWorker()
  }
}

// Forza @monaco-editor/react a usare la nostra copia bundlata (no download CDN).
loader.config({ monaco })

export { monaco }
