#import "../lib/manuale-template.typ": *

= Il caso e le quantità

Un contatore, fin qui, è stato una cella chiusa: lo confronti con un numero che
scegli tu, lo fai salire di uno. Funziona, ma tiene i numeri separati l'uno
dall'altro. La forza del guerriero non sa nulla della vita del drago; il danno è
sempre lo stesso, perché è scritto a mano.

Questo capitolo apre due porte. La prima fa parlare i numeri fra loro: una quantità
può essere il valore di un altro contatore, e un confronto può mettere a paragone
due grandezze invece di un numero e una costante. La seconda dà all'autore un paio
di dadi: l'estrazione a caso, e l'imprevisto che càpita una volta su quattro.

Nessuno dei due costrutti serve a «La Casa di Via Stradivari» — è una storia di
indizi e di calma, non di combattimenti o di meteo. Gli esempi vengono dunque da
territori diversi: un gioco di ruolo, un viaggio in automobile, una notte di
sopravvivenza. Sono i generi su cui FAVELLA è stata messa alla prova, ed è lì che
questi strumenti danno il meglio.

== L'operando: misurare un «quanto»

Ovunque FAVELLA si aspetti una quantità — di quanto far salire un contatore, contro
cosa confrontarlo — accetta tre forme. Le chiamiamo, tutte e tre, un *operando*.

#sintassi[
  `3` — un numero scritto a mano \
  `[forza]` — il valore di un contatore, fra parentesi quadre \
  `un numero fra 1 e 6` — un'estrazione a caso, estremi compresi
]

La forma fra parentesi quadre è la stessa che già usi nei testi: `[forza]` significa
«il valore di `forza` adesso», esattamente come quando lo scrivi dentro una battuta.
Qui, però, non lo stampi: lo usi come numero, per farci un conto.

== Quantità prese da un altro contatore

`aumenta` e `diminuisci`, da soli, muovono il contatore di uno. Aggiungendo `di` più
un operando dici *di quanto*, e il «quanto» può venire da un altro contatore. In un
gioco di ruolo, il colpo del guerriero toglie al drago tanti punti vita quanta è la
sua forza:

#esempio(da: "forma disponibile")[
#fav(```
Invece di colpisci il drago: dire "Cali la spada." e adesso diminuisci la vita del drago di [forza].
```)
]

Se la forza vale cinque, il drago perde cinque punti; se più tardi bevi una pozione e
la forza sale a otto, lo stesso comando ne toglie otto. Il danno non è più un numero
fisso: segue una statistica del mondo. Lo stesso vale per `diventa`, che porta il
contatore a un valore — anch'esso, volendo, preso da un altro contatore.

== Confrontare due grandezze

Allo stesso modo, un confronto può mettere a paragone due contatori. Dove prima
scrivevi un numero, ora puoi mettere il valore di un contatore fra parentesi quadre:

#sintassi[
  `se la vita del drago è meno di [vita del guerriero]` \
  `se gli indizi è almeno [indizi necessari]`
]

Tutta la scala dei confronti del capitolo «Stati e contatori» — `almeno`, `al
massimo`, `più di`, `meno di` — accetta un contatore al posto del numero. È così che
nascono le soglie mobili: il drago fugge quando la sua vita scende sotto quella del
guerriero, una relazione che cambia da sé man mano che i due numeri si muovono.

#nota[
  Il caso resta fuori dai confronti. Puoi confrontare con un numero o con un altro
  contatore, ma non con `un numero fra 1 e 6`: una soglia ripescata a ogni controllo
  non vorrebbe dire niente. L'estrazione a caso serve a *muovere* i numeri, non a
  *misurarli*.
]

== Tirare i dadi

La terza forma dell'operando è il dado vero e proprio: `un numero fra A e B` pesca un
intero a caso nell'intervallo, estremi compresi.

#esempio(da: "forma disponibile")[
#fav(```
Invece di tira il dado: dire "I dadi rotolano sul tavolo." e adesso il punteggio diventa un numero fra 1 e 6.
```)
]

`fra 1 e 6` dà uno qualsiasi fra uno e sei, sei incluso. Lo usi per il danno
variabile, per un incontro che non sai prevedere, per qualunque cosa debba pendere
dalla fortuna.

== Scegliere a caso fra più stati

I numeri non sono l'unica cosa che il caso può decidere. Uno *stato* può prendere uno
fra più valori, sorteggiato sul momento:

#sintassi[
  `[stato] diventa uno fra [valore], [valore], [valore].`
]

Il meteo di un viaggio in automobile, per esempio, cambia senza che tu sappia in
anticipo come:

#esempio(da: "forma disponibile")[
#fav(```
Ogni 10 turni: il meteo diventa uno fra sereno, pioggia, nebbia.
```)
]

Bada alla parola: `diventa uno fra …` sceglie un *valore di stato* (parole come
`sereno`, `pioggia`); `diventa un numero fra …` produce una *quantità*. La `uno` o il
`numero` dicono a FAVELLA quale dei due intendi.

== Quando càpita

Resta l'imprevisto: qualcosa che accade solo a volte, con una certa probabilità. La
condizione `càpita (N su M)` — sì, con l'accento — è vera all'incirca N volte su M.

#sintassi[
  `càpita (1 su 4)` — vera una volta su quattro \
  `càpita (3 su 10)` — vera tre volte su dieci
]

È fatta apposta per i demoni, le sentinelle che controllano una condizione a ogni
turno. In un viaggio, una gomma può forarsi senza preavviso:

#esempio(da: "forma disponibile")[
#fav(```
Ogni turno se càpita (1 su 20): dire "Uno scoppio secco: hai forato." e adesso la ruota è forata.
```)
]

`càpita` è una condizione come le altre: la combini con `e`, `oppure`, `non`, e la
usi dove serve una condizione — in una regola, in un'opzione di dialogo, in una
descrizione. Tienine però a mente la natura: ogni volta che FAVELLA la *controlla*,
tira il dado. In un demone `Ogni turno se …` è esattamente ciò che vuoi, un tiro a
turno; valutarla più volte nello stesso turno significa più tiri.

== Il caso si può riavvolgere

Una cosa importante, e tutt'altro che ovvia: in FAVELLA il caso è *riproducibile*. Il
dado non è davvero imprevedibile — segue un filo nascosto, lo stesso a ogni partita —
e quel filo fa parte dello stato del mondo. Significa che `annulla` riavvolge anche la
fortuna: disfi il turno in cui hai forato la gomma e, rifacendo la stessa mossa,
riottieni lo stesso esito.

Per te che scrivi è una garanzia doppia. Una storia che usa il caso resta
*collaudabile*, perché la stessa partita dà gli stessi tiri; e il giocatore non può
rifare `annulla` all'infinito per «ripescare» un risultato migliore. Vale anche per le
descrizioni a varietà e per i personaggi che si muovono a caso: un solo filo, per
tutto ciò che nel mondo dipende dalla sorte.

#prova[
  Dài a un personaggio un contatore `forza` che parte da 3 e un comando `colpisci`
  che toglie a un nemico tanta vita quanta `[forza]`. Poi aggiungi un demone che, una
  volta su sei, fa rialzare di un punto la vita del nemico. Gioca, annulla un turno e
  rigioca: controlla che il tiro «una volta su sei» si ripeta identico.
]
