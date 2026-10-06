#import "../lib/guida.typ": *

= Leggere bene, usare la tastiera

Favella Studio è pensato anche per chi ci vede poco. Tutto si ingrandisce, i colori si
scelgono, e ogni cosa si raggiunge dalla tastiera.

== Tema e contrasto

Dal menu #puntini, nella parte #ui[Leggibilità]:

- #ui[Tema notte]: fondo scuro, il tema con cui Studio si apre;
- #ui[Tema carta (chiaro)]: fondo chiaro, come le schermate di questa guida;
- #ui[Contrasto alto]: vale per tutti e due i temi. Fondi pieni, bordi spessi, testi al
  massimo del contrasto e il contorno giallo sull'elemento attivo.

Anche il testo della storia e la mappa cambiano con il tema. In tutti e quattro gli
aspetti ogni testo ha un contrasto di almeno 4,5 a 1 col suo fondo (la soglia delle linee
guida per l'accessibilità del web), e il contorno di ciò che hai selezionato è sempre
spesso e visibile.

#grid(
  columns: (1fr, 1fr),
  column-gutter: 10pt,
  row-gutter: 4pt,
  schermata("aspetto-notte.png", alt: "Studio col tema notte.", didascalia: [Notte.]),
  schermata("aspetto-carta.png", alt: "Studio col tema carta.", didascalia: [Carta.]),
  schermata("aspetto-notte-alto.png", alt: "Studio col tema notte e il contrasto alto.", didascalia: [Notte, contrasto alto.]),
  schermata("aspetto-carta-alto.png", alt: "Studio col tema carta e il contrasto alto.", didascalia: [Carta, contrasto alto.]),
)

== La grandezza

Tutta l'interfaccia si ingrandisce dall'80 al 200 per cento: #tasto("Ctrl", "+") e
#tasto("Ctrl", "−"), oppure #ui[A+] e #ui[A−] nel menu. #tasto("Ctrl", "0") (o
#ui[Consigliata]) torna al 110 per cento, la grandezza consigliata. La grandezza attuale
si legge in basso a destra, nella barra di stato.

Quando lo spazio non basta — finestra stretta o interfaccia molto ingrandita — la barra
in alto si stringe da sola: i pulsanti restano, come icone, e il loro nome si legge
passandoci sopra (e lo leggono i lettori di schermo).

== Tutto da tastiera

#table(
  columns: (auto, 1fr),
  stroke: none,
  inset: (x: 6pt, y: 6pt),
  fill: (_, y) => if calc.odd(y) { rgb("#f4f8fb") },
  table.header(text(weight: 700)[Dove], text(weight: 700)[Come]),
  [Ovunque], [#tasto("Tab") e #tasto("Maiusc", "Tab") passano da un controllo all'altro;
    il primo #tasto("Tab") offre #ui[Salta all'area di lavoro].],
  [Sezioni], [#tasto("Ctrl", "1") … #tasto("Ctrl", "5").],
  [Elenchi], [#tasto("↑") #tasto("↓") fra le voci, #tasto("Home") e #tasto("Fine") alla
    prima e all'ultima, #tasto("Invio") sceglie.],
  [Linguette], [#tasto("←") #tasto("→") quando una linguetta ha il fuoco.],
  [Schede dei file], [#tasto("←") #tasto("→") fra le schede, #tasto("Canc") chiude.],
  [Menu], [#tasto("↓") apre (sul nome del file), le frecce scorrono, #tasto("Invio")
    sceglie, #tasto("Esc") chiude.],
  [Finestre], [Il fuoco resta dentro la finestra finché è aperta; #tasto("Esc") la chiude
    e il fuoco torna dov'era.],
  [Mappa], [Le stesse cose si fanno dalla scheda di ogni stanza, nel riquadro
    #ui[Uscite].],
)

== Lettori di schermo

Ogni pulsante e ogni campo ha il suo nome, anche quelli che si vedono solo come icone.
Le finestre di dialogo si annunciano come tali, gli avvisi vengono letti quando
compaiono, e il racconto della partita nella sezione #ui[Prova] è annunciato man mano
che il gioco risponde: si può provare una storia senza guardare lo schermo.
