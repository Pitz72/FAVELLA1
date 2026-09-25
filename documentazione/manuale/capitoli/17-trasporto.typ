#import "../lib/manuale-template.typ": *

= La capacità di trasporto

Di norma il giocatore può raccogliere quanti oggetti vuole: l'inventario non ha
fondo. Per molte storie va benissimo, ed è la scelta che la Casa stessa adotta. Ma
se vuoi che «cosa porti con te» diventi una decisione — lasciare una cosa per
prenderne un'altra — puoi mettere un tetto.

== Un limite agli oggetti

#sintassi[
  `Il giocatore può portare [N] oggetti.`
]

Da quel momento l'inventario tiene al massimo N oggetti; quando è pieno, prendere
qualcosa di nuovo non riesce, e il gioco lo dice. Il comando `inventario` mostra
quanti slot stai usando sul totale.

#esempio[
#fav(```
# (Costrutto disponibile; la Casa lascia l'inventario illimitato.)
Il giocatore può portare 5 oggetti.
```)
]

== Oggetti che fanno spazio

Un limite secco sarebbe rigido. Per questo un oggetto può *aggiungere* capacità
mentre lo porti con te: lo zaino, la borsa, la sacca.

#sintassi[
  `[oggetto] dà [N] spazi.`
]

#esempio[
#fav(```
Il giocatore può portare 5 oggetti.
Lo zaino dà 15 spazi.
```)
]

Finché lo zaino è nell'inventario, i suoi spazi si sommano al limite di base;
se lo posi, te li riprendi. È il modello «più capienza mentre lo indossi», senza
dover gestire uno zaino-contenitore a parte.

== Ciò che porti dentro le cose

Uno zaino può anche essere un contenitore (`Lo zaino è un contenitore.`): il
giocatore ci infila le cose con `metti`. Quello che sta dentro è a tutti gli
effetti *portato*: vale per le condizioni `se il giocatore ha …` (la chiave nello
zaino apre la porta) e pesa sul limite, come quello che hai in mano.

- Prendere uno zaino già pieno pesa quanto lui e il suo contenuto; se lo zaino
  `dà` spazi, quegli spazi coprono ciò che contiene.
- Mettere nello zaino un oggetto raccolto da terra chiede un posto; tirarlo fuori
  no, e `lascia` lo posa direttamente.
- Il comando `inventario` conta tutto e mostra il contenuto rientrato sotto lo
  zaino.

Fino alla versione 1.2.1 le cose nello zaino non contavano: uno zaino contenitore
portava oggetti senza limite, e una chiave messa lì dentro non apriva nulla.

#nota[
  La capacità è del tutto facoltativa e *additiva*: se non scrivi mai `Il giocatore
  può portare …`, l'inventario resta illimitato, come è sempre stato. La Casa di
  Via Stradivari fa proprio così: preferisce non distrarre il giocatore con la
  contabilità delle tasche, e lo lascia concentrare sulla storia.
]

#tranello[
  Il limite ferma il giocatore che *prende*, non le tue regole. Una conseguenza
  come `e adesso la borraccia è in inventario` mette l'oggetto nelle tasche anche
  se sono già piene. Dalla versione 1.1 FAVELLA te lo segnala con un avviso. Se
  la cosa conta, metti la regola sotto condizione, oppure fai lasciare qualcosa
  al giocatore prima di dargli l'oggetto.
]

#prova[
  Metti alla Casa un limite di 3 oggetti e dài al `portaombrelli` la proprietà di
  `dare 2 spazi`. Poi prova a riempire l'inventario e vedi come cambia il numero
  accanto al comando `inventario`.
]
