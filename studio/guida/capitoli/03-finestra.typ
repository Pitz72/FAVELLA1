#import "../lib/guida.typ": *

= La finestra di Studio

== La prima schermata

Quando non c'è niente di aperto, Studio ti chiede da dove cominciare.

#schermata("accoglienza.png",
  alt: "La prima schermata di Favella Studio: il marchio, il titolo «Scrivi la tua avventura, in italiano.» e i pulsanti Nuova storia, Apri una storia, Apri una cartella, con sotto la storia d'esempio e la guida.",
  didascalia: [La prima schermata. Le tre strade principali, e sotto la storia d'esempio e questa guida.])

- #ui[Nuova storia] crea una storia nuova. Studio chiede dove metterla e come chiamare il
  file (per esempio `storia.fav`): scegli o crea una cartella apposta, perché la cartella
  diventa il *progetto*, cioè il posto dove vivono tutti i file della storia.
- #ui[Apri una storia] apre un file `.fav` che hai già (#tasto("Ctrl", "O")). La sua
  cartella diventa il progetto.
- #ui[Apri una cartella] apre una cartella intera (#tasto("Ctrl", "Maiusc", "O")). Se
  dentro c'è una storia sola, si apre da sé; se ce n'è più d'una, Studio te le mostra e
  scegli tu.
- #ui[Prova con la storia d'esempio] apre «La Casa di Via Stradivari» (capitolo 1).
- #ui[Leggi la guida] apre #se-stampa[la guida in PDF, la stessa che hai in mano][questo PDF].

Una storia nuova non parte vuota: ha già una stanza e il giocatore dentro, così compila
subito e tutti i pannelli hanno da che cosa partire.

#righe[
  #text(fill: rgb("#7f97ad"))[\# La mia storia] \
  #text(fill: rgb("#7f97ad"))[\# Scrivi qui la tua storia, oppure usa i pannelli: Mondo, Personaggi, Regole.] \
  \
  La piazza #text(fill: c.cyan-bright)[è una stanza]#text(fill: c.amber)[.] \
  La descrizione della piazza #text(fill: c.cyan-bright)[è] #text(fill: c.emerald)["Sei al centro di una piazza silenziosa."]#text(fill: c.amber)[.] \
  Il giocatore #text(fill: c.cyan-bright)[comincia in] piazza#text(fill: c.amber)[.]
]

== Il giro della finestra

Con una storia aperta, la finestra ha sempre la stessa forma.

