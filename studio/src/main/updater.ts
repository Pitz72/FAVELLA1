import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { createWriteStream, chmodSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'
import type { UpdaterStatus } from '../shared/protocol'

const RELEASES_API = 'https://api.github.com/repos/Pitz72/FAVELLA1/releases?per_page=20'
const STARTUP_CHECK_DELAY_MS = 4000

interface GitHubAsset {
  name: string
  browser_download_url: string
  size: number
}

interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  html_url: string
  draft: boolean
  assets: GitHubAsset[]
}

interface TargetReleaseInfo {
  version: string
  releaseNotes: string
  releaseUrl: string
  asset?: GitHubAsset
}

let windowGetter: (() => BrowserWindow | null) | null = null
let currentStatus: UpdaterStatus = { type: 'idle' }
let targetRelease: TargetReleaseInfo | null = null
let downloadedInstallerPath: string | null = null
let isDownloading = false

function parseSemver(v: string): [number, number, number] {
  const parts = v
    .trim()
    .replace(/^studio-v/i, '')
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((n) => parseInt(n, 10) || 0)
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
}

function compareSemver(a: string, b: string): number {
  const [a1, a2, a3] = parseSemver(a)
  const [b1, b2, b3] = parseSemver(b)
  if (a1 !== b1) return a1 - b1
  if (a2 !== b2) return a2 - b2
  return a3 - b3
}

function emit(status: UpdaterStatus): void {
  currentStatus = status
  const win = windowGetter?.()
  if (win && !win.isDestroyed()) {
    win.webContents.send('updater:status', status)
  }
}

function trovaAssetPerPiattaforma(assets: GitHubAsset[]): GitHubAsset | undefined {
  if (process.platform === 'win32') {
    return assets.find((a) => a.name.toLowerCase().endsWith('.exe'))
  }
  if (process.platform === 'linux') {
    return assets.find((a) => a.name.toLowerCase().endsWith('.appimage'))
  }
  return undefined
}

export async function checkForUpdates(manual = false): Promise<void> {
  if (isDownloading) return

  emit({ type: 'checking', manual })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const response = await fetch(RELEASES_API, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'FavellaStudio-Updater'
      },
      signal: controller.signal
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`GitHub API ha risposto con codice ${response.status}`)
    }

    const releases = (await response.json()) as GitHubRelease[]
    const studioReleases = releases.filter(
      (r) => r.tag_name && r.tag_name.toLowerCase().startsWith('studio-v') && !r.draft
    )

    if (studioReleases.length === 0) {
      emit({ type: 'not-available', manual, currentVersion: app.getVersion() })
      return
    }

    // Ordina per versione semver decrescente
    studioReleases.sort((a, b) => compareSemver(b.tag_name, a.tag_name))
    const newest = studioReleases[0]
    const remoteVersion = newest.tag_name.replace(/^studio-v/i, '')
    const currentVersion = app.getVersion()

    if (compareSemver(remoteVersion, currentVersion) <= 0) {
      emit({ type: 'not-available', manual, currentVersion })
      return
    }

    const asset = trovaAssetPerPiattaforma(newest.assets || [])
    const canAutoInstall = Boolean(asset && (process.platform === 'win32' || process.platform === 'linux'))

    targetRelease = {
      version: remoteVersion,
      releaseNotes: newest.body || '',
      releaseUrl: newest.html_url,
      asset
    }

    emit({
      type: 'available',
      currentVersion,
      version: remoteVersion,
      releaseNotes: newest.body || '',
      releaseUrl: newest.html_url,
      assetName: asset?.name,
      assetSize: asset?.size,
      canAutoInstall
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    emit({ type: 'error', message, manual })
  }
}

export async function downloadUpdate(): Promise<void> {
  if (!targetRelease || !targetRelease.asset) {
    if (targetRelease?.releaseUrl) {
      await shell.openExternal(targetRelease.releaseUrl)
    }
    return
  }

  if (isDownloading) return
  isDownloading = true

  const asset = targetRelease.asset
  const version = targetRelease.version
  const tempPath = join(app.getPath('temp'), asset.name)

  try {
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath)
      } catch {
        /* se in uso, prosegue */
      }
    }

    const response = await fetch(asset.browser_download_url, {
      headers: {
        'User-Agent': 'FavellaStudio-Updater'
      },
      redirect: 'follow'
    })

    if (!response.ok || !response.body) {
      throw new Error(`Impossibile scaricare l'aggiornamento: status ${response.status}`)
    }

    const total = parseInt(response.headers.get('content-length') || String(asset.size) || '0', 10)
    let transferred = 0
    let lastEmitTime = 0

    const fileStream = createWriteStream(tempPath)
    const reader = response.body.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fileStream.write(value)
      transferred += value.length

      const now = Date.now()
      if (now - lastEmitTime > 250 || transferred === total) {
        lastEmitTime = now
        const percent = total > 0 ? Math.round((transferred / total) * 100) : 0
        emit({
          type: 'downloading',
          version,
          percent,
          transferred,
          total
        })
      }
    }

    await new Promise<void>((resolve, reject) => {
      fileStream.end(() => resolve())
      fileStream.on('error', reject)
    })

    downloadedInstallerPath = tempPath
    isDownloading = false

    emit({
      type: 'ready',
      version,
      installerPath: tempPath,
      canAutoInstall: true
    })
  } catch (err) {
    isDownloading = false
    const message = err instanceof Error ? err.message : String(err)
    emit({ type: 'error', message, manual: true })
  }
}

export function installUpdate(): void {
  if (!downloadedInstallerPath || !existsSync(downloadedInstallerPath)) {
    if (targetRelease?.releaseUrl) {
      void shell.openExternal(targetRelease.releaseUrl)
    }
    return
  }

  const installerPath = downloadedInstallerPath

  if (process.platform === 'win32') {
    spawn(installerPath, [], { detached: true, stdio: 'ignore' }).unref()
    app.quit()
    return
  }

  if (process.platform === 'linux') {
    try {
      chmodSync(installerPath, 0o755)
    } catch {
      /* se non riesce a cambiare permessi, avvia comunque */
    }
    spawn(installerPath, [], { detached: true, stdio: 'ignore' }).unref()
    app.quit()
    return
  }

  if (targetRelease?.releaseUrl) {
    void shell.openExternal(targetRelease.releaseUrl)
  }
}

export function initUpdater(getWindow: () => BrowserWindow | null): void {
  windowGetter = getWindow

  ipcMain.handle('updater:check', (_e, manual?: boolean) => {
    return checkForUpdates(Boolean(manual))
  })

  ipcMain.handle('updater:download', () => {
    return downloadUpdate()
  })

  ipcMain.handle('updater:install', () => {
    installUpdate()
  })

  ipcMain.handle('updater:getStatus', () => {
    return currentStatus
  })

  // Controllo automatico in background all'avvio dopo breve attesa
  setTimeout(() => {
    void checkForUpdates(false)
  }, STARTUP_CHECK_DELAY_MS)
}
