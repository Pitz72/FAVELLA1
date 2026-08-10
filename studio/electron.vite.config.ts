import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// electron-vite costruisce tre target: main (CJS), preload (CJS) e renderer
// (web, con HMR via Vite). externalizeDepsPlugin tiene fuori dal bundle i
// moduli Node nativi usati dal main (child_process, readline, path, ...).
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
