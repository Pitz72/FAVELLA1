#import "../lib/manuale-template.typ": *

= Il tempo: gli eventi a turni

Finora tutto ciò che accade nella Casa parte da un'azione del giocatore. Ma il
tempo passa anche quando lui esita, e una storia viva deve poter muoversi da sola.
FAVELLA conta i turni — un turno per ogni comando — e ti lascia agganciare eventi
a quel conteggio.

== Un evento a un turno preciso

#sintassi[
  `Al turno [N]: dire "[testo]" e adesso [conseguenza].`
]

Scatta una volta sola, quando il contatore dei turni raggiunge N. Nella Casa è
così che arriva il temporale: prima un tuono lontano, poi la pioggia vera.

#esempio[
#fav(```
Al turno 4: dire "Sui colli si sente un tuono basso. Vento alle imposte." e adesso il temporale è vicino.
Al turno 8: dire "Comincia a piovere forte. La grondaia ha un buco da anni, si sente." e adesso il temporale è scoppiato.
```)
]

Le conseguenze funzionano come in una regola: qui ogni evento sposta lo stato
`temporale` di un gradino, e quei cambiamenti, a loro volta, accendono le
descrizioni alternative delle stanze che hai scritto nel capitolo sulle stanze.

== Un evento che si ripete

#sintassi[
  `Ogni [N] turni: dire "[testo]" e adesso [conseguenza].`
]

Scatta ogni N turni, all'infinito. Serve per il battito di fondo, le cose che
tornano. Nella Casa è l'orologio fermo che, ogni tanto, ricorda di esserlo:

#esempio[
#fav(```
Ogni 5 turni: dire "L'orologio batte ma il pendolo no: si è fermato alle quattro e ventidue.".
```)
]

Anche senza conseguenze, come qui, un evento ripetuto fa atmosfera: tiene presente
che il tempo scorre e che la casa, intorno a te, non è immobile.

#nota[
  Vale anche il contrario: se c'è una conseguenza, puoi *omettere* il `dire`. È il
  caso del battito silenzioso — un conteggio che scende senza dirlo a nessuno:
  #fav(```
# Forma disponibile:
Ogni 3 turni: diminuisci il carburante.
```)
  L'unica regola è che qualcosa ci sia: una battuta, una conseguenza, o entrambe. Lo
  stesso vale per i demoni del prossimo capitolo.
]

#tranello[
  `Al turno N` e `Ogni N turni` si somigliano ma sono opposti: il primo accade una
  volta, il secondo a ripetizione. Attento a non scrivere `Ogni 8 turni` quando
  intendevi `Al turno 8`, o un evento che doveva essere unico tornerà a ogni giro.
]

== Guardare non costa tempo

Ogni comando che agisce fa passare un turno, anche `esamina` e `inventario`. In una
storia a tempo, a volte, è un prezzo che non vuoi far pagare: controllare quanta aria
resta non dovrebbe consumare aria. Una frase per verbo lo cambia:

#esempio(da: "un esempio")[
#fav(```
"esamina" non fa passare il tempo.
"inventario" non fa passare il tempo.
```)
]

Vale per il verbo e per i suoi sinonimi (`guarda il visore`, `x il visore`), e anche
per le tue regole su quel verbo, purché si limitino a dire qualcosa: una regola che
cambia il mondo fa passare il turno lo stesso. Si può dire dei verbi che guardano
(esamina, guarda, inventario, ascolta, annusa, tocca) e dei verbi tuoi. Parlare con un
personaggio, invece, non consuma mai turni.

== Un conto alla rovescia che parte da un fatto

`Al turno N` e `Ogni N turni` contano dall'inizio della partita. Per un tempo che
parte da un fatto (la miccia accesa, la porta chiusa alle spalle) c'è una terza
forma:

#esempio(da: "un esempio")[
#fav(```
Tre turni dopo che la miccia è accesa: dire "La dinamite esplode." e adesso perdi.
```)
]

Quando la condizione diventa vera parte il conto; tre turni dopo, la frase scatta,
una volta sola. `annulla` riporta indietro anche il conto.

#prova[
  Aggiungi un `Al turno 12` che faccia bussare qualcuno alla porta dell'ingresso, e
  un `Ogni 3 turni` che faccia scricchiolare il parquet. Gioca una dozzina di turni
  e osserva quando compaiono.
]
