import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// `base` = sotto-percorso di deploy. Il sito vive ora alla RADICE del proprio
// dominio (favella.eu), quindi gli asset sono referenziati come /...
// (Storico: prima stava su .../favella1 con base '/favella1/'.)
export default defineConfig({
  base: '/',
  plugins: [react()],
})