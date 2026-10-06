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
    compile: (path, source, sources) => rpc('compile', { path, source, sources }),
    startGame: (path, source, sources) => rpc('session.start', { path, source, sources }),
    sendCommand: (command) => rpc('session.send', { command }),
    resetGame: () => rpc('session.reset', {}),
    worldGraph: (path, source, sources) => rpc('world.graph', path ? { path, source, sources } : {}),
    worldSnapshot: () => rpc('world.snapshot', {}),
    sessionHistory: () => rpc('session.history', {}),
    worldOutline: (path, source, sources) => rpc('world.outline', path ? { path, source, sources } : {}),
    worldRules: (path, source, sources) => rpc('world.rules', path ? { path, source, sources } : {}),
    worldVariables: (path, source, sources) => rpc('world.variables', path ? { path, source, sources } : {}),
    worldWords: (path, source, sources) => rpc('world.words', path ? { path, source, sources } : {}),
    worldDialogues: (path, source, sources) => rpc('world.dialogues', path ? { path, source, sources } : {}),
    serializeStatement: (spec) => rpc('outline.serialize', spec),
    reorderSource: (path, source) => rpc('source.reorder', { path, source }),
    reorderStory: (path, source, sources) => rpc('story.reorder', { path, source, sources }),
    renameEntity: (path, source, sources, name, newName) => rpc('entity.rename', { path, source, sources, name, newName }),
    entityReferences: (path, source, sources, name) => rpc('entity.references', { path, source, sources, name }),
    exportGameHtml: (path, source, sources) => rpc('game.exportHtml', { path, source, sources }),
    writeExport: async () => ({ ok: false }),
    gameSave: () => rpc('session.save', {}),
    gameLoad: (save) => rpc('session.load', { save }),
    writeSaveFile: async () => ({ ok: false }),
    readSaveFile: async () => null,
    // La finestra a parte è un'altra scheda: il payload passa da localStorage.
    openGameWindow: async (path, source, sources) => { localStorage.setItem('dev.lancio', JSON.stringify({ path, source, sources })); window.open('/#game', '_blank') },
    gameLaunchPayload: async () => JSON.parse(localStorage.getItem('dev.lancio') || 'null'),
    onGameRelaunch: (cb) => { relaunch.add(cb); return () => relaunch.delete(cb) },
    confirmClose: async () => {},
    onRequestClose: () => () => {},
    notifyGameAdvanced: () => avanzato.forEach((cb) => cb()),
    onGameAdvanced: (cb) => { avanzato.add(cb); return () => avanzato.delete(cb) },
    onEngineEvent: (cb) => { subs.add(cb); return () => subs.delete(cb) },
    openProject: () => post('/open'),
    newProject: () => post('/new'),
    // Nel browser non c'è il dialogo di sistema: «Salva con nome» sceglie da solo «<nome>-copia.fav».
    chooseSavePath: async (nome) => {
      const radice = (await post('/open')).root
      const sep = radice.includes('\\') ? '\\' : '/'
      return radice + sep + nome.replace(/\.fav$/i, '') + '-copia.fav'
    },
    saveProjectAs: (testi) => post('/copyTo', { testi }),
    pathExists: (path) => post('/exists', { path }),
    refreshTree: (root) => post('/tree', { root }),
    readFile: (path) => post('/read', { path }),
    writeFile: (path, content) => post('/write', { path, content }),
    // Aggiornamenti: nel browser non ce ne sono.
    checkForUpdates: async () => {},
    downloadUpdate: async () => {},
    installUpdate: async () => ({ ok: false, message: 'Nel browser non ci sono aggiornamenti.' }),
    getUpdaterStatus: async () => ({ type: 'idle' }),
    onUpdaterStatus: () => () => {},
    getAutoUpdates: async () => false,
    setAutoUpdates: async () => {},
    // «Apri una storia»: nel browser apre la cartella del ponte e il suo file principale.
    openStoryFile: async () => {
      const r = await post('/open')
      const fav = (r.tree || []).find((n) => n.type === 'file' && /\.fav$/i.test(n.name))
      return fav ? { ...r, openPath: fav.path } : null
    },
    // Una partita sola: nel browser le due schede non si parlano.
    claimGame: () => {},
    onGameOwner: () => () => {},
  }
})()
