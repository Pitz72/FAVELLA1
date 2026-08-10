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
export default defineConfig({
  base: '/esperimento/',
  plugins: [react()],
  build: {
    outDir: '../dist/esperimento',
    emptyOutDir: true, // svuota SOLO dist/esperimento, non tutta la dist
  },
})
