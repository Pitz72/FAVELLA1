#import "../lib/manuale-template.typ": *

= Contenitori e supporti

Non tutto sta semplicemente «in una stanza». Certe cose stanno *dentro* altre — la
chiave nella credenza, le lettere nel cassetto — o *sopra* altre — la torcia sul
tavolino. FAVELLA distingue questi due ruoli con due parole: contenitore e
supporto.

== Dichiarare un contenitore o un supporto

#sintassi[
  `[Nome] è un contenitore.` \
  `[Nome] è un supporto.`
]

Un *contenitore* tiene cose dentro di sé e può essere aperto o chiuso; un
*supporto* tiene cose sopra, in vista. La credenza del salotto è un contenitore;
il tavolino dell'ingresso, un supporto.

#esempio[
#fav(```
La credenza è un contenitore.
La credenza è in salotto.
La credenza è chiusa.

Il tavolino è un supporto.
Il tavolino è in ingresso.
```)
]

Per il resto si comportano come oggetti qualsiasi: hanno una posizione, una
descrizione, eventuali proprietà.

== Metterci dentro qualcosa

Per collocare un oggetto dentro un contenitore o sopra un supporto usi la stessa
frase di posizione vista per le stanze, scegliendo la preposizione giusta.

#esempio[
#fav(```
La chiave della cantina è nella credenza.
Le lettere è nel cassetto.
La torcia è sul tavolino.
```)
]

E qui torna comoda la robustezza d'ordine: puoi mettere la torcia `sul tavolino`
anche prima di aver dichiarato che il tavolino è un supporto. FAVELLA sistema
tutto a fine lettura.

== Un contenitore chiuso nasconde

C'è un motivo se la credenza nasce `chiusa`. Un contenitore chiuso *non mostra il
suo contenuto*: finché il giocatore non lo apre, la chiave lì dentro è come se non
ci fosse. È esattamente ciò che rende la credenza un piccolo enigma invece di uno
scaffale.

#esempio[
#fav(```
Il cassetto è un contenitore.
Il cassetto è chiuso.

Le lettere è nel cassetto.
```)
]

Le lettere restano invisibili finché il cassetto è chiuso. Aprirlo — con la chiave
giusta o forzandolo con il portaombrelli — è una *regola*, e la scriverai nel
capitolo dedicato. Il riutilizzo della coppia `aperta`/`chiusa` significa anche
che non devi inventare nulla di nuovo: «aperto» e «chiuso» li conosci già.

Il giocatore, dal canto suo, può anche posare cose: il comando `metti [oggetto]
in/su [contenitore o supporto]` sposta un oggetto dell'inventario dentro o sopra
un altro.

== Alias: lo stesso oggetto, più nomi

Tu chiami un oggetto «flacone di medicine»; il giocatore digiterà «medicine».
Per non costringerlo a indovinare il tuo nome esatto, gli dài degli *alias*:
sinonimi che valgono solo per quello che lui scrive.

#sintassi[
  `[oggetto] si chiama anche "[sinonimo]".`
]

L'alias è vocabolario nuovo, quindi va *tra virgolette*. La Casa ne usa parecchi:

#esempio[
#fav(```
La torcia si chiama anche "pila".
Le lettere si chiama anche "corrispondenza".
L'atto di vendita si chiama anche "carte".
```)
]

#nota[
  Gli alias valgono solo per l'input del giocatore. Nelle *tue* regole continui a
  usare il nome canonico (`la torcia`, non «pila»): l'alias è una cortesia verso
  chi gioca, non un secondo nome per te.
]

#prova[
  Trasforma la `scrivania` dello studio in un supporto, posaci sopra una `penna`
  prendibile, e dài alla penna l'alias `"stilografica"`. Poi prova a prenderla
  digitando il sinonimo.
]
