#import "../lib/manuale-template.typ": *

= Gli oggetti

Una stanza vuota si visita una volta sola. Sono gli oggetti a darti qualcosa da
fare: una torcia da accendere, una leva da impugnare, lettere da leggere o da
bruciare. In FAVELLA un oggetto si crea come una stanza, con una frase, e poi lo
si colloca nel mondo.

== Creare un oggetto

#sintassi[
  `[Nome dell'oggetto] è una cosa.`
]

«Cosa» è la parola generica per qualunque elemento con cui il giocatore può
interagire. Più avanti incontrerai parenti più specializzati — contenitori,
supporti, personaggi — ma la maggior parte di ciò che popola una storia è una
cosa.

#esempio[
#fav(```
Il portaombrelli è una cosa.
La torcia è una cosa.
Il flacone di medicine è una cosa.
```)
]

== Collocare un oggetto

Appena creato, un oggetto non sta da nessuna parte. Per metterlo in scena gli dài
una posizione.

#sintassi[
  `[oggetto] è in/nel/nella/... [stanza].`
]

La preposizione si accorda con la stanza, come quando parli: *in* ingresso, *in*
cucina, *nel* giardino.

#esempio[
#fav(```
Il portaombrelli è una cosa.
Il portaombrelli è prendibile.
Il portaombrelli è in ingresso.
La descrizione del portaombrelli è "Ferro battuto, pesante. Dentro un ombrello mai aperto. Potrebbe fare da leva.".
```)
]

Tre righe sullo stesso portaombrelli: cos'è, dove si trova, com'è fatto. Le puoi
scrivere in qualunque ordine (te lo ricordi dal capitolo sull'anatomia della
frase), ma raggrupparle per oggetto rende il file molto più leggibile.

== Cominciare con qualcosa in tasca

A volte il giocatore non deve trovare un oggetto: ce l'ha già dall'inizio. Un mazzo
di chiavi, un taccuino, la torcia che si è portato da casa. Invece di collocarlo in
una stanza, lo metti direttamente nell'inventario.

#sintassi[
  `Il giocatore ha [oggetto].`
]

#esempio[
#fav(```
# Forma disponibile:
La torcia è una cosa.
La torcia è prendibile.
Il giocatore ha la torcia.
```)
]

L'oggetto dev'essere già dichiarato (se citi una cosa che non esiste, FAVELLA te lo
segnala) e la frase, come le altre, la puoi scrivere dove preferisci nel file.

== Prendere o non prendere

C'è una riga che merita attenzione: `è prendibile`. Di norma gli oggetti *non*
si possono raccogliere — il tavolo del salotto resta dov'è, la porta della cantina
non te la metti in tasca. Solo ciò che dichiari esplicitamente prendibile finisce
nell'inventario del giocatore.

#sintassi[
  `[oggetto] è prendibile.`
]

#esempio[
#fav(```
La torcia è prendibile.
Le lettere è prendibile.
La chiave della cantina è prendibile.
```)
]

#tranello[
  Se il giocatore prova a prendere qualcosa che non hai reso prendibile, FAVELLA
  glielo impedisce con un messaggio neutro. Quando un oggetto «non si lascia
  prendere» pur essendo importante, controlla per prima cosa di non aver
  dimenticato la riga `è prendibile`.
]

== Descrivere un oggetto

Vale quanto detto per le stanze: la descrizione è ciò che il giocatore legge
quando esamina l'oggetto, la preposizione si accorda, e anche qui puoi avere una
versione che cambia con lo stato del mondo.

#esempio[
#fav(```
La descrizione della torcia è "Una di quelle torce a manovella che teneva accanto al letto. Vernice rossa, mezza pelata.".
La descrizione della torcia se la torcia è accesa è "Il fascio è giallo e tremante, ma tiene.".
```)
]

Spenta o accesa, la stessa torcia racconta due cose diverse. Per farlo ci serviva
una proprietà — `accesa`, `spenta` — ed è proprio l'argomento del prossimo
capitolo.

#prova[
  Crea in cucina un oggetto `straccio`, rendilo prendibile e dàgli una descrizione.
  Poi entra in cucina, esaminalo e prendilo: se compare nell'inventario, l'hai
  dichiarato bene.
]
