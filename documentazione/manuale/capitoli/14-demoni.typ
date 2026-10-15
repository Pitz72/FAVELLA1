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

Scatta nell'istante in cui la condizione passa da falsa a vera: sul
_passaggio_, non a ogni turno in cui resta vera. È fatto per le soglie e le
scoperte, il momento in cui un conto raggiunge un limite.

#esempio[
#fav(```
Quando gli indizi è almeno 4 diventa vera: dire "(Per un attimo i pezzi stanno insieme da soli: le lettere chiuse, le mensilità mai cessate, la valigia mai partita. Manca solo un nome.)".
Quando la calma è meno di 1 diventa vera: dire "Ti accorgi che le mani ti tremano. Non è freddo: è che questa casa ha smesso di essere una casa, e tu vuoi solo finire e andartene.".
```)
]

Il primo demone fa il punto degli indizi appena ne hai raccolti abbastanza; il
secondo coglie il momento esatto in cui la calma crolla. Tutti e due parlano e
poi tacciono finché la condizione resta vera nei turni seguenti.

Se però la condizione torna falsa e poi di nuovo vera, il demone scatta di
nuovo: ogni passaggio è un passaggio. Con i contatori che salgono soltanto non
succede mai, ma con una stanza sì. Un demone che dice
`Quando il giocatore è nell'orto:` parla _ogni volta_ che il giocatore rientra
nell'orto. Per un evento che deve accadere una volta sola, guardalo con uno
stato:

#esempio[
#fav(```
La visita è uno stato.
La visita è nuova.
Quando il giocatore è nell'orto e la visita è nuova: dire "Tra i filari c'è ancora il segno della carriola." e adesso la visita è fatta.
```)
]

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

== Una volta sola

Un demone `Quando` scatta ogni volta che la sua condizione torna vera. Se deve
scattare una volta sola in tutta la partita, aggiungi `per la prima volta`:

#esempio(da: "un esempio")[
#fav(```
Quando il giocatore è nello studio per la prima volta: dire "Odore di carta e di tabacco.".
```)
]

== Appena entri: `Quando il giocatore entra in`

Il demone guarda la fine del turno: quando scatta, la stanza in cui sei entrato è già
stata descritta. Per far succedere qualcosa *all'arrivo*, prima della descrizione,
c'è una frase apposta:

#esempio(da: "un esempio")[
#fav(```
Quando il giocatore entra nella cantina se la torcia è spenta: dire "Inciampi nel primo gradino." e adesso diminuisci il coraggio.
Quando il giocatore entra nell'orto per la prima volta: dire "La luce ti abbaglia.".
```)
]

Vale per ogni arrivo, con un movimento o portato da una regola. Se chiude la partita,
la stanza non viene descritta affatto: il finale arriva pulito.

== Demoni che guardano la fine del turno

I demoni si guardano uno alla volta, nell'ordine in cui li hai scritti: una soglia
scritta prima del demone che consuma l'aria se ne accorge solo al turno dopo, e le
voci che devono seguire un dialogo arrivano dopo il primo comando. Con una frase cambi
questo comportamento per tutta la storia:

#sintassi[
  `I demoni guardano la fine del turno.`
]

Allora un demone `Quando` vede lo stato di fine turno, qualunque sia l'ordine delle
frasi, e scatta anche appena si chiude un dialogo. Non è il comportamento predefinito
perché cambierebbe il ritmo delle storie già scritte.
