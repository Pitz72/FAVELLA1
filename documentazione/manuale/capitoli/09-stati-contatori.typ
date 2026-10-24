#import "../lib/manuale-template.typ": *

= Stati e contatori

Le proprietà raccontano com'è un *oggetto*. Ma una storia ha bisogno anche di
tenere il conto di cose che non stanno in nessun oggetto: a che punto è il
temporale, quanto sa il giocatore, quanti indizi ha raccolto. Per questo ci sono
gli *stati* e i *contatori* — la memoria astratta della tua avventura.

== Gli stati

Uno *stato* è una variabile che può assumere uno fra più valori, come un
interruttore a più posizioni. Lo dichiari, poi ne fissi il valore iniziale.

#sintassi[
  `[Nome] è uno stato.` \
  `[Nome] è [valore iniziale].`
]

Nella Casa la verità sul conto di Adele attraversa più stadi, e il temporale pure:

#esempio[
#fav(```
La verità è uno stato.
La verità è ignota.

Il temporale è uno stato.
Il temporale è lontano.
```)
]

I valori — `ignota`, `sospetta`, `svelata` per la verità — non si elencano in
anticipo: li introduci usandoli. Da quel momento puoi interrogare lo stato in una
condizione (`se la verità è svelata`, oppure `se la verità non è ignota`) e
cambiarlo con una conseguenza (`e adesso la verità è svelata`), che vedremo a
breve.

== I contatori

Un *contatore* tiene un numero. Parte da zero, se non dici altro, e lo fai salire
o scendere nel corso della partita.

#sintassi[
  `[Nome] è un contatore.`
]

#esempio[
#fav(```
Gli indizi è un contatore.
La fiducia è un contatore.
```)
]

A volte zero non è il punto di partenza giusto. La `calma` del protagonista, per
esempio, parte piena e cala man mano che la casa svela ciò che nasconde: la
dichiari con un valore iniziale.

#sintassi[
  `[contatore] parte da [numero].`
]

#esempio[
#fav(```
La calma è un contatore.
La calma parte da 3.
```)
]

#nota[
  Se il nome è plurale, concorda pure il verbo: `Le vite sono un contatore.` e `Le
  vite partono da 3.` sono forme valide quanto il singolare. Scrivi quella che suona
  naturale — `Gli indizi è un contatore.` o `Gli indizi sono un contatore.`: FAVELLA
  accetta entrambe.
]

== Confrontare un contatore

Il bello di un numero è che lo puoi confrontare. FAVELLA mette a disposizione
tutta la scala, da usare nelle condizioni:

#sintassi[
  `se [contatore] è [N]` — esattamente N \
  `se [contatore] non è [N]` — diverso da N \
  `se [contatore] è almeno [N]` — maggiore o uguale \
  `se [contatore] è al massimo [N]` — minore o uguale \
  `se [contatore] è più di [N]` — strettamente maggiore \
  `se [contatore] è meno di [N]` — strettamente minore
]

#nota[
  Al posto del numero fisso `N` puoi mettere il valore di un altro contatore,
  scritto fra parentesi quadre: `se la vita è meno di [soglia]`. Così confronti due
  grandezze fra loro, non più un contatore contro una costante. È l'idea che il
  capitolo «Il caso e le quantità» sviluppa per intero — lì i numeri imparano a
  parlarsi.
]

La Casa li usa per far maturare gli eventi: certe rivelazioni si sbloccano solo
quando hai raccolto abbastanza indizi, e la tensione monta quando la calma scende
sotto una soglia.

#esempio[
#fav(```
Quando gli indizi è almeno 4 diventa vera: dire "(Per un attimo i pezzi stanno insieme da soli: le lettere chiuse, le mensilità mai cessate, la valigia mai partita. Manca solo un nome.)".
Quando la calma è meno di 1 diventa vera: dire "Ti accorgi che le mani ti tremano. Non è freddo: è che questa casa ha smesso di essere una casa.".
```)
]

(Le frasi `Quando … diventa vera` sono *demoni*, sentinelle che sorvegliano una
condizione da sole: li costruiremo nel loro capitolo. Qui ci interessano i
confronti che contengono.)

== Far parlare i numeri: l'interpolazione

Uno stato o un contatore non resta chiuso nella logica: puoi mostrarne il valore
dentro qualunque testo, scrivendone il nome fra parentesi quadre. A gioco avviato,
FAVELLA sostituisce il segnaposto con il valore corrente.

#esempio[
#fav(```
Invece di ricorda se la verità è svelata: dire "Hai messo insieme [indizi] frammenti, e bastano.".
```)
]

Se al momento giusto il contatore vale quattro, il giocatore leggerà «Hai messo
insieme 4 frammenti, e bastano». La stessa interpolazione funziona nelle
descrizioni, nelle risposte delle regole, nelle battute dei personaggi: ovunque ci
sia un testo fra virgolette.

== Uno stato che ne ricalca un altro

Finora il valore di uno stato lo hai sempre scritto a mano: `la verità è svelata`,
`il meteo è sereno`. Certe volte, però, il valore giusto è «quello di un altro
stato», e non lo conosci in anticipo. Per questo uno stato può prendere il valore
di un altro, e due stati si possono confrontare fra loro.

#sintassi[
  `[stato] diventa [altro stato].` — copia il valore
]

In una storia di appuntamenti, per esempio, puoi tenere uno stato `corteggiato` che
ricorda chi sta in cima alle preferenze del giocatore:

#esempio(da: "forma disponibile")[
#fav(```
e adesso il corteggiato diventa il preferito.
```)
]

Da quel momento `corteggiato` vale esattamente quanto vale `preferito`: se più
avanti cambi `preferito`, `corteggiato` resta com'era — la copia avviene una volta,
nel momento in cui la scrivi, non si aggancia per sempre.

Per confrontare due stati, invece, c'è `è come`:

#sintassi[
  `se [stato] è come [altro stato]` — stesso valore \
  `se [stato] non è come [altro stato]` — valore diverso
]

#tranello[
  Il `come` non è un vezzo: senza, `se il corteggiato è il preferito` sarebbe
  ambiguo — FAVELLA non saprebbe se `il preferito` è un altro stato con cui
  confrontare o la parola-valore `preferito`. Il `come` toglie il dubbio, e va
  scritto sempre.
]

#nota[
  Questa forma «nuda» vale fra due *stati*. Per i contatori il valore di un altro
  contatore si scrive fra parentesi quadre, `[nome]` (lo hai visto poco sopra, nei
  confronti): è più preciso, e lo riprende il capitolo «Il caso e le quantità».
  Mischiare i due — uno stato di qua, un contatore di là — non funziona, e FAVELLA
  te lo dice indicando la forma giusta.
]

== Stati che si calcolano da soli

A volte uno stato non va impostato da nessuno: è il riassunto di altre cose. «La
protezione è attiva quando l'aria scende sotto 30 e la fuga non è cominciata» si
scrive così, una volta sola:

#esempio(da: "un esempio")[
#fav(```
La protezione è attiva quando l'aria è meno di 30 e la fuga è lontana.
La protezione è spenta quando la fuga è vicina.
Invece di ascolta le voci se la protezione è attiva: dire "La tuta copre ogni suono.".
La descrizione del visore è "[se la protezione è attiva]Luce rossa.[altrimenti]Luce verde.[fine]".
```)
]

Lo stato *calcolato* si legge come ogni altro stato — `se la protezione è attiva`,
`se la protezione non è attiva`, `[protezione]` in un testo, un demone `Quando la
protezione è attiva` — ma non si dichiara e non si assegna: il suo valore è quello
della prima frase la cui condizione è vera, e se nessuna è vera non ne ha. Così la
stessa soglia non va riscritta in venti regole, e non può capitare di scriverla in
due modi diversi.

#nota[
  Il compilatore avvisa quando uno stato o un contatore *cambia ma nessuno lo legge*:
  di solito è un residuo, o un nome sbagliato. Se a leggerlo è l'interfaccia di un
  gioco (un visore che mostra l'aria, un suono), aggiungi `(voluto)` alla
  dichiarazione: `L'aria è un contatore (voluto).`, e l'avviso sparisce.
]

