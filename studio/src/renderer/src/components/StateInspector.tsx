import { useStudio } from '../store'
import type { ObjectKind } from '../../../shared/protocol'

const STATUS_LABEL: Record<string, string> = {
  in_corso: 'In corso',
  vinta: 'Vinta ★',
  persa: 'Persa ☠',
  terminata: 'Terminata ■'
}

const KIND_ICON: Record<ObjectKind, string> = {
  oggetto: '•',
  contenitore: '▣',
  supporto: '▤',
  personaggio: '☻'
}

export default function StateInspector(): JSX.Element {
  const snap = useStudio((s) => s.worldSnapshot)
  const reload = useStudio((s) => s.loadWorldSnapshot)

  if (!snap) {
    return (
      <div className="insp-empty">
        Avvia una partita (▶ Gioca) per ispezionare lo stato del mondo in tempo reale.
      </div>
    )
  }

  const stati = snap.variables.filter((v) => v.kind === 'stato')
  const contatori = snap.variables.filter((v) => v.kind === 'contatore')

  return (
    <div className="inspector">
      <div className="insp-top">
        <div className="insp-summary">
          <span className="insp-room">{snap.currentRoomName ?? '—'}</span>
          <span className="insp-meta">turno {snap.turn}</span>
          <span className={'insp-status ' + snap.status}>{STATUS_LABEL[snap.status] ?? snap.status}</span>
          {snap.inDialogue && <span className="insp-dialogue">in dialogo</span>}
        </div>
        <button className="icon-btn" title="Aggiorna" onClick={() => void reload()}>
          ⟳
        </button>
      </div>

      <div className="insp-body">
        <section className="insp-section">
          <h4>Contatori</h4>
          {contatori.length === 0 ? (
            <p className="insp-none">nessuno</p>
          ) : (
            contatori.map((v) => (
              <div key={v.name} className="insp-var">
                <span className="insp-var-name">{v.name}</span>
                <span className="insp-var-num">{v.value as number}</span>
              </div>
            ))
          )}
        </section>

        <section className="insp-section">
          <h4>Stati</h4>
          {stati.length === 0 ? (
            <p className="insp-none">nessuno</p>
          ) : (
            stati.map((v) => (
              <div key={v.name} className="insp-var">
                <span className="insp-var-name">{v.name}</span>
                <span className="insp-var-val">{v.value === null ? '∅' : String(v.value)}</span>
              </div>
            ))
          )}
        </section>

        <section className="insp-section">
          <h4>Inventario ({snap.inventory.length})</h4>
          {snap.inventory.length === 0 ? (
            <p className="insp-none">vuoto</p>
          ) : (
            snap.inventory.map((i) => (
              <div key={i.id} className="insp-item">
                {i.name}
              </div>
            ))
          )}
        </section>

        <section className="insp-section">
          <h4>Oggetti ({snap.objects.length})</h4>
          {snap.objects.map((o) => (
            <div key={o.id} className="insp-obj">
              <span className="insp-obj-icon" title={o.kind}>
                {KIND_ICON[o.kind]}
              </span>
              <span className="insp-obj-name">{o.name}</span>
              <span className="insp-obj-pos">{o.positionLabel ?? '—'}</span>
              {o.properties.length > 0 && (
                <span className="insp-obj-props">{o.properties.join(', ')}</span>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
