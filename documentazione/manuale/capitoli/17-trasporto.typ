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

#nota[
  La capacità è del tutto facoltativa e *additiva*: se non scrivi mai `Il giocatore
  può portare …`, l'inventario resta illimitato, come è sempre stato. La Casa di
  Via Stradivari fa proprio così: preferisce non distrarre il giocatore con la
  contabilità delle tasche, e lo lascia concentrare sulla storia.
]

#prova[
  Metti alla Casa un limite di 3 oggetti e dài al `portaombrelli` la proprietà di
  `dare 2 spazi`. Poi prova a riempire l'inventario e vedi come cambia il numero
  accanto al comando `inventario`.
]
