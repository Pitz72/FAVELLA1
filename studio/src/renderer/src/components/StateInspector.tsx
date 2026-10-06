import { useStudio } from '../store'
import type { ObjectKind } from '../../../shared/protocol'
import { Vuoto } from './Elenco'
import { IconaAggiorna, IconaContenitore, IconaOggetto, IconaPersona, IconaSupporto } from './Icone'

const STATUS_LABEL: Record<string, string> = {
  in_corso: 'in corso',
  vinta: 'vinta',
  persa: 'persa',
  terminata: 'finita'
}

const KIND_ICON: Record<ObjectKind, JSX.Element> = {
  oggetto: <IconaOggetto size={14} />,
  contenitore: <IconaContenitore size={14} />,
  supporto: <IconaSupporto size={14} />,
  personaggio: <IconaPersona size={14} />
}

export default function StateInspector(): JSX.Element {
  const snap = useStudio((s) => s.worldSnapshot)
  const reload = useStudio((s) => s.loadWorldSnapshot)

  if (!snap) {
    return (
      <Vuoto titolo="Nessuna partita in corso">Avvia la prova (F5): qui vedrai lo stato del mondo, turno per turno.</Vuoto>
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
        <button className="btn-icona" aria-label="Rileggi lo stato" title="Rileggi" onClick={() => void reload()}>
          <IconaAggiorna />
        </button>
      </div>

      <div className="insp-body">
        <section className="insp-section">
          <h4>Contatori</h4>
          {contatori.length === 0 ? (
            <p className="nota-riquadro">nessuno</p>
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
            <p className="nota-riquadro">nessuno</p>
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
          <h4>
            Inventario ({snap.inventory.length}
            {snap.carryMax !== null ? `/${snap.carryMax}` : ''})
          </h4>
          {snap.inventory.length === 0 ? (
            <p className="nota-riquadro">vuoto</p>
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
              <span className="insp-obj-icon" title={o.kind} aria-hidden="true">
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
