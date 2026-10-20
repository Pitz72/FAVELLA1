import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { execSync } from 'node:child_process'

// Identità della build, come nel gioco (sviluppo/VERSIONI.md del suo
// repository): la versione del gioco da cui è copiato il sorgente
// (versione.json accanto a questo file, copiata dal gioco), il motore da
// ../../strutture.py (quello servito in /favella-engine/), il commit del sito.
const versioni = JSON.parse(fs.readFileSync(new URL('./versione.json', import.meta.url), 'utf8'))
const motore = /VERSIONE_MOTORE\s*=\s*"([^"]+)"/.exec(
  fs.readFileSync(new URL('../../strutture.py', import.meta.url), 'utf8'))?.[1] ?? '?'
const commit = (() => {
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() }
  catch { return 'locale' }
})()
const VERSIONE = {
  gioco: versioni.gioco as string,
  motore,
  formatoSalvataggi: versioni.formatoSalvataggi as number,
  commit,
  data: new Date().toISOString().slice(0, 10),
}

// ====================================================================
//  App SEPARATA «Il Viaggiatore» — esperimento.
// --------------------------------------------------------------------
//  Progetto Vite a sé (proprio entry/build/deps, incl. GSAP), ma OUTPUT
//  dentro la dist del sito principale: landingpage/dist/esperimento/.
//  Così un solo `npm run deploy` (dalla landingpage) carica tutto.
//
//  base '/esperimento/'  → gli asset DI QUESTA app (js/css/img) vivono
//  sotto /esperimento/.  ATTENZIONE: il MOTORE FAVELLA non sta qui: sta
//  in /favella-engine/ (radice del dominio). Il runtime copiato punta a
//  quel percorso ASSOLUTO, NON a BASE_URL (vedi src/lib/favellaRuntime.ts).
// ====================================================================
export default defineConfig(({ command }) => ({
  base: '/esperimento/',
  define: { __VERSIONE__: JSON.stringify(VERSIONE) },
  plugins: [
    react(),
    // Solo in sviluppo: la public del sito viene servita sotto /esperimento/,
    // ma la pagina chiede font e motore alla RADICE (come in produzione).
    // Si riscrivono quelle richieste verso la public servita.
    {
      name: 'radice-del-sito-in-sviluppo',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && /^\/(fonts|favella-engine|favicon)/.test(req.url)) req.url = '/esperimento' + req.url
          next()
        })
        // la voce del doppiaggio (dal Viaggiatore 1.19.0) sta in pubblico/voce/: in sviluppo la si serve da lì
        server.middlewares.use((req, res, next) => {
          const m = req.url ? /^\/esperimento\/voce\/([^?]+)/.exec(req.url) : null
          if (!m) return next()
          const file = new URL(`./pubblico/voce/${decodeURIComponent(m[1])}`, import.meta.url)
          if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next()
          res.setHeader('Content-Type', m[1].endsWith('.json') ? 'application/json' : 'audio/ogg')
          fs.createReadStream(file).pipe(res)
        })
      },
    },
  ],
  // In sviluppo: servi la public del sito (font in /fonts, motore in
  // /favella-engine) così l'app separata gira identica al deploy. In build
  // la sola cartella pubblico/ dell'esperimento (la voce del doppiaggio,
  // copiata dal gioco: pubblico/voce/ → /esperimento/voce/); il sito non si
  // copia dentro dist/esperimento.
  publicDir: command === 'serve' ? '../public' : 'pubblico',
  build: {
    outDir: '../dist/esperimento',
    emptyOutDir: true, // svuota SOLO dist/esperimento, non tutta la dist
  },
}))
