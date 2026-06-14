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
La verita è uno stato.
La verita è ignota.

Il temporale è uno stato.
Il temporale è lontano.
```)
]

I valori — `ignota`, `sospetta`, `svelata` per la verità — non si elencano in
anticipo: li introduci usandoli. Da quel momento puoi interrogare lo stato in una
condizione (`se la verita è svelata`, oppure `se la verita non è ignota`) e
cambiarlo con una conseguenza (`e adesso la verita è svelata`), che vedremo a
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
Invece di ricorda se la verita è svelata: dire "Hai messo insieme [indizi] frammenti, e bastano.".
```)
]

Se al momento giusto il contatore vale quattro, il giocatore leggerà «Hai messo
insieme 4 frammenti, e bastano». La stessa interpolazione funziona nelle
descrizioni, nelle risposte delle regole, nelle battute dei personaggi: ovunque ci
sia un testo fra virgolette.

#prova[
  Dichiara un contatore `passi` che parte da 0 e uno stato `meteo` che parte da
  `sereno`. Non farli ancora cambiare: prima impareremo a muovere i numeri e gli
  stati, nel capitolo sulle conseguenze.
]
