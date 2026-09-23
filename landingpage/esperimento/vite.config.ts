import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
      },
    },
  ],
  // Solo in sviluppo: servi la public del sito (font in /fonts, motore in
  // /favella-engine) così l'app separata gira identica al deploy. In build
  // nessuna public: non si copia il sito dentro dist/esperimento.
  publicDir: command === 'serve' ? '../public' : false,
  build: {
    outDir: '../dist/esperimento',
    emptyOutDir: true, // svuota SOLO dist/esperimento, non tutta la dist
  },
}))
