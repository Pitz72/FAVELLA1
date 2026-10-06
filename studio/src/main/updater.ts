import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { createWriteStream, chmodSync, existsSync, renameSync, unlinkSync } from 'fs'
import { createHash } from 'crypto'
import { dirname, join, basename } from 'path'
import { spawn } from 'child_process'
import { Readable, Transform } from 'stream'
import { pipeline } from 'stream/promises'
import type { UpdaterStatus } from '../shared/protocol'
import { leggiImpostazioni, scriviImpostazioni } from './impostazioni'

// Aggiornamento di Favella Studio dalle Release di GitHub («studio-v<versione>»).
//
// Regole (Studio 1.2):
//  - Studio non si collega a internet da solo finché chi lo usa non lo permette:
//    la prima volta il renderer chiede, e la risposta resta in impostazioni.json.
//    «Controlla aggiornamenti…» dal menu funziona sempre (è una richiesta esplicita).
//  - Il file scaricato si installa solo se la sua impronta SHA-256 coincide con quella
//    che GitHub pubblica per l'allegato della Release (campo `digest`).
//  - L'installazione parte solo DOPO la guardia «modifiche non salvate» del renderer:
//    il renderer chiama `updater:install` quando ha già salvato o scartato.
//  - Windows: si avvia l'installer NSIS e Studio si chiude. Linux: l'AppImage nuova
//    prende il posto di quella in uso (process.env.APPIMAGE) e si riapre. Altrove (o se
//    non si può scrivere accanto all'AppImage) si apre la pagina della Release.

const RELEASES_API = 'https://api.github.com/repos/Pitz72/FAVELLA1/releases?per_page=100'
const RITARDO_CONTROLLO_MS = 4000

interface AssetGitHub {
  name: string
  browser_download_url: string
  size: number
  digest?: string | null
}

interface ReleaseGitHub {
  tag_name: string
  body: string | null
  html_url: string
  draft: boolean
  prerelease: boolean
  assets: AssetGitHub[]
}

interface Bersaglio {
  version: string
  releaseNotes: string
  releaseUrl: string
  asset?: AssetGitHub
  sha256?: string
}

let finestra: (() => BrowserWindow | null) | null = null
let chiudiApp: (() => void) | null = null
let stato: UpdaterStatus = { type: 'idle' }
let bersaglio: Bersaglio | null = null
let scaricato: string | null = null
let scaricando = false

function versione(v: string): [number, number, number] {
  const p = v
    .trim()
    .replace(/^studio-v/i, '')
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((n) => parseInt(n, 10) || 0)
  return [p[0] || 0, p[1] || 0, p[2] || 0]
}

export function confrontaVersioni(a: string, b: string): number {
  const [a1, a2, a3] = versione(a)
  const [b1, b2, b3] = versione(b)
  return a1 !== b1 ? a1 - b1 : a2 !== b2 ? a2 - b2 : a3 - b3
}

function emetti(s: UpdaterStatus): void {
  stato = s
  const w = finestra?.()
  if (w && !w.isDestroyed()) w.webContents.send('updater:status', s)
}

/** L'allegato giusto per questo sistema, e se lo si può installare da qui. */
function allegatoPerQuestoSistema(assets: AssetGitHub[]): { asset?: AssetGitHub; installabile: boolean } {
  if (process.platform === 'win32') {
    const asset = assets.find((a) => /setup.*\.exe$/i.test(a.name)) ?? assets.find((a) => /\.exe$/i.test(a.name))
    return { asset, installabile: !!asset }
  }
  if (process.platform === 'linux') {
    const asset = assets.find((a) => /\.appimage$/i.test(a.name))
    // Si aggiorna da sé solo un'AppImage avviata come tale (APPIMAGE = il suo percorso).
    return { asset, installabile: !!asset && !!process.env.APPIMAGE }
  }
  return { asset: undefined, installabile: false }
}

