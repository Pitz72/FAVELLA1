#import "../lib/manuale-template.typ": *

= Buio e luce

Non tutte le stanze sono illuminate. Una cantina senza finestre, una soffitta di
notte, una grotta: posti dove, senza una fiamma in mano, non si vede nulla. FAVELLA
sa rappresentare il buio come una vera regola del mondo, non solo come una frase
nella descrizione.

== Una stanza al buio

#sintassi[
  `[Stanza] è buia.`
]

Dichiari che una stanza è buia, e da quel momento il giocatore che vi entra senza
una fonte di luce non vede più niente: né la descrizione, né gli oggetti, né le
uscite.

#esempio[
#fav(```
# Forma disponibile (la Casa non la usa, ma è perfettamente valida):
La cantina è buia.
```)
]

Al posto della descrizione, chi entra legge soltanto:

#esempio(da: "in gioco")[
#fav(```
È buio pesto.
```)
]

Una cosa importante: il buio toglie la *vista*, non il movimento. Il giocatore può
ancora muoversi nelle direzioni che già conosce — uscire alla cieca da dove è
entrato, per esempio — ma finché resta al buio non può esaminare, prendere, posare
o lasciare alcunché. Per quelle azioni serve luce.

== Fare luce

La luce la porta un oggetto. Gli dài la capacità di illuminare, e da quel momento
rischiara la stanza buia in cui si trova.

#sintassi[
  `[Oggetto] illumina.`
]

#esempio[
#fav(```
# Forma disponibile:
La torcia è una cosa.
La torcia è prendibile.
La torcia illumina.
```)
]

Perché la cantina si veda, basta che una fonte accesa sia *raggiungibile*: in mano
al giocatore, posata nella stanza, oppure dentro un contenitore aperto o su un
supporto. Un oggetto luminoso, del resto, si vede da sé: una torcia accesa lasciata
a terra in una cantina buia la rischiara comunque.

== Una torcia che si accende e si spegne

Una torcia che `illumina` e basta è *sempre* accesa: comoda, ma poco interessante.
Per darle un interruttore, combina la capacità con una coppia di stati opposti —
proprio le proprietà a due valori del capitolo sei. Una fonte che illumina ma è
`spenta` non fa luce; accendila, e torna a illuminare.

#esempio[
#fav(```
# Forma disponibile:
La torcia illumina.
La torcia è spenta.
Invece di usa torcia: dire "Premi l'interruttore: un cono di luce taglia il buio." e adesso la torcia è accesa.
```)
]

Finché la torcia è spenta, la cantina resta nera; dopo `usa torcia` diventa accesa,
e la stanza si rivela. Spegnerla di nuovo — con un'altra regola, o come conseguenza
di un evento — la riporta nel buio.

#tranello[
  La luce deve essere *raggiungibile*. Una torcia accesa chiusa dentro un baule non
  illumina niente: il contenitore chiuso la nasconde, e finché non lo apri è come se
  la torcia non ci fosse. Lo stesso vale per una fonte lasciata in un'altra stanza.
]

#nota[
  Le tue regole hanno sempre l'ultima parola. Se scrivi un `Invece di esamina ...`
  per una stanza buia, scatta quello prima del messaggio automatico «È buio pesto.»:
  puoi così raccontare il buio con parole tue, o lasciare che il giocatore tasti
  comunque un oggetto al tatto.
]

#prova[
  Rendi `buia` la cantina della Casa e dài alla torcia `illumina` e lo stato `spenta`.
  Scendi in cantina senza accenderla: solo buio. Risali, accendi la torcia con una
  regola, torna giù: adesso la stanza c'è tutta.
]
