// Fotografa una pagina del sito a fette, per rivederla senza il browser del pannello.
// Strumento di sviluppo (non fa parte del build): fotografa una pagina a fette, per rivederla
// senza aprire il browser. Uso: node scripts/foto-pagine.mjs <url> <prefisso> [larghezza] [altezza-fetta]
// Le immagini vanno in FOTO_DIR (default: ./.foto, ignorata da git).
import puppeteer from 'puppeteer'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , url, prefisso = 'pagina', larg = '1440', fetta = '1000'] = process.argv
const qui = dirname(fileURLToPath(import.meta.url))
const out = process.env.FOTO_DIR || join(qui, '..', '.foto')
mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: Number(larg), height: 900, deviceScaleFactor: 1 })
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('favella-privacy-notice', '1') } catch {}
})
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
await new Promise((r) => setTimeout(r, 1500))
// scorre fino in fondo per far partire le immagini pigre
const altezza = await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto'
  const h = document.documentElement.scrollHeight
  for (let y = 0; y < h; y += 500) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 120))
  }
  window.scrollTo(0, 0)
  return document.documentElement.scrollHeight
})
await new Promise((r) => setTimeout(r, 800))
const n = Math.ceil(altezza / Number(fetta))
console.log('altezza', altezza, 'fette', n)
for (let i = 0; i < n; i++) {
  const y = i * Number(fetta)
  await page.screenshot({
    path: join(out, `${prefisso}-${String(i + 1).padStart(2, '0')}.jpg`),
    type: 'jpeg',
    quality: 72,
    clip: { x: 0, y, width: Number(larg), height: Math.min(Number(fetta), altezza - y) },
    captureBeyondViewport: true,
  })
}
await browser.close()
