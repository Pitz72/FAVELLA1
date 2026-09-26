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
iniziali `n`, `s`, `e`, `o`; dalla versione 1.3 anche `su`, `giù`, `nordest`,
`nordovest`, `sudest`, `sudovest` (pure col trattino, `nord-est`). Valgono le
direzioni personalizzate che hai dichiarato (`alto`, `dentro`...). In alternativa,
`vai nord`. `sali` e `scendi` vanno su e giù, `entra` va `dentro`, `esci dalla
stanza` va `fuori`, se la stanza ha quell'uscita e tu non hai dichiarato quei verbi
per conto tuo.

Per rivedere dove ci si trova c'è `guarda` (o `l`); per osservare un oggetto da
vicino, `esamina [oggetto]` (o `x`), oppure `guarda [oggetto]` e `osserva
[oggetto]`, che dalla versione 1.2.2 guardano davvero l'oggetto (e fanno scattare le
tue regole su `esamina`). La stanza dice anche cosa sta sopra i tavoli e dentro i
contenitori aperti: «Sul tavolo: una mela.».

== Maneggiare gli oggetti

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Comando*], [*Effetto*]),
  [#gc[prendi / lascia]], [Raccogliere o posare un oggetto prendibile (`prendi la mela dal tavolo`, `lascia la mela sul tavolo`).],
  [#gc[inventario]], [Vedere cosa si porta con sé (anche `i`), compreso quel che sta negli zaini.],
  [#gc[usa X con Y]], [Far interagire due oggetti.],
  [#gc[metti X in/su Y]], [Posare un oggetto in un contenitore o su un supporto (anche `sopra`).],
  [#gc[apri / chiudi]], [Aprire e chiudere ciò che è `apribile` (dalla 1.3).],
  [#gc[accendi / spegni]], [Accendere e spegnere ciò che è `accendibile` (dalla 1.3).],
  [#gc[mangia / bevi]], [Consumare ciò che è `commestibile` o `bevibile` (dalla 1.3).],
  [#gc[aspetta]], [Lasciar passare un turno (anche `z`, `attendi`).],
  [#gc[dai / mostra X a Y]], [Dare o mostrare un oggetto a un personaggio.],
  [#gc[tocca, spingi, tira…]], [`tocca`, `spingi`, `tira`, `premi`, `gira`, `rompi`, `colpisci`, `indossa`, `togli`, `annusa`, `ascolta`: il motore li capisce e, senza una tua regola, risponde che non succede nulla di particolare.],
  [#gc[parla con X]], [Avviare il dialogo con un personaggio.],
  [#gc[chiedi a X di Y]], [Chiedere a un personaggio di un argomento (anche `domanda`).],
)

I verbi nuovi della 1.3 cedono il passo ai tuoi: se dichiari `"tocca" è un
comando.`, `tocca` diventa tuo, come prima.

== Più oggetti insieme, e le domande

`prendi tutto` raccoglie ciò che si può prendere; `lascia tutto` posa ciò che si
porta; `metti tutto nella cassa` e `prendi tutto dal tavolo` fanno quel che dicono.
Si possono anche elencare le cose: `prendi la chiave e la torcia`. Tutto vale un
solo turno.

Se un nome è ambiguo, FAVELLA chiede, con i nomi della tua storia: «Quale intendi:
la chiave rossa o la chiave blu?». Basta rispondere `rossa` (o il numero, `1`):
il comando riparte da solo. Una risposta che non c'entra vale come un comando
nuovo. Il giocatore può scrivere anche solo una parte del nome (`chiave`, `chiav`),
ma parole intere o loro inizi: `ave` non trova più la chiave.

#nota[
  Un comando che il motore non capisce (un verbo che non conosce, un oggetto che
  non c'è, una domanda come «Cosa vuoi prendere?») non fa passare il tempo: né
  turni, né eventi, né demoni. Fino alla 1.2 un refuso costava un turno.
]

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

Alcuni comandi non fanno parte della storia, ma del modo in cui la si gioca. Non
consumano un turno e non fanno scattare eventi o demoni.

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Comando*], [*Effetto*]),
  [#gc[annulla]], [Disfa l'ultimo turno e riporta il mondo com'era (anche `disfa`).],
  [#gc[ancora]], [Ripete l'ultimo comando (anche `ripeti`, `g`).],
  [#gc[salva]], [Salva la partita (anche con un nome: `salva mattina`).],
  [#gc[carica]], [Riprende una partita salvata (`carica mattina`).],
  [#gc[trascrizione]], [Avvia o ferma la registrazione della partita in un file di testo.],
)

`annulla` è una piccola macchina del tempo: ogni mossa viene fotografata prima di
essere eseguita, così disfarla rimette ogni cosa al suo posto — posizione,
inventario, stati, contatori, persino il caso delle descrizioni a varietà. Puoi
annullare più turni di fila, tornando indietro passo dopo passo. Una conversazione
intera conta come un solo passo: un `annulla` ti riporta a prima di averla iniziata.

`annulla` riporta indietro anche la memoria di `ancora`. Se scrivi `apri la
porta`, poi `prendi la mappa`, poi `annulla`, un `ancora` ripete `apri la porta`:
il comando disfatto è come se non l'avessi mai dato.

== Salvare e riprendere

Dalla versione 1.2 una partita si salva e si riprende. `salva` la mette da parte
col nome `partita`; `salva mattina` le dà un nome, così puoi tenerne più d'una.
`carica` (o `carica mattina`) la riporta esattamente dov'era: stessa stanza, stesse
tasche, stessi stati, persino lo stesso caso per le descrizioni a varietà.
Funziona anche nel mezzo di una conversazione, e dopo aver caricato `annulla` e
`ancora` si comportano come se non avessi mai smesso di giocare.

Nel terminale la partita finisce in un file, `mattina.salvataggio`, nella cartella
da cui giochi. Nel browser (il sito, un gioco esportato in HTML) resta nella
memoria del browser, legata a quella storia.

#nota[
  Il salvataggio non fotografa il mondo: ricorda i comandi che hai dato, e al
  caricamento FAVELLA li rigioca da capo, in un attimo. Funziona perché il motore è
  prevedibile: stessi comandi, stessa partita. Alla fine confronta un'impronta dello
  stato con quella salvata, e se la storia nel frattempo è cambiata te lo dice.
  Dalla 1.3 un salvataggio sopravvive alle correzioni della storia: se il titolo
  (o il nome del file) è lo stesso, la partita si rigioca sulla nuova versione e
  il motore avverte di controllare che tutto sia come prima.
]

#nota[
  `trascrizione` scrive la partita in `trascrizione-favella.txt`, riga per riga. È
  comodo per rileggere una sessione di prova, o per raccogliere le parole esatte che
  un giocatore ha digitato quando qualcosa non è andato come previsto. Un secondo
  `trascrizione` chiude il file.
]

== Toccare invece di scrivere: i pulsanti-verbo

Dalla versione 1.4, nella pagina che crei con `favella1 esporta` e nelle
cassette-gioco del sito, chi gioca può anche *comporre* la frase invece di
scriverla: tocca un verbo, poi un oggetto, e se serve un secondo oggetto.
`Dai` → `Mela` → `alla guardia` manda al motore `dai la mela alla guardia`, come se
fosse stata scritta, e la frase compare nella trascrizione: chi gioca impara
così anche come si scrive. Accanto ai verbi ci sono le uscite della stanza e i
comandi di servizio; durante un dialogo i pulsanti diventano le opzioni, davanti
a una domanda diventano «Sì» e «No», a partita finita «Annulla» e «Ricomincia».
Toccare un oggetto senza aver scelto un verbo lo esamina.

Sei tu a decidere come si danno i comandi nella tua storia, con una frase:

#fav(```
I comandi si scrivono.
I comandi si scelgono con i pulsanti.
I comandi si scrivono oppure si scelgono con i pulsanti.
```)

La prima lascia solo il campo di testo; la seconda solo i pulsanti; la terza, che
vale anche se non scrivi niente, tutti e due (e chi gioca può nascondere i
pulsanti, se non li vuole). Nel terminale si scrive e basta.

I pulsanti non tolgono niente al piacere di scoprire. Propongono ciò che il
giocatore sa già: le cose che vede e quelle che porta, i personaggi presenti. Non
ciò che scoprirebbe provando: `Prendi` offre anche la statua che non si lascia
sollevare. E ciò che hai inventato tu resta tuo: un verbo d'autore di una parola
nuova (`"traduci" è un comando.`) o un argomento di conversazione compaiono fra i
pulsanti solo dopo che il giocatore li ha trovati scrivendo.

#tranello[
  Con `I comandi si scelgono con i pulsanti.` non c'è un campo di testo, quindi
  verbi e argomenti d'autore sono fra i pulsanti da subito: se la tua storia vive
  di parole da indovinare, lascia il campo di testo al giocatore.
]

== Aiuto e uscita

`aiuto` elenca i comandi disponibili. `esci` chiude il dialogo in corso se ce n'è
uno; altrimenti è un movimento, se la stanza ha un'uscita `fuori`, o chiede
conferma prima di chiudere la partita. `ricomincia` riparte da capo, anche lui con
una conferma. Quando la partita finisce, `annulla`, `ricomincia` e `carica` la
riaprono; `fine` chiude.

#tranello[
  Quasi ogni comando può essere riscritto con una regola `Invece di`: è così che
  dài a un verbo un effetto su misura. I comandi di servizio qui sopra —
  `annulla`, `ancora`, `trascrizione` — fanno eccezione: appartengono al lettore,
  non alla storia, e non li intercetti. `salva` e `carica` sono un caso a parte: se
  dichiari tu `"carica" è un comando.` (per un fucile, un camion), il verbo resta
  tuo e il giocatore perde la scorciatoia per ricaricare la partita.
]
