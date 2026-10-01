import type { RightTab } from './store'

// L'interfaccia non ha più dodici pulsanti in fila: ha cinque SEZIONI, nell'ordine
// in cui si scrive una storia. Ogni sezione raccoglie i pannelli che già esistevano
// (RightTab): le sotto-schede ne sono solo il nome d'autore.

export type Sezione = 'storia' | 'mondo' | 'personaggi' | 'regole' | 'prova'

export interface SottoScheda {
  tab: Exclude<RightTab, null>
  titolo: string
  /** Una riga che dice a che cosa serve, mostrata come suggerimento. */
  aiuto: string
}

export interface DefSezione {
  id: Sezione
  titolo: string
  /** Una riga sotto il titolo: che cosa si fa qui. */
  descrizione: string
  /** Scorciatoia da tastiera (Ctrl+numero). */
  tasto: string
  sotto: SottoScheda[]
}

export const SEZIONI: DefSezione[] = [
  {
    id: 'storia',
    titolo: 'Storia',
    descrizione: 'Il testo della tua avventura, frase per frase.',
    tasto: '1',
    sotto: []
  },
  {
    id: 'mondo',
    titolo: 'Mondo',
    descrizione: 'Le stanze, gli oggetti e come sono collegati.',
    tasto: '2',
    sotto: [
      { tab: 'stanze', titolo: 'Stanze', aiuto: 'Descrizioni e punto di partenza' },
      { tab: 'oggetti', titolo: 'Oggetti', aiuto: 'Cose da trovare, prendere e usare' },
      { tab: 'mappa', titolo: 'Mappa', aiuto: 'Le uscite fra le stanze, da trascinare' }
    ]
  },
  {
    id: 'personaggi',
    titolo: 'Personaggi',
    descrizione: 'Chi vive nella storia e che cosa dice.',
    tasto: '3',
    sotto: [{ tab: 'dialoghi', titolo: 'Dialoghi', aiuto: 'Personaggi, battute e scelte' }]
  },
  {
    id: 'regole',
    titolo: 'Regole',
    descrizione: 'Che cosa succede quando il giocatore agisce.',
    tasto: '4',
    sotto: [
      { tab: 'regole', titolo: 'Regole ed eventi', aiuto: 'Invece di…, ogni turno…' },
      { tab: 'stati', titolo: 'Stati e contatori', aiuto: 'Ciò che il mondo ricorda' },
      { tab: 'parole', titolo: 'Parole e comandi', aiuto: 'Verbi inventati, sinonimi, come comanda chi gioca' }
    ]
  },
  {
    id: 'prova',
    titolo: 'Prova',
    descrizione: 'Gioca la tua storia e guarda come va.',
    tasto: '5',
    sotto: [{ tab: 'gioca', titolo: 'Gioca', aiuto: 'La partita, con lo stato accanto' }]
  }
]

/** La sezione a cui appartiene un pannello (null = nessun pannello: la Storia). */
export function sezioneDi(tab: RightTab): Sezione {
  if (tab === null) return 'storia'
  for (const s of SEZIONI) if (s.sotto.some((x) => x.tab === tab)) return s.id
  // 'stato' e 'debug' vivono dentro la Prova (colonna di destra).
  return 'prova'
}

export function defSezione(id: Sezione): DefSezione {
  return SEZIONI.find((s) => s.id === id) as DefSezione
}
