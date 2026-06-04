#import "../lib/manuale-template.typ": *

= I demoni

Gli eventi a turni reagiscono al *tempo*. Le regole reagiscono alle *azioni*. Ma a
volte vuoi che qualcosa scatti quando una *condizione* diventa vera, chiunque
l'abbia resa tale e in qualunque turno. È il compito dei *demoni*: sentinelle che,
a ogni turno, controllano una condizione e agiscono da sole.

== Le quattro forme dell'«if-then»

Vale la pena fermarsi un momento, perché ora hai in mano tutti i modi in cui
FAVELLA collega una condizione a una reazione:

#nota[
  *Innescato da un'azione*: `Invece di [azione] se [condizione]: …` — il «quando» è
  un verbo del giocatore.
  #linebreak()
  *Globale*: `Invece di [verbo] se [condizione]: …` senza oggetto — un verbo, più
  una condizione.
  #linebreak()
  *A tempo*: `Al turno N` / `Ogni N turni` — il «quando» è il numero di turno.
  #linebreak()
  *Autonomo (il demone)*: il «quando» è la sola condizione, senza verbo né turno
  fisso.
]

Le prime tre le conosci. Il demone è il pezzo che mancava.

== Il demone a livello

#sintassi[
  `Ogni turno se [condizione]: dire "[testo]" e adesso [conseguenza].`
]

Scatta a *ogni* turno in cui la condizione è vera, e torna a scattare finché resta
vera. È fatto per gli effetti continui: il veleno che consuma, la fame che cresce,
o — nella Casa — la pioggia che, una goccia dopo l'altra, logora la calma di chi
resta.

#esempio[
#fav(```
Ogni turno se il temporale è scoppiato: dire "Dal soffitto cade una goccia, poi un'altra. La casa, intorno a te, sembra disfarsi piano." e adesso diminuisci la calma.
```)
]

Da quando scoppia il temporale, ogni turno passato in casa toglie un punto di
calma. Non c'è un'azione che lo provochi: succede perché le condizioni ci sono.

== Il demone sul fronte di salita

#sintassi[
  `Quando [condizione] diventa vera: dire "[testo]" e adesso [conseguenza].`
]

Scatta *una volta sola*, nell'istante in cui la condizione passa da falsa a vera.
È fatto per le soglie e le scoperte: il momento in cui un conto raggiunge un
limite, e tu vuoi segnarlo una volta e non più.

#esempio[
#fav(```
Quando gli indizi è almeno 4 diventa vera: dire "(Per un attimo i pezzi stanno insieme da soli: le lettere chiuse, le mensilità mai cessate, la valigia mai partita. Manca solo un nome.)".
Quando la calma è meno di 1 diventa vera: dire "Ti accorgi che le mani ti tremano. Non è freddo: è che questa casa ha smesso di essere una casa, e tu vuoi solo finire e andartene.".
```)
]

Il primo demone fa il punto degli indizi appena ne hai raccolti abbastanza; il
secondo coglie il momento esatto in cui la calma crolla. Tutti e due parlano una
volta e poi tacciono, anche se la condizione resta vera nei turni seguenti.

#nota[
  La parte `diventa vera` si può anche sottintendere: `Quando la calma è meno di 1:
  …` significa la stessa cosa. Scriverla per esteso, però, rende più chiaro che
  quel demone scatta sul *passaggio*, non a ogni turno.
]

#tranello[
  Un demone sul fronte di salita non spara all'avvio se la condizione è già vera
  da subito: FAVELLA fotografa lo stato iniziale e considera quello il punto di
  partenza. Così non rischi un falso scatto al primo turno. I demoni vengono
  inoltre valutati a fine turno, dopo gli eventi a tempo, una volta ciascuno.
]

#prova[
  Aggiungi un demone a livello che, `Ogni turno se la torcia è accesa`, faccia
  scendere un contatore `batteria` (che parte, per esempio, da 10). Poi un demone
  `Quando la batteria è al massimo 0 diventa vera` che spenga la torcia. Hai appena
  costruito una torcia che si scarica.
]
