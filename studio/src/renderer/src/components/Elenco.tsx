import { useStudio } from '../store'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { IconaCerca, IconaPiu } from './Icone'

// [Studio 1.2] L'elenco a sinistra degli editor (stanze, oggetti, personaggi). Ogni voce
// è un pulsante vero (prima erano righe cliccabili irraggiungibili da tastiera); le frecce
// su e giù scorrono le voci; con più di otto voci compare la ricerca.

export interface VoceElenco {
  id: string
  nome: string
  icona: ReactNode
  /** Una nota a destra (es. «partenza», «in cucina»). */
  nota?: string
  titolo?: string
}

export default function Elenco({
  titolo,
  voci,
  selezionato,
  onScegli,
  nuovo,
  vuoto
}: {
  titolo: string
  voci: VoceElenco[]
  selezionato: string | null
  onScegli: (id: string) => void
  nuovo?: { etichetta: string; onClick: () => void; aperto?: boolean }
  vuoto: string
}): JSX.Element {
  const [cerca, setCerca] = useState('')
  const ref = useRef<HTMLUListElement | null>(null)
  const filtrate = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    return q ? voci.filter((v) => v.nome.toLowerCase().includes(q) || v.nota?.toLowerCase().includes(q)) : voci
  }, [voci, cerca])

  const sposta = (e: React.KeyboardEvent<HTMLButtonElement>, i: number): void => {
    const j = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? filtrate.length - 1 : null
    if (j === null || j < 0 || j >= filtrate.length) return
    e.preventDefault()
    const bottoni = ref.current?.querySelectorAll<HTMLButtonElement>('.elenco-voce')
    bottoni?.[j]?.focus()
  }

  return (
    <div className="elenco">
      <div className="elenco-testa">
        <h2 className="elenco-titolo">
          {titolo} <span className="elenco-conto">{voci.length}</span>
        </h2>
        {nuovo && (
          <button className="btn btn-piccolo btn-accento" onClick={nuovo.onClick} aria-expanded={nuovo.aperto}>
            <IconaPiu size={15} />
            {nuovo.etichetta}
          </button>
        )}
      </div>
      {voci.length > 8 && (
        <label className="elenco-cerca">
          <IconaCerca size={15} />
          <span className="visivamente-nascosto">Cerca in {titolo.toLowerCase()}</span>
          <input type="search" placeholder="Cerca…" value={cerca} onChange={(e) => setCerca(e.target.value)} />
        </label>
      )}
      {voci.length === 0 ? (
        <p className="elenco-vuoto">{vuoto}</p>
      ) : filtrate.length === 0 ? (
        <p className="elenco-vuoto">Niente che contenga «{cerca}».</p>
      ) : (
        <ul className="elenco-voci" ref={ref} aria-label={titolo}>
          {filtrate.map((v, i) => (
            <li key={v.id}>
              <button
                className={'elenco-voce' + (v.id === selezionato ? ' scelta' : '')}
                aria-current={v.id === selezionato ? 'true' : undefined}
                onClick={() => onScegli(v.id)}
                onKeyDown={(e) => sposta(e, i)}
                title={v.titolo}
              >
                <span className="elenco-icona" aria-hidden="true">
                  {v.icona}
                </span>
                <span className="elenco-nome">{v.nome}</span>
                {v.nota && <span className="elenco-nota">{v.nota}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Un riquadro del modulo di destra: titolo, eventuale aiuto, contenuto. */
export function Riquadro({
  titolo,
  aiuto,
  children,
  pericolo
}: {
  titolo?: string
  aiuto?: ReactNode
  children: ReactNode
  pericolo?: boolean
}): JSX.Element {
  return (
    <section className={'riquadro' + (pericolo ? ' riquadro-pericolo' : '')}>
      {titolo && <h3 className="riquadro-titolo">{titolo}</h3>}
      {children}
      {aiuto && <p className="aiuto">{aiuto}</p>}
    </section>
  )
}

/** Lo stato vuoto di un pannello: che cosa manca e che cosa fare. */
export function Vuoto({ titolo, children, azione }: { titolo: string; children?: ReactNode; azione?: ReactNode }): JSX.Element {
  return (
    <div className="vuoto">
      <p className="vuoto-titolo">{titolo}</p>
      {children && <p>{children}</p>}
      {azione}
    </div>
  )
}

/**
 * Il pannello non può ancora lavorare: nessun file .fav, dati in arrivo, o storia con
 * errori (allora si porta ai problemi, nel testo, dove si correggono).
 */
export function NonPronto({
  cosa,
  stato,
  onRiprova
}: {
  /** «le stanze», «gli oggetti»… */
  cosa: string
  stato: 'nessun-file' | 'carico' | 'vuoto' | 'errori'
  onRiprova?: () => void
}): JSX.Element {
  if (stato === 'nessun-file') return <Vuoto titolo="Nessuna storia aperta">Apri un file .fav per vedere {cosa}.</Vuoto>
  if (stato === 'carico') return <Vuoto titolo={`Leggo ${cosa}…`} />
  if (stato === 'errori') {
    return (
      <Vuoto
        titolo="La storia ha degli errori"
        azione={
          <div className="vuoto-azioni">
            <button
              className="btn btn-primario"
              onClick={() => {
                const st = useStudio.getState()
                st.setSezione('storia')
                st.setProblemiAperti(true)
              }}
            >
              Vedi i problemi
            </button>
            {onRiprova && (
              <button className="btn btn-quieto" onClick={onRiprova}>
                Riprova
              </button>
            )}
          </div>
        }
      >
        Finché il testo non compila, qui non posso mostrarti {cosa}. Correggili nel testo: li trovi nell’elenco dei problemi.
      </Vuoto>
    )
  }
  return (
    <Vuoto
      titolo={`Non ho ancora letto ${cosa}`}
      azione={
        onRiprova && (
          <button className="btn btn-quieto" onClick={onRiprova}>
            Leggi
          </button>
        )
      }
    />
  )
}
