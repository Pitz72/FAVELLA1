#import "../lib/manuale-template.typ": *

= Proprietà e stati a due valori

Una porta è chiusa o aperta. Una torcia è spenta o accesa. La terra del giardino
è compatta finché non la scavi. Queste sono *proprietà*: aggettivi che dicono
com'è un oggetto in questo momento, e che possono cambiare durante la partita.
Sono la materia prima di ogni enigma.

== Assegnare una proprietà

#sintassi[
  `[oggetto] è [proprietà].`
]

La proprietà è sempre una parola sola (lo hai visto nel capitolo sull'anatomia
della frase). La scrivi una volta per fissare lo stato iniziale dell'oggetto:

#esempio[
#fav(```
La torcia è spenta.
La credenza è chiusa.
Il cassetto è chiuso.
La terra smossa è compatta.
```)
]

Da quel momento puoi chiedere al gioco se quella proprietà vale — `se la torcia è
spenta` — e una conseguenza potrà cambiarla. Per ora teniamo a mente che lo stato
iniziale si dichiara così.

== Le coppie di opposti

Quasi sempre una proprietà ha il suo contrario, e i due si escludono: una torcia
accesa non è spenta. FAVELLA conosce già la coppia più comune, `aperta` e
`chiusa`. Le altre gliele insegni tu, dichiarandole opposte.

#sintassi[
  `[proprietà] e [proprietà contraria] sono opposte.`
]

#esempio[
#fav(```
Accesa e spenta sono opposte.
Compatta e scavata sono opposte.
```)
]

Il vantaggio è automatico: quando una conseguenza renderà la torcia `accesa`, la
proprietà `spenta` cadrà da sola, senza che tu debba toglierla. Lo stesso per la
terra, che passa da `compatta` a `scavata` una volta sola e non si lascia scavare
due volte.

== Maschile, femminile: ci pensa il motore

Forse l'hai notato: la torcia è `spenta`, il cassetto è `chiuso`. Stessa idea,
desinenza diversa, perché l'italiano concorda l'aggettivo con il genere. FAVELLA
non ti obbliga a stare attento a questo. Confronta le proprietà per la loro
*radice*, così `chiuso` e `chiusa` sono per lui la stessa cosa.

#nota[
  Puoi scrivere `Il cassetto è chiuso.` e più avanti controllarlo con `se il
  cassetto è chiusa`: funziona lo stesso, la radice è quella. Resta comunque buona
  regola scrivere l'accordo giusto — il manuale lo fa — perché il testo si legga
  bene. Quel che cambia la radice, invece, FAVELLA lo intercetta: un vero refuso
  come `chiuao` ti viene segnalato.
]

== Le proprietà fanno gli enigmi

Da sole, le proprietà non fanno succedere niente: dicono uno stato, e basta. Ma
sono l'aggancio su cui poggia tutto. La porta della cantina parte `chiusa`; una
regola controllerà quella proprietà per decidere se lasciarti scendere, e
un'altra la renderà `aperta` quando giri la chiave giusta. Quel meccanismo —
condizione più conseguenza — è il cuore dei prossimi capitoli.

#prova[
  Aggiungi alla camera un `baule`, dichiaralo `chiuso`, e dichiara una coppia di
  opposti tutta tua per un altro oggetto (per esempio `bagnato` e `asciutto` per
  un tappeto). Non serve ancora una regola: stai solo preparando il terreno.
]
