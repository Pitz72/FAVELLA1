#import "../lib/manuale-template.typ": *

= Le relazioni

Fin qui il mondo è fatto di cose che *sono* in un certo modo — una porta chiusa, un
contatore a tre — o che *stanno* in un certo posto. Manca un modo per dire come le
cose, e le persone, stiano *fra loro*: chi si fida di chi, quale chiave apre quale
porta, chi ha fatto una promessa a chi. Dalla versione 1.6 FAVELLA ha le *relazioni*:
legami nominati fra due parti, che dichiari, asserisci e interroghi come il resto del
mondo.

Sono ispirate alle _relations_ di Inform 7, un altro linguaggio di narrativa, ed è la
prima volta che FAVELLA le possiede. In questa versione sono uno strumento *d'autore*:
le scrivi tu e le leggi nelle condizioni, ma non è ancora il giocatore a crearle con un
comando.

== Dichiarare una relazione

Una relazione ha un *nome d'uso* — la locuzione con cui la scriverai nelle frasi, fra
virgolette — e un'*arietà*, che dice quante parti può legare su ciascun lato.

#sintassi[
  `"[locuzione]" è una relazione [arietà].`

  L'arietà è una fra `uno a uno`, `uno a molti`, `molti a molti`.
]

#esempio(da: "un esempio")[
#fav(```
"si fida di" è una relazione molti a molti.
"apre" è una relazione uno a molti.
"conosce" è una relazione molti a molti ed è reciproca.
```)
]

L'arietà non è un vezzo: tiene il mondo coerente. In una relazione `uno a uno` ogni
parte sta in coppia con una sola altra, e asserirne una nuova sfratta la precedente;
`uno a molti` tiene un solo soggetto per ciascun oggetto; `molti a molti` non pone
limiti. La coda `ed è reciproca` (o `ed è reciproco`) dice che il legame vale nei due
versi: se il giocatore conosce Bruno, Bruno conosce il giocatore, senza che tu lo
scriva due volte.

== Asserire e cambiare i legami

Una relazione dichiarata si *asserisce* con una frase piana, che nomina le due parti e
in mezzo la locuzione. Le parti sono il giocatore oppure un'entità della storia (anche
una stanza, come la cella che una chiave apre).

#sintassi[
  `[Il giocatore / l'entità] [locuzione] [il giocatore / l'entità].`
]

#esempio(da: "un esempio")[
#fav(```
Il giocatore si fida di Saverio.
La chiave di ottone apre la cella.
```)
]

Nelle regole i legami si creano e si disfano come conseguenze, con `e adesso`:

#esempio(da: "un esempio")[
#fav(```
Invece di parla con Vito se la verità è svelata: dire "Vito annuisce lento." e adesso il giocatore si fida di Vito.
Invece di accusa Vito: dire "Il volto gli si chiude." e adesso il giocatore non si fida più di Vito.
```)
]

La forma negativa è `non [locuzione] più`: toglie la coppia, se c'è. Anche questi
legami fanno parte dello stato del mondo, quindi `annulla` li riavvolge come ogni altra
cosa.

== Interrogare un legame

Nelle condizioni chiedi se un legame preciso esiste, oppure se *qualcuno* (o
*qualcosa*) è in relazione con una parte. Ogni forma ha la sua negazione.

#sintassi[
  `se [il giocatore] [locuzione] [Saverio]` — quella coppia precisa \
  `se qualcuno [locuzione] [il giocatore]` — esiste almeno un soggetto \
  `se il giocatore non [locuzione] [Saverio]` — quella coppia non c'è
]

#esempio(da: "un esempio")[
#fav(```
Invece di entra nella cella se la chiave di ottone apre la cella: dire "La chiave gira di scatto." e adesso la cella è aperta.
Invece di esci se qualcuno si fida del giocatore: dire "Non puoi andartene: qualcuno conta su di te.".
```)
]

#nota[
  Le parole `qualcuno` e `qualcosa` valgono *solo nelle domande*: chiedono «esiste una
  parte in questa relazione?». In un'asserzione non hanno senso — chi, di preciso? — e
  FAVELLA te lo fa notare con gentilezza.
]

== Dire chi è in relazione

Un legame si può anche mostrare al giocatore. Il segnaposto `[chi [locuzione] [parte]]`,
in qualunque testo, rende l'elenco — concordato, con la «e» finale — dei soggetti in
relazione con quella parte:

#esempio(da: "un esempio")[
#fav(```
La descrizione dello specchio è "Nel vetro vedi i volti di chi ti è rimasto accanto: [chi si fida del giocatore].".
```)
]

Se a fidarsi sono Saverio e Vito, il giocatore legge «Saverio e Vito»; se non c'è
nessuno, legge «nessuno». È l'unico posto in cui una relazione «parla» da sola.

#tranello[
  La locuzione finisce spesso con una preposizione (`si fida di`): scrivila per intero
  nella dichiarazione e nelle frasi, e lascia che FAVELLA componga l'articolo giusto —
  `di` + `il giocatore` diventa `del giocatore`. Anche la forma piana `di il giocatore`
  va bene: non devi indovinare l'articolazione.
]

#prova[
  Dichiara una relazione `"deve un favore a"` fra personaggi, asseriscine un paio
  all'inizio e poi, con una regola, falla cambiare quando il giocatore aiuta qualcuno.
  Mostra in una battuta `[chi deve un favore al giocatore]` e controlla che l'elenco si
  aggiorni partita durante.
]