function sha256DaDigest(digest?: string | null): string | undefined {
  const m = /^sha256:([0-9a-f]{64})$/i.exec(digest ?? '')
  return m ? m[1].toLowerCase() : undefined
}

export async function controllaAggiornamenti(manuale = false): Promise<void> {
  if (scaricando) return
  emetti({ type: 'checking', manual: manuale })
  try {
    const controllo = new AbortController()
    const timer = setTimeout(() => controllo.abort(), 12000)
    let risposta: Response
    try {
      risposta = await fetch(RELEASES_API, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'FavellaStudio' },
        signal: controllo.signal
      })
    } finally {
      clearTimeout(timer)
    }
    if (!risposta.ok) throw new Error(`GitHub ha risposto ${risposta.status}.`)
    const release = ((await risposta.json()) as ReleaseGitHub[]).filter(
      (r) => /^studio-v\d/i.test(r.tag_name ?? '') && !r.draft && !r.prerelease
    )
    const attuale = app.getVersion()
    if (release.length === 0) {
      emetti({ type: 'not-available', manual: manuale, currentVersion: attuale })
      return
    }
    release.sort((a, b) => confrontaVersioni(b.tag_name, a.tag_name))
    const ultima = release[0]
    const nuova = ultima.tag_name.replace(/^studio-v/i, '')
    if (confrontaVersioni(nuova, attuale) <= 0) {
      emetti({ type: 'not-available', manual: manuale, currentVersion: attuale })
      return
    }
    const { asset, installabile } = allegatoPerQuestoSistema(ultima.assets ?? [])
    const sha256 = sha256DaDigest(asset?.digest)
    bersaglio = { version: nuova, releaseNotes: ultima.body ?? '', releaseUrl: ultima.html_url, asset, sha256 }
    emetti({
      type: 'available',
      manual: manuale,
      currentVersion: attuale,
      version: nuova,
      releaseNotes: ultima.body ?? '',
      releaseUrl: ultima.html_url,
      assetName: asset?.name,
      assetSize: asset?.size,
      // Senza impronta pubblicata non si installa niente da qui: si apre la pagina.
      canAutoInstall: installabile && !!sha256
    })
  } catch (err) {
    const messaggio =
      err instanceof Error && err.name === 'AbortError'
        ? 'GitHub non ha risposto in tempo.'
        : err instanceof Error
          ? err.message
          : String(err)
    // Un controllo automatico fallito (rete assente) non disturba: si torna a riposo.
    if (manuale) emetti({ type: 'error', message: messaggio, manual: true })
    else emetti({ type: 'idle' })
  }
}

/** Dove scaricare: accanto all'AppImage (per poterla sostituire) o nella cartella temporanea. */
function percorsoDownload(asset: AssetGitHub): string {
  if (process.platform === 'linux' && process.env.APPIMAGE) {
    return join(dirname(process.env.APPIMAGE), `.${basename(asset.name)}.scaricamento`)
  }
  return join(app.getPath('temp'), basename(asset.name))
}

function togli(percorso: string): void {
  try {
    if (existsSync(percorso)) unlinkSync(percorso)
  } catch {
    /* in uso o già tolto */
  }
}

