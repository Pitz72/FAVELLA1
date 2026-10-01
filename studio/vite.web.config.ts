// Banco di prova nel browser (solo sviluppo): serve il renderer di Favella Studio
// senza Electron, con window.favella simulata da dev-web/shim.js e il vero motore
// Python dietro dev-web/bridge.mjs. Uso: vedi dev-web/LEGGIMI.md
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: resolve('src/renderer'),
  resolve: { alias: { '@': resolve('src/renderer/src') } },
  plugins: [
    react(),
    {
      name: 'shim-favella',
      transformIndexHtml: () => [
        { tag: 'script', children: readFileSync(resolve('dev-web/shim.js'), 'utf-8'), injectTo: 'head-prepend' },
      ],
    },
  ],
  server: { port: 5310, strictPort: true, proxy: { '/api': 'http://localhost:5301' } },
})
