#import "../lib/manuale-template.typ": *

#let gc(s) = text(font: font-mono, size: 8.5pt, fill: c.ink)[#s]

= I comandi del giocatore

Fin qui hai guardato la storia dal lato di chi la scrive. Questo capitolo la guarda
dal lato di chi la gioca: quali parole può digitare chi ha la tua avventura davanti.
Conoscerle serve anche a te, perché sono le stesse che intercetti con le regole
`Invece di`, e perché un paio di comodità — i pronomi, l'annullamento — cambiano il
modo in cui la storia si lascia esplorare.

== Muoversi e guardare

Ci si sposta nominando la direzione: `nord`, `sud`, `est`, `ovest`, e le loro
iniziali `n`, `s`, `e`, `o`; valgono anche le direzioni personalizzate che hai
dichiarato (`alto`, `dentro`...). In alternativa, `vai nord`. Per rivedere dove ci
si trova c'è `guarda`; per osservare un oggetto da vicino, `esamina [oggetto]`.

== Maneggiare gli oggetti

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Comando*], [*Effetto*]),
  [#gc[prendi / lascia]], [Raccogliere o posare un oggetto prendibile.],
  [#gc[inventario]], [Vedere cosa si porta con sé (anche `i`).],
  [#gc[usa X con Y]], [Far interagire due oggetti.],
  [#gc[metti X in/su Y]], [Posare un oggetto in un contenitore o su un supporto.],
  [#gc[parla con X]], [Avviare il dialogo con un personaggio.],
)

== Riferirsi all'ultima cosa: i pronomi

Nessuno, parlando, ripete ogni volta il nome per intero. Dopo aver guardato la
torcia, viene naturale dire «prendila», non «prendi la torcia». FAVELLA capisce
questi *pronomi* e li scioglie da sé.

I pronomi si attaccano in coda al verbo — `prendila`, `aprilo`, `esaminale`,
`usali` — concordando in genere e numero con l'ultima cosa nominata. In alternativa
puoi usarli staccati: `prendi quella`, `usa lo`.

#esempio(da: "in gioco")[
#fav(```
> esamina la torcia
Una torcia pesante, di gomma nera.

> prendila
Hai preso la torcia.
```)
]

Il riferimento è all'ultima cosa di cui ci si è occupati: l'oggetto dell'ultima
azione, oppure l'ultimo nominato — anche solo perché comparso nell'elenco di quel
che c'è nella stanza. Se il genere non torna (un «prendilo» dove l'ultima cosa era
femminile) FAVELLA non indovina a caso: ti dice che non sa a cosa ti riferisci. E
se la cosa nel frattempo è sparita dalla portata, risponde che non la vedi più.

== Tornare sui propri passi

Tre comandi non fanno parte della storia, ma del modo in cui la si gioca. Non
consumano un turno e non fanno scattare eventi o demoni.

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Comando*], [*Effetto*]),
  [#gc[annulla]], [Disfa l'ultimo turno e riporta il mondo com'era (anche `disfa`).],
  [#gc[ancora]], [Ripete l'ultimo comando (anche `ripeti`, `g`).],
  [#gc[trascrizione]], [Avvia o ferma il salvataggio della partita su file di testo.],
)

`annulla` è una piccola macchina del tempo: ogni mossa viene fotografata prima di
essere eseguita, così disfarla rimette ogni cosa al suo posto — posizione,
inventario, stati, contatori, persino il caso delle descrizioni a varietà. Puoi
annullare più turni di fila, tornando indietro passo dopo passo. Una conversazione
intera conta come un solo passo: un `annulla` ti riporta a prima di averla iniziata.

#nota[
  `trascrizione` scrive la partita in `trascrizione-favella.txt`, riga per riga. È
  comodo per rileggere una sessione di prova, o per raccogliere le parole esatte che
  un giocatore ha digitato quando qualcosa non è andato come previsto. Un secondo
  `trascrizione` chiude il file.
]

== Aiuto e uscita

`aiuto` elenca i comandi disponibili. `esci` chiude il dialogo in corso se ce n'è
uno, altrimenti termina la partita.

#tranello[
  Quasi ogni comando può essere riscritto con una regola `Invece di`: è così che
  dài a un verbo un effetto su misura. I tre comandi di servizio qui sopra —
  `annulla`, `ancora`, `trascrizione` — fanno eccezione: appartengono al lettore,
  non alla storia, e non li intercetti.
]