export async function scaricaAggiornamento(): Promise<void> {
  const b = bersaglio
  if (!b) return
  if (!b.asset || !b.sha256) {
    await shell.openExternal(b.releaseUrl)
    return
  }
  if (scaricando) return
  scaricando = true
  const asset = b.asset
  const destinazione = percorsoDownload(asset)
  togli(destinazione)
  try {
    const risposta = await fetch(asset.browser_download_url, {
      headers: { 'User-Agent': 'FavellaStudio' },
      redirect: 'follow'
    })
    if (!risposta.ok || !risposta.body) throw new Error(`Scaricamento non riuscito (${risposta.status}).`)
    const totale = parseInt(risposta.headers.get('content-length') ?? '', 10) || asset.size || 0
    const hash = createHash('sha256')
    let ricevuti = 0
    let ultimoAvviso = 0
    const contatore = new Transform({
      transform(pezzo: Buffer, _enc, fatto): void {
        hash.update(pezzo)
        ricevuti += pezzo.length
        const ora = Date.now()
        if (ora - ultimoAvviso > 200 || ricevuti === totale) {
          ultimoAvviso = ora
          emetti({
            type: 'downloading',
            version: b.version,
            percent: totale > 0 ? Math.min(100, Math.round((ricevuti / totale) * 100)) : 0,
            transferred: ricevuti,
            total: totale
          })
        }
        fatto(null, pezzo)
      }
    })
    await pipeline(
      Readable.fromWeb(risposta.body as unknown as import('stream/web').ReadableStream),
      contatore,
      createWriteStream(destinazione)
    )
    const impronta = hash.digest('hex')
    if (impronta !== b.sha256) {
      togli(destinazione)
      throw new Error(
        'Il file scaricato non corrisponde a quello pubblicato (impronta SHA-256 diversa): non lo installo. Riprova più tardi.'
      )
    }
    if (process.platform !== 'win32') chmodSync(destinazione, 0o755)
    scaricato = destinazione
    emetti({ type: 'ready', version: b.version, installerPath: destinazione, canAutoInstall: true })
  } catch (err) {
    togli(destinazione)
    emetti({ type: 'error', message: err instanceof Error ? err.message : String(err), manual: true })
  } finally {
    scaricando = false
  }
}

/** Avvia l'installazione e chiude Studio. Il renderer l'ha chiamata DOPO aver salvato. */
export function installaAggiornamento(): { ok: boolean; message?: string } {
  const file = scaricato
  if (!file || !existsSync(file)) {
    if (bersaglio?.releaseUrl) void shell.openExternal(bersaglio.releaseUrl)
    return { ok: false, message: 'Il file dell’aggiornamento non c’è più: ho aperto la pagina della versione nuova.' }
  }
  try {
    if (process.platform === 'win32') {
      spawn(file, [], { detached: true, stdio: 'ignore' }).unref()
    } else if (process.platform === 'linux' && process.env.APPIMAGE) {
      // rename sostituisce il file anche se l'AppImage in uso è ancora aperta.
      renameSync(file, process.env.APPIMAGE)
      spawn(process.env.APPIMAGE, [], { detached: true, stdio: 'ignore' }).unref()
    } else {
      if (bersaglio?.releaseUrl) void shell.openExternal(bersaglio.releaseUrl)
      return { ok: false, message: 'Su questo sistema l’aggiornamento si installa a mano: ho aperto la pagina.' }
    }
  } catch (err) {
    return { ok: false, message: 'Non riesco ad avviare l’aggiornamento: ' + (err instanceof Error ? err.message : String(err)) }
  }
  chiudiApp?.()
  return { ok: true }
}

export function avviaAggiornamenti(getWindow: () => BrowserWindow | null, chiudi: () => void): void {
  finestra = getWindow
  chiudiApp = chiudi

  ipcMain.handle('updater:check', (_e, manuale?: boolean) => controllaAggiornamenti(Boolean(manuale)))
  ipcMain.handle('updater:download', () => scaricaAggiornamento())
  ipcMain.handle('updater:install', () => installaAggiornamento())
  ipcMain.handle('updater:getStatus', () => stato)
  ipcMain.handle('updater:getAuto', () => leggiImpostazioni().aggiornamentiAutomatici)
  ipcMain.handle('updater:setAuto', (_e, attivi: boolean) => {
    scriviImpostazioni({ aggiornamentiAutomatici: !!attivi })
    if (attivi) void controllaAggiornamenti(false)
  })

  // Controllo all'avvio solo se chi usa Studio l'ha permesso.
  if (app.isPackaged && leggiImpostazioni().aggiornamentiAutomatici === true) {
    setTimeout(() => void controllaAggiornamenti(false), RITARDO_CONTROLLO_MS)
  }
}
