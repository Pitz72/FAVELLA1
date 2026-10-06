#import "../lib/guida.typ": *

= Prova: giocare la storia

La sezione #ui[Prova] è la tua storia, giocata. Il motore è lo stesso che userà chi la
riceve: se qui funziona, funziona anche là.

== Avviare la prova

#ui[Prova la storia], in alto (#tasto("F5")), compila la storia e ti porta qui, nella
stanza di partenza. Se sei già nella sezione #ui[Prova] senza una partita in corso, c'è
anche il pulsante #ui[Avvia la prova]. Se la storia ha degli errori la prova non parte:
la barra di stato e il pannello #ui[Problemi] ti dicono dove (capitolo 4).

#schermata("prova-presa.png",
  alt: "La sezione Prova: a sinistra il racconto dell'ingresso, il comando «prendi la torcia» e la risposta «Preso: la torcia.», sotto i pulsanti-verbo e il campo del comando; a destra la partita con contatori, stati, inventario e oggetti.",
  didascalia: [Una partita appena cominciata: il giocatore ha preso la torcia.])

== Il racconto e i comandi

A sinistra c'è il *racconto*: il titolo della stanza, quello che il giocatore legge, i
comandi che hai dato (preceduti da ›) e le risposte. In alto, il nome della stanza e il
turno.

Sotto c'è il campo #ui[Che cosa fai?]: scrivi un comando («esamina il tavolino», «vai a
nord», «parla con il notaio») e premi #tasto("Invio") o #ui[Invia].

== I pulsanti-verbo

Se la storia lo permette (capitolo 10), sotto il racconto ci sono i *pulsanti-verbo*, gli
stessi che vedrà chi gioca:

- #ui[Azioni]: i verbi (Esamina, Prendi, Apri, Usa…);
- #ui[Qui]: le cose che ci sono nella stanza;
- #ui[Con te]: quello che il giocatore porta;
- #ui[Uscite]: le direzioni, ciascuna con la stanza dove porta;
- e una riga con i comandi di sempre: #ui[Guarda], #ui[Inventario], #ui[Aspetta],
  #ui[Annulla], #ui[Salva], #ui[Carica].

Un verbo comincia la frase («Prendi…»), un oggetto la completa e il comando parte.
#ui[Annulla la frase] ricomincia da capo.

#schermata("pulsanti-frase.png",
  alt: "I pulsanti-verbo con la frase «Prendi…» in composizione.",
  didascalia: [La frase si compone toccando un verbo e poi un oggetto.])

L'interruttore #ui[Pulsanti], in alto, li nasconde per lasciare più spazio al racconto.
#ui[Ricomincia] riparte dall'inizio. #ui[Finestra a parte] apre il gioco in una finestra
sua, come lo vedrebbe chi riceve la storia; la partita è una sola, e se la riprendi qui
(#ui[Riprendi qui]) torna in questa sezione.

== Lo stato del mondo

A destra ci sono tre linguette.

#grid(
  columns: (1fr, 1fr, 1fr),
  column-gutter: 10pt,
  schermata("prova-partita.png", alt: "La linguetta Partita: contatori, stati, inventario e oggetti con il loro posto.", didascalia: [#ui[Partita]]),
  schermata("prova-mappa.png", alt: "La linguetta Mappa della prova: le stanze e dove si trova il giocatore.", didascalia: [#ui[Mappa]]),
  schermata("prova-passo.png", alt: "La linguetta Passo passo: turno 0 Inizio e turno 1 prendi la torcia, con «preso: La torcia».", didascalia: [#ui[Passo passo]], altezza: 52mm),
)

- #ui[Partita]: dove sei, il turno, i contatori e gli stati coi loro valori, l'inventario
  e tutti gli oggetti, ciascuno col suo posto e le sue proprietà (aperto, chiuso…).
- #ui[Mappa]: le stanze e dove si trova il giocatore adesso.
- #ui[Passo passo]: turno per turno, il comando dato e che cosa è cambiato («preso: La
  torcia»). È lo strumento giusto quando una regola non fa quello che ti aspetti.

== Fine partita, salvataggi

Quando la storia finisce, sopra il racconto compare l'esito — #ui[Hai vinto], #ui[Hai
perso] o #ui[La partita è finita] — con #ui[Gioca di nuovo].

#ui[Salva] e #ui[Carica], fra i pulsanti o scritti come comandi («salva mattina»,
«carica mattina»), funzionano come per chi gioca: mettono da parte la partita e la
riprendono esattamente dov'era. Nella finestra a parte ci sono anche due pulsanti per
salvare la partita in un file `.favsave` e ricaricarla un altro giorno: utile per provare
un finale senza rigiocare tutto da capo.

== Dare la storia a chi gioca

Dal menu #puntini, #ui[Esporta come pagina web giocabile…] crea un file `.html` solo, con
dentro la storia e il motore vero. Si apre in qualunque browser, anche sul telefono:
è quello che mandi a chi deve giocare. Chi gioca non installa niente; la prima volta che
apre la pagina serve la rete, per scaricare l'interprete Python che fa girare il motore
nel browser.
