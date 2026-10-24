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

== Il posto iniziale

Quando entri in una stanza, FAVELLA elenca da sé quello che c'è: «Puoi vedere qui:
una mappa, un coltello.». Funziona, ma è un elenco da inventario, non una pagina di
racconto. Viene allora la tentazione di scrivere gli oggetti dentro la descrizione
della stanza — «Su un mobile, una mappa piegata della provincia» — ed è lì che la
storia si incrina: il giocatore prende la mappa, torna a guardare, e la mappa è
ancora sul mobile.

La soluzione è dare all'oggetto il suo *posto*: una frase che lo presenta finché
sta dove l'hai messo tu.

#sintassi[
  `Il posto di/del/della/... [oggetto] è "[testo]".`
]

#esempio[
#fav(```
La mappa è una cosa.
La mappa è prendibile.
La mappa è in casa.
Il posto della mappa è "Su un mobile, una MAPPA piegata della provincia.".
```)
]

Finché la mappa non è mai stata spostata, entrando in casa il giocatore legge la
descrizione della stanza e subito sotto la frase del posto; la mappa non compare
in «Puoi vedere qui». Se nella stanza ci sono più oggetti al loro posto, le frasi
si susseguono in un solo capoverso: scrivile quindi ciascuna completa («Sul
sedile, un DIARIO…», non «Accanto, un DIARIO…»), perché ognuna deve reggersi
anche quando le altre non ci sono più. Appena la prende (o una tua regola la
sposta) la frase sparisce per sempre: se la riposa, anche nello stesso punto, la
mappa torna nell'elenco normale, perché la tua frase non sarebbe più vera.
ANNULLA rimette tutto com'era.

#nota[
  Il posto vale per gli oggetti collocati *direttamente* in una stanza. Dentro un
  contenitore o sopra un supporto la frase non verrebbe mai mostrata, e FAVELLA te
  lo segnala con un avviso. Le stanze non hanno un posto: per loro c'è la
  descrizione.
]

== Oggetti di scena e oggetti ovunque

Certe cose esistono solo per essere guardate: il cielo, i muri, una finestra
murata. Dichiarale *di scena*: si esaminano, ma non compaiono in «Puoi vedere qui»
e `prendi tutto` le lascia stare.

#sintassi[
  `[Oggetto] è di scena.` \
  `[Oggetto] è anche in [stanza].`
]

La seconda frase mette lo stesso oggetto in più stanze: il cielo sopra il cortile
e sopra l'orto, una porta vista dai due lati. Un oggetto presente in più stanze
e prendibile sparisce da tutte quando lo si prende: FAVELLA te lo ricorda con un
avviso.

#esempio(da: "un esempio")[
#fav(```
Il cielo è una cosa.
Il cielo è nel cortile.
Il cielo è anche nell'orto.
Il cielo è di scena.
La descrizione del cielo è "Nuvole basse, color piombo.".
```)
]

== Oggetti contabili

Certe cose esistono in *più copie*: pozioni in una sacca, frecce in una faretra,
monete in un borsello. Dichiararne una per una sarebbe assurdo; quello che vuoi dire
è «questa cosa si conta». Dalla versione 1.6 un oggetto può essere *contabile*.
L'italiano non fa i plurali da sé in modo affidabile, così il plurale lo dai tu, una
volta sola:

#sintassi[
  `[La cosa], plurale "[plurale]", è contabile.`
]

#esempio(da: "un esempio")[
#fav(```
La pozione, plurale "pozioni", è contabile.
La freccia, plurale "frecce", è contabile.
```)
]

Un contabile è una *cosa semplice*: non può essere anche un contenitore, un
supporto, un personaggio o una fonte di luce. Da qui in poi `pozioni` vale come nome
dell'oggetto quanto `pozione`, sia nelle tue frasi sia nei comandi del giocatore.

Una collocazione normale — `La pozione è in cella.`, `Il giocatore ha la pozione.` —
mette *una* copia. Per fissarne di più, in inventario o in un luogo, ci sono due
frasi apposta:

#sintassi[
  `Il giocatore ha [N] [plurale].` \
  `Ci sono [N] [plurale] in [luogo].`
]

#esempio(da: "un esempio")[
#fav(```
Il giocatore ha 3 pozioni.
Ci sono 5 frecce in la faretra.
Ci sono 2 pozioni in la gola.
```)
]

Il luogo è una stanza o un contenitore. Le quantità fanno parte dello stato del
mondo: `annulla` le riavvolge come tutto il resto.

È la prima cosa del linguaggio che il *giocatore* vede cambiare nel vivo della
partita. Con un contabile può muovere più copie in un gesto solo:

#table(
  columns: (auto, 1fr),
  stroke: 0.4pt + c.rule,
  inset: 6pt,
  align: (left + top, left + top),
  table.header([*Comando*], [*Effetto*]),
  [`prendi 2 pozioni`], [prende due copie],
  [`prendi una pozione`], [una sola (il numero, se manca, vale 1)],
  [`prendi tutte le pozioni`], [tutte le copie raggiungibili],
  [`lascia 2 pozioni`], [posa due copie nella stanza],
  [`consuma una pozione`], [fa sparire una copia dall'inventario],
)

La stanza, l'inventario e i contenitori contano le copie e le dicono concordate:
«Puoi vedere qui: 3 pozioni.», «1 pozione». Ai fini della capienza un contabile pesa
*un posto solo*, quante che siano le copie. Il verbo `consuma` è nuovo del motore e,
come gli altri, cede il passo a un tuo comando con lo stesso nome.

#nota[
  Il plurale che dichiari serve a due cose: concordare gli elenchi («3 frecce», «1
  freccia») e capire il giocatore quando scrive il plurale. Scrivilo come lo diresti
  ad alta voce — `"pozioni"`, `"frecce"`, `"monete"` — e vale per sempre. Le
  condizioni sulle scorte («se ne ho abbastanza», «se sono finite») le vedrai nel
  capitolo «Il caso e le quantità».
]

#prova[
  Crea in cucina un oggetto `straccio`, rendilo prendibile e dàgli una descrizione.
  Poi entra in cucina, esaminalo e prendilo: se compare nell'inventario, l'hai
  dichiarato bene. Infine dàgli un posto («Sul lavello, uno STRACCIO strizzato.») e
  guarda come cambia la stanza prima e dopo averlo preso.
]
