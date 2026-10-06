#import "../lib/guida.typ": *

= Le scorciatoie

Su macOS, al posto di #tasto("Ctrl") si usa #tasto("Cmd").

#table(
  columns: (auto, 1fr),
  stroke: none,
  inset: (x: 8pt, y: 7pt),
  fill: (_, y) => if calc.odd(y) { rgb("#f4f8fb") },
  table.header(text(weight: 700)[Tasti], text(weight: 700)[Che cosa fa]),
  table.cell(colspan: 2)[#text(font: font-display, weight: 700, fill: c.cyan-dark)[Progetto e file]],
  tasto("Ctrl", "O"), [Apri una storia (un file `.fav`).],
  tasto("Ctrl", "Maiusc", "O"), [Apri una cartella.],
  tasto("Ctrl", "S"), [Salva tutti i file cambiati.],
  tasto("Ctrl", "Maiusc", "S"), [Salva con nome (una copia del file, nel progetto).],
  table.cell(colspan: 2)[#text(font: font-display, weight: 700, fill: c.cyan-dark)[Storia]],
  tasto("F5"), [Prova la storia.],
  tasto("Ctrl", "Alt", "R"), [Riordina il testo di tutta la storia.],
  tasto("Ctrl", "Z"), [Annulla: nel testo l'ultima cosa scritta, nei pannelli l'ultima modifica.],
  tasto("Ctrl", "F"), [Cerca nel testo.],
  tasto("Ctrl", "H"), [Cerca e sostituisci nel testo.],
  table.cell(colspan: 2)[#text(font: font-display, weight: 700, fill: c.cyan-dark)[Sezioni e interfaccia]],
  [#tasto("Ctrl", "1") … #tasto("Ctrl", "5")], [Storia, Mondo, Personaggi, Regole, Prova.],
  tasto("Ctrl", "+"), [Interfaccia più grande.],
  tasto("Ctrl", "−"), [Interfaccia più piccola.],
  tasto("Ctrl", "0"), [La grandezza consigliata (110 per cento).],
  tasto("Esc"), [Chiude un menu o una finestra.],
  tasto("Canc"), [Sulle schede dei file: chiude quella scelta.],
)

#v(1fr)

#align(center)[
  #box(width: 40mm, line(length: 100%, stroke: 1.5pt + brand))
  #v(4mm)
  #text(font: font-display, size: 12pt, weight: 600, fill: c.ink)[Buona scrittura.]
  #v(2mm)
  #text(size: 10pt, fill: c.ink-soft)[Le domande, le idee e i difetti trovati sono benvenuti su
    #link("https://github.com/Pitz72/FAVELLA1")[github.com/Pitz72/FAVELLA1]. \
    Il linguaggio si impara nel *Manuale di Programmazione*, su #link("https://www.favella.eu")[www.favella.eu].]
]
