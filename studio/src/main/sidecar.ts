import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { createInterface, Interface } from 'readline'
import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { app } from 'electron'
import type {
  RpcResponse,
  EngineEvent,
  SidecarStatus
} from '../shared/protocol'

interface Pending {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  timer: NodeJS.Timeout
}

// Timeout per-metodo (ms): compile/sessione possono essere lente; ping rapido.
const TIMEOUTS: Record<string, number> = {
  ping: 5000,
  'engine.version': 5000,
  'engine.lexicon': 5000,
  compile: 30000,
  'session.start': 30000,
  'session.send': 10000,
  'session.load': 30000,
  'session.save': 10000
}
const DEFAULT_TIMEOUT = 15000
const MAX_RESTART_BACKOFF = 10000

/**
 * Client del sidecar Python: lo lancia, gli parla in NDJSON, ne sorveglia il
 * ciclo di vita e lo riavvia con backoff in caso di crash. Espone request()
 * (promessa per id) ed emette EngineEvent verso il renderer.
 */
export class Sidecar {
  private child: ChildProcessWithoutNullStreams | null = null
  private rl: Interface | null = null
  private pending = new Map<number, Pending>()
  private nextId = 1
  private restartAttempts = 0
  private stopped = false
  private status: SidecarStatus = 'stopped'
  // Coda di scrittura su stdin: serializza i frame e rispetta la backpressure
  // (attende 'drain' quando il buffer del pipe è pieno), così il framing NDJSON
  // non può mai interlacciarsi o perdere pezzi con payload grossi (export HTML).
  private writeChain: Promise<void> = Promise.resolve()
  // Ultime righe di stderr del processo Python: è lì che finiscono i traceback
  // del motore. Conservate per la diagnostica visibile all'utente.
  private stderrTail: string[] = []

  constructor(private emit: (event: EngineEvent) => void) {}

  /** Risolve eseguibile Python e script in dev, oppure l'exe PyInstaller in prod. */
  private resolveCommand(): { cmd: string; args: string[]; cwd: string } {
    if (app.isPackaged) {
      const engineDir = join(process.resourcesPath, 'engine')
      // Il sidecar congelato (PyInstaller) ha il nome dipendente dall'OS: .exe su
      // Windows, senza estensione su macOS/Linux. Combacia con gli extraResources
      // per-piattaforma in package.json.
      const bin = process.platform === 'win32' ? 'favella_engine.exe' : 'favella_engine'
      return {
        cmd: join(engineDir, bin),
        args: [],
        cwd: engineDir
      }
    }
    // Dev: il repo FAVELLA è la cartella padre di studio/ (app path).
    const repoRoot = resolve(app.getAppPath(), '..')
    const venvPy = process.platform === 'win32'
      ? join(repoRoot, '.venv', 'Scripts', 'python.exe')
      : join(repoRoot, '.venv', 'bin', 'python')
    const cmd = existsSync(venvPy) ? venvPy : (process.platform === 'win32' ? 'python' : 'python3')
    return { cmd, args: [join(repoRoot, 'favella_server.py')], cwd: repoRoot }
  }

  start(): void {
    this.stopped = false
    this.setStatus('starting')
    const { cmd, args, cwd } = this.resolveCommand()

    // App impacchettata con motore mancante (build fatto senza il passo
    // PyInstaller): errore FATALE ed esplicito, niente retry all'infinito.
    if (app.isPackaged && !existsSync(cmd)) {
      this.stopped = true
      this.setStatus(
        'crashed',
        'Installazione danneggiata: il motore (favella_engine) non è presente. Reinstalla Favella Studio.'
      )
      return
    }

    try {
      this.child = spawn(cmd, args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
        env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
      }) as ChildProcessWithoutNullStreams
    } catch (e) {
      this.setStatus('crashed', String(e))
      this.scheduleRestart()
      return
    }

    this.rl = createInterface({ input: this.child.stdout })
    this.rl.on('line', (line) => this.handleLine(line))

    this.child.stderr.on('data', (d) => {
      // I traceback del motore finiscono qui: log diagnostico, mai sul protocollo.
      const testo = d.toString().trimEnd()
      console.error('[sidecar stderr]', testo)
      for (const riga of testo.split('\n')) {
        this.stderrTail.push(riga)
      }
      if (this.stderrTail.length > 120) {
        this.stderrTail.splice(0, this.stderrTail.length - 120)
      }
    })

    this.child.on('exit', (code, signal) => {
      this.failAllPending(new Error(`sidecar terminato (code=${code}, signal=${signal})`))
      if (!this.stopped) {
        // Nel dettaglio passa anche l'ultima riga utile di stderr: di solito è
        // la riga finale del traceback Python (l'eccezione), la più parlante.
        const ultima = [...this.stderrTail].reverse().find((r) => r.trim() !== '')
        const dettaglio = `code=${code} signal=${signal}` + (ultima ? ` — ${ultima.trim()}` : '')
        this.setStatus('crashed', dettaglio)
        this.scheduleRestart()
      }
    })

