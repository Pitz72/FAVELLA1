import { useStudio } from '../store'
import type { DebugEntry, WorldSnapshot } from '../../../shared/protocol'

interface Change {
  icon: string
  cls: string
  text: string
}

function fmt(v: string | number | null | undefined): string {
  return v === null || v === undefined ? '∅' : String(v)
}

/** Calcola le differenze fra lo snapshot precedente e quello corrente. */
function diff(prev: WorldSnapshot | null, curr: WorldSnapshot): Change[] {
  if (!prev) return []
  const ch: Change[] = []

  if (prev.currentRoom !== curr.currentRoom) {
    ch.push({
      icon: '📍',
      cls: 'move',
      text: `${prev.currentRoomName ?? '—'} → ${curr.currentRoomName ?? '—'}`
    })
  }

  // Inventario: oggetti presi / lasciati
  const prevInv = new Set(prev.inventory.map((i) => i.id))
  const currInv = new Set(curr.inventory.map((i) => i.id))
  for (const i of curr.inventory) if (!prevInv.has(i.id)) ch.push({ icon: '＋', cls: 'add', text: `preso: ${i.name}` })
  for (const i of prev.inventory) if (!currInv.has(i.id)) ch.push({ icon: '－', cls: 'rem', text: `lasciato: ${i.name}` })

  // Variabili (stati/contatori)
  const pv = new Map(prev.variables.map((v) => [v.name, v.value]))
  for (const v of curr.variables) {
    const old = pv.get(v.name)
    if (old !== v.value) ch.push({ icon: '◆', cls: 'var', text: `${v.name}: ${fmt(old)} → ${fmt(v.value)}` })
  }

  // Spostamenti di oggetti (esclusi quelli già coperti dall'inventario)
  const pp = new Map(prev.objects.map((o) => [o.id, o.positionLabel]))
  for (const o of curr.objects) {
    const old = pp.get(o.id)
    if (old !== o.positionLabel && o.positionLabel !== 'Inventario' && old !== 'Inventario') {
      ch.push({ icon: '⇄', cls: 'move', text: `${o.name}: ${old ?? '—'} → ${o.positionLabel ?? '—'}` })
    }
  }

  // Proprietà degli oggetti (es. porta chiusa → aperta)
  const ppr = new Map(prev.objects.map((o) => [o.id, o.properties.join(', ')]))
  for (const o of curr.objects) {
    const old = ppr.get(o.id)
    const now = o.properties.join(', ')
    if (old !== undefined && old !== now) {
      ch.push({ icon: '⚙', cls: 'prop', text: `${o.name}: [${old || '∅'}] → [${now || '∅'}]` })
    }
  }

  if (prev.status !== curr.status) ch.push({ icon: '⚑', cls: 'end', text: `partita: ${curr.status}` })

  return ch
}

export default function DebugPanel(): JSX.Element {
  const history = useStudio((s) => s.debugHistory)
  const loading = useStudio((s) => s.debugLoading)
  const reload = useStudio((s) => s.loadDebugHistory)

  // Diff calcolato rispetto allo snapshot del turno precedente.
  const righe: Array<{ entry: DebugEntry; changes: Change[] }> = history.map((entry, i) => ({
    entry,
    changes: diff(i > 0 ? history[i - 1].snapshot : null, entry.snapshot)
  }))
  // Più recente in cima.
  righe.reverse()

  return (
    <div className="debug">
      <div className="insp-top">
        <span className="debug-title">
          Debugger
          <span className="debug-count"> · {history.length} turni</span>
        </span>
        <button className="icon-btn" title="Aggiorna" onClick={() => void reload()}>
          ⟳
        </button>
      </div>

      <div className="debug-body">
        {history.length === 0 ? (
          <div className="debug-empty">
            {loading
              ? 'Carico la history…'
              : 'Avvia una partita e gioca qualche turno, poi ⟳ per vedere i passi.'}
          </div>
        ) : (
          righe.map(({ entry, changes }, i) => {
            const isInizio = entry.command === null
            return (
              <div key={history.length - 1 - i} className={'debug-step' + (isInizio ? ' inizio' : '')}>
                <div className="debug-step-head">
                  <span className="debug-turn">T{entry.turn}</span>
                  <span className="debug-cmd">{isInizio ? 'Inizio' : `› ${entry.command}`}</span>
                  <span className="debug-room">{entry.snapshot.currentRoomName ?? ''}</span>
                </div>
                {!isInizio && (
                  <div className="debug-changes">
                    {changes.length === 0 ? (
                      <span className="debug-nochange">nessun cambiamento di stato</span>
                    ) : (
                      changes.map((c, j) => (
                        <div key={j} className={'debug-change ' + c.cls}>
                          <span className="debug-change-icon">{c.icon}</span>
                          {c.text}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
