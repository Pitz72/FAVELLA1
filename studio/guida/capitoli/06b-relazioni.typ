#import "../lib/guida.typ": *

= Mondo: le relazioni

Dalla versione 1.6 del linguaggio due parti della storia — due personaggi, il
giocatore e una chiave, una chiave e una porta — possono stare in una *relazione*
nominata: «si fida di», «apre». La sezione #ui[Mondo] ha per questo la linguetta
#ui[Relazioni], fra #ui[Oggetti] e #ui[Mappa]. Il *Manuale di Programmazione* di
FAVELLA spiega a che cosa servono le relazioni; qui si vede come costruirle senza
scrivere.

#nota[
  Le relazioni sono uno strumento *d'autore*: le dichiari e le leggi nelle regole, ma
  non è (ancora) il giocatore a crearle giocando. La griglia mostra le *coppie
  scritte* nel testo, non la loro chiusura: il rovescio di una relazione reciproca e
  gli sfratti dell'arietà non compaiono come righe doppione.
]

== La griglia

Ogni relazione è un riquadro con la sua *locuzione* in alto, l'*arietà* — #ui[uno a
uno], #ui[uno a molti] o #ui[molti a molti] — e, se c'è, #ui[Reciproca]. Sotto, le
coppie «soggetto → oggetto» che hai scritto: per «si fida di», per esempio, «il
giocatore → Saverio». La #ui[×] su una coppia la toglie; il cestino in alto elimina
la relazione e tutte le sue coppie. Se non ne hai ancora dichiarate, il pannello dice
#ui[Nessuna relazione ancora].

== Aggiungere una coppia, creare una relazione

Sotto ogni relazione, due menu scelgono i due membri — #ui[il giocatore] e ogni
entità o stanza della storia — e #ui[Aggiungi la coppia] la scrive. #ui[Una relazione
nuova] apre una finestra con la #ui[Locuzione] (per esempio «si fida di»), l'#ui[Arietà]
e la casella #ui[Reciproca]; confermala, e la relazione compare vuota, pronta a
ricevere le coppie.

#consiglio[
  L'#ui[Arietà] non è un dettaglio: #ui[uno a uno] tiene una coppia per lato, #ui[uno
  a molti] un solo soggetto per ogni oggetto, #ui[molti a molti] non pone limiti.
  Aggiungere una coppia che va contro l'arietà ne sfratta un'altra: la griglia
  riflette sempre quello che il motore terrebbe davvero.
]

Come per gli altri pannelli, ogni modifica rigenera la frase `.fav` corrispondente e
la inserisce nel testo: la griglia è una vista, il testo resta la fonte di verità.
