#import "../lib/guida.typ": *

= Regole, eventi e demoni

Le regole dicono che cosa succede. La sezione #ui[Regole] ha tre linguette: #ui[Regole ed
eventi] (questo capitolo), #ui[Stati e contatori] e #ui[Parole e comandi] (il prossimo).
Le regole sono il cuore di una storia di FAVELLA: qui le crei e le cambi senza scrivere,
ma ognuna diventa una frase del testo, come questa.

#righe[
  #text(fill: c.cyan-bright)[Invece di] apri il cassettone #text(fill: c.cyan-bright)[se] il cassettone #text(fill: c.cyan-bright)[è] chiuso: #text(fill: c.cyan-bright)[dire] #text(fill: c.emerald)["Il primo cassetto cede subito: era solo accostato…"] #text(fill: c.cyan-bright)[e adesso] il cassettone #text(fill: c.cyan-bright)[è] aperto#text(fill: c.amber)[.]
]

== Tre tipi

- Una *regola* risponde a un'azione del giocatore: «quando apre il cassettone…».
- Un *evento* scatta col tempo: al turno 10, oppure ogni 5 turni.
- Un *demone* sorveglia il mondo: scatta nel momento in cui una condizione diventa vera
  (e di nuovo, se torna falsa e poi vera un'altra volta), oppure a ogni turno in cui è
  vera.

#schermata("regole.png",
  alt: "La linguetta Regole ed eventi: in alto Regole 30, Eventi 3, Demoni 3 e il pulsante Nuova regola; sotto, le schede delle regole, la prima «invece di apri Il cassettone».",
  didascalia: [Le regole della Casa di Via Stradivari.])

== Leggere una regola

Ogni regola è una scheda che si legge come una frase:

- in alto il *momento* (#ui[invece di], #ui[prima di], #ui[dopo di]), il *verbo* e il suo
  *bersaglio*: #ui[invece di] · `apri` · #ui[Il cassettone];
- sotto, in ambra, la *condizione*: #ui[se Il cassettone è chiuso];
- poi quello che si dice al giocatore, nel carattere del racconto;
- in fondo le *conseguenze*, come etichette: #ui[Il cassettone → aperto], #ui[aumenta
  indizi];
- a destra #ui[Modifica] e la #ui[×] per eliminarla.

Una regola troppo complessa per l'editor (per esempio con condizioni annidate scritte a
mano) ha #ui[Nel testo] al posto di #ui[Modifica]: si cambia nella sezione #ui[Storia].
Più in basso nella stessa pagina ci sono gli eventi e i demoni, fatti allo stesso modo.

== Creare una regola

#ui[Nuova regola] apre la finestra di una regola nuova. In alto scegli il #ui[Tipo]:
#ui[Regola (reazione a un'azione)], #ui[Evento (a tempo)] o #ui[Demone (sorveglia una
condizione)].

#schermata("nuova-regola.png",
  alt: "La finestra Nuova regola: il tipo, Quando il giocatore… con il verbo e il bersaglio, Quando scatta con Invece di, Prima di, Dopo di.",
  didascalia: [Una regola nuova.])

*Quando il giocatore…* Il verbo (apri, prendi, esamina, e anche i verbi che inventi tu)
e il bersaglio: un oggetto, una direzione, oppure #ui[— senza bersaglio (globale) —] per
una regola che vale per il verbo da solo («ricorda»). Per le azioni con due oggetti
(«brucia le lettere con la torcia») scegli anche la preposizione e il secondo oggetto.

*Quando scatta.* Il momento:

- #ui[Invece di (al posto)]: la regola *sostituisce* l'azione normale. Se scrivi
  «Invece di prendi la piuma», il giocatore non la prende più: se vuoi che la prenda
  comunque, aggiungi la conseguenza #ui[sposta un oggetto → in inventario]. La finestra
  te lo ricorda in un riquadro.
