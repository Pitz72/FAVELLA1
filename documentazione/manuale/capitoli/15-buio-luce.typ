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

== Il buio che va e viene

Dichiarare `La cantina è buia.` fissa il buio *dall'inizio*: la cantina nasce nera e
tale resta, finché non porti una luce. Ma il buio può anche *calare in scena*, come
conseguenza di qualcosa che accade. La stessa parola che descrive una stanza la può
trasformare:

#sintassi[
  `[stanza] diventa buia` — cala il buio \
  `[stanza] diventa illuminata` (oppure `chiara`) — torna la luce
]

In una centrale, spegnere il generatore spegne tutto:

#esempio(da: "forma disponibile")[
#fav(```
Invece di spegni il generatore: dire "Le luci si spengono una a una. Resta solo il ronzio che si smorza." e adesso la sala macchine diventa buia.
```)
]

E un evento a tempo può riportare la luce — l'alba che entra, un interruttore che
qualcuno riarma altrove:

#esempio(da: "forma disponibile")[
#fav(```
Al turno 12: dire "La luce del mattino entra dalle assi sconnesse." e adesso la cantina diventa illuminata.
```)
]

Vale tutto ciò che già sai sul buio: una stanza diventata buia torna a nascondere
descrizione, oggetti e uscite, e una torcia accesa raggiungibile la rischiara
comunque. Cambia solo *quando* il buio compare — non più soltanto all'avvio, ma nel
momento che decidi tu.

#nota[
  `diventa buia` / `diventa illuminata` vale per le *stanze*. Le parole ammesse sono
  `buia` (anche `buio`, `buie`) per spegnere, `illuminata` o `chiara` per riaccendere:
  qualunque altra, su questo costrutto, è un errore, e FAVELLA ti indica le due
  giuste. Se il nome a sinistra è un oggetto invece di una stanza, te lo segnala.
]

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