== Numeri negativi, in lettere, e un po' di aritmetica

Dalla versione 1.3 un contatore può partire sotto zero (`La temperatura parte da
-5.`), e dove si scrive un numero di turni, di spazi o di oggetti vanno bene anche i
numeri in lettere, da `zero` a `venti` e le decine fino a `cento` (`Ogni tre turni`,
`Il giocatore può portare cinque oggetti.`; ma non `un`, `uno`, `una`, che sono già
parole del linguaggio: scrivi `1 oggetto`). Oltre ad `aumenta` e `diminuisci`, le
conseguenze sanno:

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Conseguenza*], [*Effetto*]),
  [`moltiplica la forza per 2`], [raddoppia],
  [`dividi la forza per 3`], [divisione intera (7 diviso 3 fa 2)],
  [`riduci l'ora modulo 24`], [il resto della divisione: un orologio che ricomincia],
  [`la forza resta fra 0 e 10`], [riporta il valore nell'intervallo],
)

*Il turno* si legge come un contatore, senza dichiararlo: `se il turno è almeno 20`
nelle condizioni, `[turno]` nei testi. Non si può cambiare.

== Un limite che si applica da solo

L'ultima riga della tabella, `la forza resta fra 0 e 10`, è una *conseguenza*:
riporta il valore nell'intervallo una volta sola, nel punto in cui la scrivi, e va
richiamata a mano dopo ogni modifica — dimenticarla lascia il contatore scendere
sotto zero o sfondare il massimo. Dalla versione 1.6 lo stesso limite si può
*dichiarare una volta per tutte*, e il motore lo fa rispettare da sé.

#sintassi[
  `[contatore] resta sempre fra [A] e [B].`
]

#esempio(da: "un esempio")[
#fav(```
La sete resta sempre fra 0 e 100.
Il vigore resta sempre fra 0 e [soglia massima].
```)
]

La parola che fa la differenza è `sempre`. Da quel momento qualunque cosa muova la
`sete` — un `aumenta`, un `diminuisci`, un `diventa`, una moltiplicazione, perfino
il valore con cui parte — la riporta automaticamente fra 0 e 100: non puoi più
uscire dall'intervallo, e non devi ricordartene a ogni regola. Gli estremi sono un
numero fisso oppure il valore di un altro contatore fra parentesi quadre (`[soglia
massima]`), letto nell'istante della modifica.

#nota[
  L'invariante vale solo per i *contatori*, non per gli stati a parole, e i suoi
  estremi devono essere numeri o contatori: se provi a limitare uno stato, o a usare
  come estremo qualcosa che non è un contatore, FAVELLA te lo dice con gentilezza.
  Come tutto il resto del mondo, anche questo è catturato dalle istantanee: `annulla`
  riavvolge pure i valori riportati nell'intervallo.
]

#prova[
  Dichiara un contatore `passi` che parte da 0 e uno stato `meteo` che parte da
  `sereno`. Non farli ancora cambiare: prima impareremo a muovere i numeri e gli
  stati, nel capitolo sulle conseguenze.
]
