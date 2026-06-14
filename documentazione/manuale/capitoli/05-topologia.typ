#import "../lib/manuale-template.typ": *

= Muoversi tra le stanze

Sette stanze isolate non fanno una casa. Servono le porte: i collegamenti che
permettono al giocatore di passare da un luogo all'altro. In FAVELLA si tracciano
con una parola, `collega`, e con una direzione.

== Collegare due stanze

#sintassi[
  `[Stanza A] collega [direzione] a [Stanza B].`
]

Le direzioni di base sono `nord`, `sud`, `est`, `ovest` (con le abbreviazioni
`n`, `s`, `e`, `o`). La cosa comoda è che il collegamento di ritorno nasce da
solo: se l'ingresso porta a nord nel salotto, dal salotto si torna a sud
nell'ingresso senza che tu debba scriverlo.

Ecco la pianta completa della Casa:

#esempio[
#fav(```
L'ingresso collega nord a il salotto.
L'ingresso collega ovest a lo studio.
L'ingresso collega est a la cucina.
L'ingresso collega basso a la cantina.
Il salotto collega nord a la camera.
La camera collega sopra a la soffitta.
La cucina collega est a il giardino.
```)
]

Sette righe, e l'intera mappa è in piedi: l'ingresso è lo snodo centrale, da cui
si raggiungono salotto, studio e cucina; dal salotto si sale in camera, dalla
camera in soffitta, dalla cucina si esce in giardino.

#nota[
  Dopo `a` il nome della stanza conserva il suo articolo: si scrive `a il salotto`,
  `a lo studio`, `a la cucina`. È voluto. La parola di collegamento è la `a`
  semplice, e la stanza arriva con il suo nome per intero, articolo compreso.
]

== Dove comincia il giocatore

Le stanze ci sono, sono collegate, ma da dove parte la storia? Lo decidi tu con
una frase. Senza di essa, FAVELLA farebbe partire il giocatore dalla prima stanza
che ha incontrato, e sarebbe un caso, non una scelta.

#sintassi[
  `Il giocatore comincia in [stanza].`
]

#esempio[
#fav(```
Il giocatore comincia in ingresso.
```)
]

La Casa si apre dove deve aprirsi: sull'uscio, con il soprabito di Adele ancora
appeso. Al posto di `comincia` puoi usare `inizia` o `parte`, se ti suonano
meglio.

== Direzioni tue

I quattro punti cardinali bastano per muoversi in piano, ma una casa ha anche un
sopra e un sotto: la soffitta, la cantina. Le parole `su` e `giù` sono però
riservate ad altri usi, e non si possono prendere come direzioni. La soluzione è
*dichiarare direzioni nuove*, sempre in coppia.

#sintassi[
  `[Direzione] e [direzione opposta] sono direzioni opposte.`
]

Dichiararle in coppia garantisce il ritorno automatico, come per i punti
cardinali. La Casa ne usa due distinte, e la distinzione è deliberata:

#esempio[
#fav(```
Alto e basso sono direzioni opposte.
Sopra e sotto sono direzioni opposte.
```)
]

Perché due coppie e non una? Perché `alto`/`basso` collegano l'ingresso alla
cantina, mentre `sopra`/`sotto` collegano la camera alla soffitta. Tenendole
separate, puoi sbarrare un solo percorso alla volta: la porta della cantina
bloccherà chi scende `basso`, senza toccare chi sale `sopra` verso la soffitta.
Quel tipo di blocco — una regola che intercetta un movimento — lo costruiremo nel
capitolo sulle regole.

#prova[
  Aggiungi una nuova stanza, il `sottoscala`, e collegala alla cantina con una
  coppia di direzioni tutta tua (per esempio `dentro` e `fuori`). Poi parti
  dall'ingresso e prova a raggiungerla: se il ritorno funziona, la coppia è
  dichiarata bene.
]
