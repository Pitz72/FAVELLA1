#import "../lib/guida.typ": *

= Mondo: la mappa

La linguetta #ui[Mappa] disegna le stanze e le loro uscite. È il modo più rapido per
capire com'è fatto il mondo e per collegare le stanze; tutto quello che fai qui si può
fare anche dalla scheda di una stanza (capitolo 5), con la tastiera.

#schermata("mappa.png",
  alt: "La mappa della Casa di Via Stradivari: le stanze collegate da linee con le direzioni scritte; a destra la scheda delle uscite dell'ingresso.",
  didascalia: [La mappa, con le uscite dell'ingresso aperte a destra.])

== Leggere la mappa

- Ogni stanza è un riquadro col suo nome. Quella da cui comincia il giocatore ha il segno
  #ui[partenza].
- Una linea è un collegamento fra due stanze. Vicino a ogni capo è scritta la direzione
  da prendere *da quella stanza*: fra l'ingresso e il salotto leggi «nord» vicino
  all'ingresso e «sud» vicino al salotto.
- Una linea tratteggiata è un'uscita a senso unico: si va, ma non si torna per la stessa
  strada.
- In basso a sinistra ci sono #ui[\+] e #ui[−] per ingrandire e rimpicciolire e un
  pulsante per vedere tutta la mappa; in basso a destra, la mappa in piccolo.

Le stanze si spostano trascinandole: Studio ricorda dove le hai messe, storia per storia.
#ui[Riallinea], nella barra sopra la mappa, le ridispone da sole (e dimentica le
posizioni che avevi scelto).

== Collegare due stanze

#passi(
  [Ogni stanza ha dei pallini sul bordo. Trascina da un pallino fino a un'altra stanza.],
  [Si apre #ui[Un collegamento nuovo]: scegli la direzione per andare dalla prima alla
    seconda. Il ritorno si scrive da solo.],
  [Per una direzione che non esiste ancora scegli #ui[Una direzione nuova…] e scrivi
    #ui[Per andare] e #ui[Per tornare] (per esempio «botola» e «scala»).],
  [Scegli #ui[Crea e collega].],
)

== Cambiare o togliere un collegamento

Un clic su una linea apre #ui[Il collegamento]: le due stanze, la direzione (che si
cambia dal menu) e #ui[Togli], che toglie il collegamento e anche il ritorno. Il
ritorno si aggiorna da solo.

#schermata("mappa-collegamento.png",
  alt: "La finestra Il collegamento: L'ingresso e Il salotto; da L'ingresso verso nord, con il pulsante Togli; sotto, la nota sul ritorno.",
  didascalia: [Il collegamento fra l'ingresso e il salotto.])

== Le uscite di una stanza, e le stanze nuove

Un clic su una stanza apre a destra le sue uscite, come nella scheda della stanza:
direzione, stanza, #ui[×] per togliere, l'ultima riga per aggiungere.
#ui[Apri la scheda della stanza] porta alla sua scheda completa.

#ui[\+ Stanza], nella barra sopra la mappa, crea una stanza nuova: scrivi il nome con
l'articolo e scegli #ui[Crea la stanza]. Compare sulla mappa, pronta da collegare.

#tastiera[
  La mappa si usa col mouse. Con la tastiera le stesse cose si fanno dalla scheda di
  ogni stanza, nel riquadro #ui[Uscite] (capitolo 5): è lì che conviene lavorare se
  usi un lettore di schermo.
]
