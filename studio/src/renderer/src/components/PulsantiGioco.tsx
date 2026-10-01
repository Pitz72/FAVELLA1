import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { PrimoPulsante, Pulsantiera, SecondoPulsante, VerboPulsante } from '../../../shared/protocol'

// I pulsanti-verbo del motore (1.4): chi prova la storia compone la frase toccando
// un verbo, un oggetto e, se serve, un secondo oggetto. Le frasi arrivano dal motore
// già scritte in italiano («alla guardia», «nella cassa»): qui si accostano e si
// mandano come un comando qualunque. Stesso comportamento della pagina esportata.

type Scelta = { verbo: VerboPulsante; primo: PrimoPulsante | null } | null

const TITOLI_FASE: Record<string, string> = {
  dialogo: 'Rispondi',
  conferma: 'Conferma',
  scelta: 'Quale intendi?',
  fine: 'La partita è finita'
}

function Gruppo({ titolo, children }: { titolo?: string; children: ReactNode[] }): JSX.Element | null {
  if (children.length === 0) return null
  return (
    <div className="pg-gruppo">
      {titolo && <span className="pg-titolo">{titolo}</span>}
      <div className="pg-righe">{children}</div>
    </div>
  )
}

function secondiDi(v: VerboPulsante, primo: PrimoPulsante): SecondoPulsante[] {
  const lista = v.secondi_per ? (v.secondi_per[primo.id] ?? []) : (v.secondi ?? [])
  return lista.filter((s) => s.id === undefined || s.id !== primo.id)
}

export default function PulsantiGioco({
  p,
  onComando,
  disabilitato
}: {
  p: Pulsantiera
  onComando: (cmd: string) => void
  disabilitato?: boolean
}): JSX.Element {
  const [scelta, setScelta] = useState<Scelta>(null)

  // Un turno nuovo porta pulsanti nuovi: la frase a metà si lascia cadere.
  useEffect(() => setScelta(null), [p])

  const invia = (cmd: string): void => {
    setScelta(null)
    onComando(cmd)
  }
  const btn = (chiave: string, testo: ReactNode, azione: () => void, classe = '', titolo?: string): JSX.Element => (
    <button key={chiave} className={'pg-btn ' + classe} onClick={azione} disabled={disabilitato} title={titolo}>
      {testo}
    </button>
  )

  if (p.fase !== 'gioco') {
    return (
      <div className="pg">
        <Gruppo titolo={TITOLI_FASE[p.fase] ?? ''}>
          {p.scelte.map((s) => btn(s.comando, s.etichetta, () => invia(s.comando), 'scelta'))}
        </Gruppo>
      </div>
    )
  }

  const oggetto = (id: string): Pulsantiera['oggetti'][number] | undefined => p.oggetti.find((o) => o.id === id)
  const scegliVerbo = (v: VerboPulsante): void => {
    if (!v.oggetto) return invia(v.verbo)
    setScelta(scelta && scelta.verbo === v ? null : { verbo: v, primo: null })
  }
  const scegliPrimo = (v: VerboPulsante, primo: PrimoPulsante): void => {
    const secondi = secondiDi(v, primo)
    if (v.secondo === 'no' || secondi.length === 0) return invia(`${v.verbo} ${primo.testo}`)
    setScelta({ verbo: v, primo })
  }

  let oggetti: JSX.Element[] = []
  let titoloOggetti = ''
  if (scelta && scelta.primo) {
    const { verbo: v, primo } = scelta
    titoloOggetti = 'Con che cosa?'
    oggetti = secondiDi(v, primo).map((s) => btn(s.testo, s.testo, () => invia(`${v.verbo} ${primo.testo} ${s.testo}`)))
    if (v.secondo === 'facoltativo')
      oggetti.push(btn('_basta', '… e basta', () => invia(`${v.verbo} ${primo.testo}`), 'tenue'))
  } else if (scelta) {
    const v = scelta.verbo
    titoloOggetti = 'Che cosa?'
    oggetti = v.primi.map((pr) => {
      const o = oggetto(pr.id)
      return btn(pr.id, o ? o.etichetta : pr.testo, () => scegliPrimo(v, pr), o?.con_te ? 'con-te' : '')
    })
    if (v.da_solo) oggetti.push(btn('_solo', `${v.verbo} e basta`, () => invia(v.verbo), 'tenue'))
  }

  // Senza un verbo scelto, toccare un oggetto lo esamina.
  const esamina = p.verbi.find((v) => v.verbo === 'esamina')
  const bottoneOggetto = (o: Pulsantiera['oggetti'][number]): JSX.Element => {
    const pr = esamina?.primi.find((x) => x.id === o.id)
    return btn(o.id, o.etichetta, () => pr && invia(`esamina ${pr.testo}`), o.con_te ? 'con-te' : '', pr ? 'Esamina' : undefined)
  }

  return (
    <div className="pg">
      {scelta && (
        <div className="pg-frase" aria-live="polite">
          <span className="pg-frase-testo">
            {scelta.verbo.verbo} {scelta.primo ? `${scelta.primo.testo} …` : '…'}
          </span>
          <button className="pg-btn tenue" onClick={() => setScelta(null)} aria-label="Annulla la frase">
            Annulla
          </button>
        </div>
      )}
      <Gruppo titolo="Azioni">
        {p.verbi.map((v) =>
          btn(v.verbo, v.etichetta, () => scegliVerbo(v), scelta?.verbo === v ? 'attivo' : 'azione')
        )}
      </Gruppo>
      {scelta ? (
        <Gruppo titolo={titoloOggetti}>{oggetti}</Gruppo>
      ) : (
        <>
          <Gruppo titolo="Qui">{p.oggetti.filter((o) => !o.con_te).map(bottoneOggetto)}</Gruppo>
          <Gruppo titolo="Con te">{p.oggetti.filter((o) => o.con_te).map(bottoneOggetto)}</Gruppo>
        </>
      )}
      <Gruppo titolo="Uscite">
        {p.uscite.map((u) => btn(u.comando, `${u.etichetta}${u.stanza ? ` · ${u.stanza}` : ''}`, () => invia(u.comando), 'uscita'))}
      </Gruppo>
      <Gruppo>{p.servizio.map((s) => btn(s.comando, s.etichetta, () => invia(s.comando), 'tenue'))}</Gruppo>
    </div>
  )
}