    this.child.on('error', (err) => {
      this.failAllPending(err)
      if (!this.stopped) {
        this.setStatus('crashed', err.message)
        this.scheduleRestart()
      }
    })
  }

  private handleLine(line: string): void {
    line = line.trim()
    if (!line) return
    let msg: RpcResponse & { method?: string; params?: unknown }
    try {
      msg = JSON.parse(line)
    } catch {
      console.error('[sidecar] riga non-JSON ignorata:', line)
      return
    }

    // Notifica (senza id): server/ready o eventi del gioco.
    if (msg.id === undefined || msg.id === null) {
      if (msg.method === 'server/ready') {
        this.restartAttempts = 0
        this.setStatus('ready')
        this.emit({ kind: 'ready', data: msg.params as never })
      } else if (msg.method) {
        this.emit({ kind: 'notification', method: msg.method, params: msg.params })
      }
      return
    }

    const pend = this.pending.get(msg.id as number)
    if (!pend) return
    clearTimeout(pend.timer)
    this.pending.delete(msg.id as number)
    if (msg.error) {
      const err = new Error(msg.error.message)
      ;(err as Error & { code?: number; data?: unknown }).code = msg.error.code
      ;(err as Error & { code?: number; data?: unknown }).data = msg.error.data
      pend.reject(err)
    } else {
      pend.resolve(msg.result)
    }
  }

  /** Invia una richiesta RPC e restituisce una promessa sul risultato. */
  request<T = unknown>(method: string, params?: unknown): Promise<T> {
    return new Promise<T>((res, rej) => {
      if (!this.child || this.child.exitCode !== null) {
        rej(new Error('Sidecar non attivo'))
        return
      }
      const id = this.nextId++
      const timeoutMs = TIMEOUTS[method] ?? DEFAULT_TIMEOUT
      const timer = setTimeout(() => {
        this.pending.delete(id)
        rej(new Error(`Timeout RPC su '${method}' (${timeoutMs}ms)`))
      }, timeoutMs)
      this.pending.set(id, { resolve: res as (v: unknown) => void, reject: rej, timer })
      const frame = JSON.stringify({ jsonrpc: '2.0', id, method, params: params ?? {} })
      this.enqueueWrite(frame + '\n')
    })
  }

  /** Accoda una scrittura su stdin rispettando la backpressure del pipe. */
  private enqueueWrite(data: string): void {
    this.writeChain = this.writeChain.then(
      () =>
        new Promise<void>((resolve) => {
          const stdin = this.child?.stdin
          if (!stdin || stdin.destroyed) {
            resolve() // processo morto: la pending fallirà via failAllPending
            return
          }
          const ok = stdin.write(data)
          if (ok) resolve()
          else stdin.once('drain', resolve)
        })
    )
  }

  private failAllPending(err: Error): void {
    for (const [, pend] of this.pending) {
      clearTimeout(pend.timer)
      pend.reject(err)
    }
    this.pending.clear()
  }

  private scheduleRestart(): void {
    if (this.stopped) return
    this.restartAttempts++
    const backoff = Math.min(500 * 2 ** (this.restartAttempts - 1), MAX_RESTART_BACKOFF)
    this.setStatus('restarting', `tentativo ${this.restartAttempts} fra ${backoff}ms`)
    setTimeout(() => {
      if (!this.stopped) this.start()
    }, backoff)
  }

  private setStatus(status: SidecarStatus, detail?: string): void {
    this.status = status
    this.emit({ kind: 'status', status, detail })
  }

  getStatus(): SidecarStatus {
    return this.status
  }

  /** Ultime righe di stderr del motore (traceback): per la diagnostica utente. */
  getLastStderr(): string {
    return this.stderrTail.join('\n')
  }

  /**
   * Arresto graduale con escalation: chiude stdin (il server Python esce da solo
   * a EOF), attende fino a 2s, poi termina forzatamente. Su Windows usa
   * taskkill /T per abbattere anche eventuali figli del bundle PyInstaller.
   * Garantisce che non restino processi Python orfani alla chiusura dell'app.
   */
  stop(): Promise<void> {
    this.stopped = true
    this.failAllPending(new Error('sidecar in arresto'))
    this.rl?.close()
    const child = this.child
    this.child = null
    this.setStatus('stopped')
    if (!child || child.exitCode !== null) return Promise.resolve()

    return new Promise<void>((resolve) => {
      let risolto = false
      const fine = (): void => {
        if (!risolto) {
          risolto = true
          clearTimeout(timer)
          resolve()
        }
      }
      child.once('exit', fine)
      const timer = setTimeout(() => {
        // Non è uscito da solo: terminazione forzata (con l'albero su Windows).
        try {
          if (process.platform === 'win32' && child.pid) {
            spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true })
          } else {
            child.kill('SIGKILL')
          }
        } catch {
          /* già morto */
        }
        // Ulteriore rete di sicurezza: non bloccare la chiusura dell'app oltre 1s.
        setTimeout(fine, 1000)
      }, 2000)
      try {
        child.stdin.end() // EOF: il loop del server Python termina pulito
      } catch {
        child.kill()
      }
    })
  }
}