- #ui[Prima di (poi prosegue)]: la regola scatta, poi l'azione avviene normalmente.
- #ui[Dopo di (a cose fatte)]: la regola scatta dopo che l'azione è riuscita.

== Le condizioni

#ui[Solo se…] dice quando la regola vale. Con #ui[\+ aggiungi condizione] compare il
costruttore.

#schermata("regola-fine.png",
  alt: "La parte bassa della finestra di una regola: la condizione «un oggetto è… Il cassettone è chiuso», il testo da dire al giocatore, la conseguenza «Il cassettone → aperto», e Altrimenti.",
  didascalia: [Condizione, testo e conseguenze di una regola.])

- In alto scegli se devono essere #ui[tutte vere (e)] o se ne basta #ui[almeno una
  (oppure)].
- Ogni condizione comincia da un menu: #ui[il giocatore ha…], #ui[il giocatore è
  in…], #ui[un oggetto è…], #ui[uno stato è…], #ui[un contatore…] (è almeno, è più di,
  è meno di, è al massimo…), #ui[uno stato è come un altro…], #ui[càpita
  (probabilità)…].
- La casella #ui[non] la rovescia: «il giocatore *non* ha la chiave».
- #ui[\+ condizione] ne aggiunge un'altra; #ui[\+ gruppo ( )] apre un gruppo con la sua
  scelta e/oppure, per combinazioni come «ha la chiave *e* (è notte *oppure* piove)».

== Che cosa succede

#ui[Di' al giocatore] è obbligatorio: il testo che il giocatore legge quando la regola
scatta. #ui[Fai questo…] aggiunge le conseguenze, una per riga: si sceglie il tipo dal
menu e poi #ui[\+ conseguenza].

#table(
  columns: (auto, 1fr),
  stroke: none,
  inset: (x: 6pt, y: 5pt),
  fill: (_, y) => if calc.odd(y) { rgb("#f4f8fb") },
  table.header(text(weight: 700)[Gruppo], text(weight: 700)[Conseguenze]),
  [Effetti comuni], [cambia una proprietà di un oggetto · cambia il valore di uno stato ·
    aumenta o diminuisci un contatore · sposta un oggetto · sposta il giocatore · fine
    partita (vinci, perdi, termina)],
  [Il mondo cambia], [una stanza diventa buia o si illumina · sposta un personaggio],
  [Il caso e gli stati], [sorteggia il valore di uno stato · copia uno stato in un altro],
)

#ui[Altrimenti] (#ui[\+ aggiungi un «altrimenti»]) è quello che succede quando la
condizione *non* è vera: un altro testo e altre conseguenze. #ui[Scrivi la regola]
conferma, e la regola compare nella sua scheda e nel testo.

== Eventi e demoni

#coppia("nuovo-evento.png", "nuovo-demone.png",
  alt-a: "La finestra per un evento: al turno, una volta sola, oppure ogni N turni.",
  alt-b: "La finestra per un demone: appena la condizione diventa vera, oppure ogni turno in cui è vera.",
  didascalia: [Un evento (a sinistra) e un demone (a destra).])

Per un *evento* scegli #ui[al turno (una volta sola)] o #ui[ogni N turni (ripetuto)] e il
numero. Per un *demone* scegli #ui[appena la condizione diventa vera (ogni volta che lo diventa)]
o #ui[ogni turno in cui è vera (ripetuto)], e poi la condizione. Il primo scatta nel
momento in cui la condizione passa da falsa a vera, e non mentre resta vera; se poi
torna falsa e di nuovo vera, scatta ancora. Il resto — il testo, le conseguenze — è
come per le regole.

#consiglio[
  Prova spesso (#tasto("F5")). Il riquadro #ui[Passo passo] della Prova (capitolo 11)
  mostra, turno per turno, che cosa è cambiato nel mondo: è il modo più rapido per
  capire perché una regola non è scattata.
]