#annotata("finestra.png",
  (
    (560, 33),    // 1 dove sei / file
    (1110, 33),   // 2 salva
    (1275, 12),   // 3 prova la storia
    (1404, 33),   // 4 altre azioni
    (52, 700),    // 5 sezioni
    (395, 380),   // 6 esplora
    (600, 92),    // 7 schede
    (1390, 500),  // 8 testo
    (600, 882),   // 9 barra di stato
  ),
  alt: "La finestra di Favella Studio con la sezione Storia aperta, segnata da nove numeri: la barra in alto, le sezioni a sinistra, l'elenco dei file, le schede, il testo e la barra di stato.",
  didascalia: [La finestra con la sezione #ui[Storia] aperta.])

#num(1) *Dove sei.* Il nome della cartella del progetto e il file che stai modificando. Un
clic sul nome del file apre l'elenco dei file della storia: è il modo più veloce per
passare da un file all'altro.

#num(2) *Salva.* Mostra #ui[Salvato] quando non c'è niente da salvare, #ui[Salva] quando
un file è cambiato, #ui[Salva (2)] quando i file cambiati sono due. La freccia accanto
apre #ui[Salva con nome…] e #ui[Salva il progetto come…] (capitolo 12). Prima di
#ui[Salva] c'è #ui[Riordina] (capitolo 4) e, quando sei in un pannello, #ui[Annulla]
(capitolo 12).

#num(3) *Prova la storia.* Compila la storia e ti porta nella sezione #ui[Prova] a
giocarla (#tasto("F5")).

#num(4) *Altre azioni* (#puntini). Il menu con tutto il resto: progetti, storia,
leggibilità, aggiornamenti e questa guida (@fig-menu).

#num(5) *Le sezioni.* Le cinque parti di Studio, nell'ordine in cui si scrive una
storia (qui sotto).

#num(6) *Esplora.* I file della storia e della cartella (capitolo 4). C'è solo nella
sezione #ui[Storia]; la freccia sul bordo lo nasconde.

#num(7) *Le schede dei file aperti.* Un pallino accanto al nome vuol dire che quel file
ha modifiche non salvate.

#num(8) *Il testo.* La storia, frase per frase, coi colori del linguaggio.

#num(9) *La barra di stato.* A sinistra lo stato del motore (#ui[Motore pronto]) e i
problemi del testo (#ui[Nessun problema], oppure #ui[1 errore]: un clic li mostra). A
destra la riga e la colonna dove sta il cursore e la grandezza dell'interfaccia.

== Le cinque sezioni

#table(
  columns: (auto, auto, 1fr),
  stroke: none,
  inset: (x: 6pt, y: 6pt),
  fill: (_, y) => if calc.odd(y) { rgb("#f4f8fb") },
  table.header(
    text(weight: 700)[Sezione], text(weight: 700)[Tasti], text(weight: 700)[Che cosa ci fai],
  ),
  ui[Storia], tasto("Ctrl", "1"), [Il testo della storia, i suoi file, i problemi.],
  ui[Mondo], tasto("Ctrl", "2"), [Stanze, oggetti e la mappa che li collega.],
  ui[Personaggi], tasto("Ctrl", "3"), [Chi vive nella storia, e i suoi dialoghi.],
  ui[Regole], tasto("Ctrl", "4"), [Regole, eventi e demoni; stati e contatori; parole e comandi.],
  ui[Prova], tasto("Ctrl", "5"), [La partita, con lo stato del mondo accanto.],
)

Sulle sezioni compaiono due segnali: un numero rosso su #ui[Storia] quando il testo ha
degli errori, un pallino verde su #ui[Prova] quando c'è una partita in corso.

== Il menu Altre azioni

#grid(
  columns: (44%, 1fr),
  column-gutter: 16pt,
  [#schermata("menu-altre-azioni.png",
    alt: "Il menu Altre azioni: Progetto, Storia, Leggibilità, Applicazione.",
    didascalia: [Il menu #puntini.]) <fig-menu>],
  [
    #v(4pt)
    *Progetto*: #ui[Nuova storia…], #ui[Apri una storia (.fav)…], #ui[Apri una
    cartella…], #ui[Apri la storia d'esempio], #ui[Salva con nome…], #ui[Salva il
    progetto come…].

    *Storia*: #ui[Riordina il testo], #ui[Esporta come pagina web giocabile…] (capitolo
    11), #ui[Apri il gioco in una finestra a parte].

    *Leggibilità*: la grandezza dell'interfaccia, il tema notte o carta, il contrasto alto
    (capitolo 13).

    *Applicazione*: #ui[Guida di Favella Studio (PDF)], #ui[Controlla gli
    aggiornamenti…], #ui[Controlla da solo a ogni avvio] (capitolo 2).

    #tastiera[Nei menu ci si muove con le frecce; #tasto("Invio") sceglie,
      #tasto("Esc") chiude e riporta dove eri.]
  ],
)

== Salvare

Studio non salva da solo: decidi tu quando. #tasto("Ctrl", "S") salva *tutti* i file
cambiati, anche quelli che i pannelli hanno modificato senza che tu li aprissi. Se provi
a chiudere Studio, ad aprire un'altra storia o a chiudere una scheda con delle modifiche
non salvate, Studio te lo chiede prima (capitolo 12).

#tastiera[
  #tasto("Ctrl", "1") … #tasto("Ctrl", "5") cambiano sezione. #tasto("F5") prova la storia.
  #tasto("Ctrl", "S") salva tutto. Il primo #tasto("Tab") dopo l'apertura porta al
  collegamento #ui[Salta all'area di lavoro], che salta la barra in alto.
]
