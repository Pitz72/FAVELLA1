// window.favella per il browser: stesso contratto di src/preload/index.ts, ma via HTTP
// verso dev-web/bridge.mjs. Solo per lo sviluppo dell'interfaccia.
(() => {
  const post = async (p, body) => {
    const r = await fetch('/api' + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })
    const j = await r.json()
    if (!r.ok) throw Object.assign(new Error(j.error || 'errore'), { data: j.data })
    return j
  }
  const rpc = (method, params) => post('/rpc', { method, params })
  const subs = new Set()
  const emit = (e) => subs.forEach((cb) => cb(e))
  let letto = false
  const poll = setInterval(async () => {
    try {
      const s = await (await fetch('/api/status')).json()
      if (s.stato === 'ready' && !letto) {
        letto = true
        clearInterval(poll)
        emit({ kind: 'status', status: 'ready' })
        emit({ kind: 'ready', data: s.ready ?? { engineLoaded: true } })
      }
    } catch { /* ponte non ancora su */ }
  }, 300)
  const avanzato = new Set()
  const relaunch = new Set()
  window.favella = {
    setZoom: (z) => { document.documentElement.style.zoom = String(z) },
    rpc,
    sidecarStatus: async () => (await (await fetch('/api/status')).json()).stato,
    restartSidecar: async () => {},
    sidecarLastError: async () => (await fetch('/api/lastError')).json(),
    compile: (path, source) => rpc('compile', { path, source }),
    startGame: (path, source) => rpc('session.start', { path, source }),
    sendCommand: (command) => rpc('session.send', { command }),
    resetGame: () => rpc('session.reset', {}),
    worldGraph: (path, source) => rpc('world.graph', path ? { path, source } : {}),
    worldSnapshot: () => rpc('world.snapshot', {}),
    sessionHistory: () => rpc('session.history', {}),
    worldOutline: (path, source) => rpc('world.outline', path ? { path, source } : {}),
    worldRules: (path, source) => rpc('world.rules', path ? { path, source } : {}),
    worldVariables: (path, source) => rpc('world.variables', path ? { path, source } : {}),
    worldWords: (path, source) => rpc('world.words', path ? { path, source } : {}),
    worldDialogues: (path, source) => rpc('world.dialogues', path ? { path, source } : {}),
    serializeStatement: (spec) => rpc('outline.serialize', spec),
    reorderSource: (path, source) => rpc('source.reorder', { path, source }),
    exportGameHtml: (path, source) => rpc('game.exportHtml', { path, source }),
    writeExport: async () => ({ ok: false }),
    gameSave: () => rpc('session.save', {}),
    gameLoad: (save) => rpc('session.load', { save }),
    writeSaveFile: async () => ({ ok: false }),
    readSaveFile: async () => null,
    // La finestra a parte è un'altra scheda: il payload passa da localStorage.
    openGameWindow: async (path, source) => { localStorage.setItem('dev.lancio', JSON.stringify({ path, source })); window.open('/#game', '_blank') },
    gameLaunchPayload: async () => JSON.parse(localStorage.getItem('dev.lancio') || 'null'),
    onGameRelaunch: (cb) => { relaunch.add(cb); return () => relaunch.delete(cb) },
    confirmClose: async () => {},
    onRequestClose: () => () => {},
    notifyGameAdvanced: () => avanzato.forEach((cb) => cb()),
    onGameAdvanced: (cb) => { avanzato.add(cb); return () => avanzato.delete(cb) },
    onEngineEvent: (cb) => { subs.add(cb); return () => subs.delete(cb) },
    openProject: () => post('/open'),
    newProject: () => post('/new'),
    refreshTree: (root) => post('/tree', { root }),
    readFile: (path) => post('/read', { path }),
    writeFile: (path, content) => post('/write', { path, content }),
  }
})()
