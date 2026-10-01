// Banco di prova nel browser: ponte HTTP fra il renderer di Favella Studio e il VERO
// motore Python (favella_server.py), senza Electron. Serve solo a sviluppare e
// provare l'interfaccia in un browser. NON fa parte dell'app impacchettata.
//   node dev-web/bridge.mjs [cartella-progetto]
import http from 'node:http'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const qui = dirname(fileURLToPath(import.meta.url))
const repo = resolve(qui, '..', '..')
const progetto = resolve(process.argv[2] ?? join(repo, 'esempi', 'materiale-didattico'))
const PORTA = Number(process.env.BRIDGE_PORT ?? 5301)
const IGNORATE = new Set(['node_modules', '.git', '.venv', '__pycache__', 'out', 'release', 'dist'])

const venvPy = join(repo, '.venv', 'Scripts', 'python.exe')
const cmd = existsSync(venvPy) ? venvPy : 'python'
let child
let stato = 'starting'
let ready = null
let ultimoErr = []
const pending = new Map()
let nextId = 1

function avvia() {
  child = spawn(cmd, [join(repo, 'favella_server.py')], {
    cwd: repo,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
  })
  createInterface({ input: child.stdout }).on('line', (riga) => {
    let m
    try { m = JSON.parse(riga) } catch { return }
    if (m.id == null) {
      if (m.method === 'server/ready') { stato = 'ready'; ready = m.params }
      return
    }
    const p = pending.get(m.id)
    if (!p) return
    pending.delete(m.id)
    if (m.error) p.rej(Object.assign(new Error(m.error.message), { data: m.error.data }))
    else p.res(m.result)
  })
  child.stderr.on('data', (d) => {
    ultimoErr.push(...d.toString().split('\n'))
    ultimoErr = ultimoErr.slice(-100)
    console.error(d.toString())
  })
  child.on('exit', () => { stato = 'crashed' })
}

const rpc = (method, params) => new Promise((res, rej) => {
  const id = nextId++
  pending.set(id, { res, rej })
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params: params ?? {} }) + '\n')
  setTimeout(() => { if (pending.delete(id)) rej(new Error('timeout ' + method)) }, 30000)
})

async function albero(dir) {
  const out = []
  for (const v of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (v.name.startsWith('.') || IGNORATE.has(v.name)) continue
    const p = join(dir, v.name)
    if (v.isDirectory()) out.push({ name: v.name, path: p, type: 'dir', children: await albero(p) })
    else if (v.isFile()) out.push({ name: v.name, path: p, type: 'file' })
  }
  return out.sort((a, b) => (a.type !== b.type ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b.name, 'it')))
}

const dentro = (p) => { const r = resolve(p); return r === progetto || r.startsWith(progetto + sep) }
const corpo = (req) => new Promise((res) => {
  let b = ''
  req.on('data', (c) => (b += c))
  req.on('end', () => res(b ? JSON.parse(b) : {}))
})

avvia()

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x')
  const invia = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj ?? null)) }
  try {
    const b = req.method === 'POST' ? await corpo(req) : {}
    switch (u.pathname) {
      case '/api/status': return invia(200, { stato, ready })
      case '/api/lastError': return invia(200, ultimoErr.join('\n'))
      case '/api/rpc': return invia(200, await rpc(b.method, b.params))
      case '/api/open': return invia(200, { root: progetto, tree: await albero(progetto) })
      case '/api/new': return invia(200, null)
      case '/api/tree': return invia(200, dentro(b.root) ? await albero(b.root) : [])
      case '/api/read':
        if (!dentro(b.path)) throw new Error('fuori dal progetto')
        return invia(200, await readFile(b.path, 'utf-8'))
      case '/api/write':
        if (!dentro(b.path)) throw new Error('fuori dal progetto')
        await writeFile(b.path, b.content, 'utf-8')
        return invia(200, true)
      case '/api/exists': return invia(200, dentro(b.path) && !!(await stat(b.path).catch(() => null)))
      default: return invia(404, { error: 'no' })
    }
  } catch (e) {
    invia(500, { error: String(e.message ?? e), data: e.data })
  }
}).listen(PORTA, () => console.log(`[ponte] motore FAVELLA su :${PORTA}, progetto ${progetto}`))
