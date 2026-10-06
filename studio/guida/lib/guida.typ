// =============================================================================
// guida.typ — Impaginazione della «Guida di Favella Studio».
// Stessa identità del «Manuale di Programmazione» di FAVELLA 1 (palette, Sora per
// i titoli, Inter per il testo, Source Code Pro per il codice), ma A4 e con un
// corpo più grande: è un PDF da leggere a schermo, anche ingrandito, con molte
// schermate. Il manuale resta il riferimento del linguaggio; questa guida spiega
// l'app.
// =============================================================================

#let STUDIO = "1.2.1"
#let MOTORE = "1.4.4"
#let EDIZIONE = "Prima edizione · ottobre 2026"

// --- PALETTE (identica a documentazione/manuale/lib/manuale-template.typ) --------
#let c = (
  void: rgb("#03060d"),
  navy0: rgb("#0a1526"),
  navy1: rgb("#050b16"),
  navy2: rgb("#02050b"),
  panel: rgb("#0b1726"),
  surface: rgb("#0f2032"),
  cyan: rgb("#22d3ee"),
  cyan-bright: rgb("#5cf3ff"),
  cyan-dark: rgb("#0e7490"),
  emerald: rgb("#34d399"),
  emerald-dark: rgb("#0f766e"),
  teal: rgb("#2dd4bf"),
  amber: rgb("#f59e0b"),
  amber-dark: rgb("#b45309"),
  ink: rgb("#142433"),
  ink-soft: rgb("#3a4f63"),
  muted: rgb("#5a728a"),
  rule: rgb("#d7e2ec"),
  soft: rgb("#cfe0ee"),
  ice: rgb("#eaf4fb"),
)
#let font-display = ("Sora", "Inter", "Segoe UI")
#let font-body = ("Inter", "Segoe UI")
#let font-mono = ("Source Code Pro", "Consolas")
#let brand = gradient.linear(c.cyan, c.teal, c.emerald, c.amber)

#let _capnum = counter("guida-capitolo")

// =============================================================================
// ELEMENTI DEL TESTO
// =============================================================================

// Il nome di un pulsante, di una voce di menu, di un campo: come si legge nell'app.
#let ui(t) = text(weight: 600, fill: c.surface)[#t]

// Il pulsante «Altre azioni» della barra in alto: tre puntini, disegnati (il carattere
// «⋯» non c'è nel font del testo).
#let puntini = box(
  stroke: 0.7pt + rgb("#aebdcc"),
  radius: 3pt,
  inset: (x: 4pt, y: 0pt),
  height: 0.95em,
  baseline: 0.15em,
)[#align(horizon)[#stack(dir: ltr, spacing: 2.2pt, ..range(3).map(_ => circle(radius: 1.35pt, fill: c.surface)))]]

// Un tasto o una combinazione: #tasto("Ctrl", "S").
#let tasto(..tasti) = {
  let cap(k) = box(
    fill: rgb("#f3f6f9"),
    stroke: 0.7pt + rgb("#aebdcc"),
    radius: 3pt,
    inset: (x: 4pt, y: 2pt),
    outset: (y: 1pt),
  )[#text(font: font-mono, size: 0.8em, weight: 600, fill: c.ink)[#k]]
  tasti.pos().map(cap).join(h(1.5pt) + text(size: 0.8em, fill: c.muted)[+] + h(1.5pt))
}

// Un frammento di storia, nel colore del codice.
#let fav(t) = highlight(
  fill: rgb("#eef3f7"),
  radius: 2.5pt,
  extent: 2pt,
  top-edge: "ascender",
  bottom-edge: "descender",
)[#text(font: font-mono, size: 0.86em, fill: c.cyan-dark)[#t]]

// Un blocco di righe di storia (sfondo scuro, come nell'app col tema notte).
#let righe(corpo) = block(
  width: 100%,
  fill: c.panel,
  radius: 5pt,
  inset: (x: 13pt, y: 11pt),
  stroke: 0.6pt + rgb("#1e3a52"),
)[
  #set text(font: font-mono, size: 9.5pt, fill: rgb("#e8f0f8"))
  #set par(justify: false, leading: 0.75em)
  #corpo
]

// Passi numerati di un'operazione.
#let passi(..voci) = block(above: 0.9em, below: 1em)[
  #set par(justify: false)
  #for (i, voce) in voci.pos().enumerate() {
    grid(
      columns: (22pt, 1fr),
      column-gutter: 6pt,
      align(center)[#box(width: 17pt, height: 17pt, radius: 50%, fill: c.cyan-dark)[
        #align(center + horizon)[#text(font: font-display, size: 8.5pt, weight: 700, fill: white)[#(i + 1)]]
      ]],
      pad(top: 1.5pt)[#voce],
    )
    v(4pt)
  }
]

// --- Riquadri ------------------------------------------------------------------
#let _riquadro(titolo, accento, sfondo, corpo) = block(
  width: 100%,
  fill: sfondo,
  stroke: (left: 3.5pt + accento),
  radius: (top-right: 5pt, bottom-right: 5pt),
  inset: (left: 14pt, rest: 11pt),
  above: 1.2em,
  below: 1.2em,
  breakable: false,
)[
  #text(font: font-display, size: 8.5pt, weight: 700, fill: accento, tracking: 1.2pt)[#upper(titolo)]
  #v(-0.25em)
  #set text(size: 10.5pt)
  #set par(justify: false)
  #corpo
]
#let nota(corpo) = _riquadro("Nota", c.ink-soft, rgb("#f1f5f9"), corpo)
#let consiglio(corpo) = _riquadro("Consiglio", c.emerald-dark, rgb("#edfaf4"), corpo)
#let attenzione(corpo) = _riquadro("Attenzione", c.amber-dark, rgb("#fdf6ec"), corpo)
#let tastiera(corpo) = _riquadro("Da tastiera", c.cyan-dark, rgb("#eef9fc"), corpo)

// --- Schermate -----------------------------------------------------------------
// Una schermata con cornice e didascalia. `alt` è il testo per i lettori di schermo.
#let schermata(file, alt: "", didascalia: none, larghezza: 100%, altezza: none) = {
  let img = if altezza == none {
    image("../immagini/" + file, width: 100%, alt: alt)
  } else {
    // ritaglio dall'alto: si mostra solo la parte che serve
    box(height: altezza, clip: true, image("../immagini/" + file, width: 100%, alt: alt))
  }
  figure(
    box(width: larghezza, stroke: 0.7pt + rgb("#c9d6e2"), radius: 5pt, clip: true, img),
    caption: didascalia,
    kind: image,
    supplement: [Figura],
  )
}

// Due schermate affiancate.
#let coppia(a, b, didascalia: none, alt-a: "", alt-b: "") = figure(
  grid(
    columns: (1fr, 1fr),
    column-gutter: 10pt,
    box(stroke: 0.7pt + rgb("#c9d6e2"), radius: 5pt, clip: true, image("../immagini/" + a, width: 100%, alt: alt-a)),
    box(stroke: 0.7pt + rgb("#c9d6e2"), radius: 5pt, clip: true, image("../immagini/" + b, width: 100%, alt: alt-b)),
  ),
  caption: didascalia,
  kind: image,
  supplement: [Figura],
)

// Una schermata della finestra intera (1440×900) con i numeri sopra. `punti` è una
// lista di (x, y) nelle coordinate della finestra.
#let annotata(file, punti, alt: "", didascalia: none) = figure(
  layout(size => {
    let w = size.width
    let s = w / 1440
    box(width: w, height: 900 * s, stroke: 0.7pt + rgb("#c9d6e2"), radius: 5pt, clip: true)[
      #image("../immagini/" + file, width: w, alt: alt)
      #for (i, p) in punti.enumerate() {
        place(top + left, dx: p.at(0) * s - 10pt, dy: p.at(1) * s - 10pt)[
          #circle(radius: 10pt, fill: c.amber, stroke: 1.8pt + white)[
            #align(center + horizon)[#text(font: font-display, size: 10pt, weight: 800, fill: white)[#(i + 1)]]
          ]
        ]
      }
    ]
  }),
  caption: didascalia,
  kind: image,
  supplement: [Figura],
)

// Il numero di un punto annotato, nel testo: #num(3).
#let num(n) = box(baseline: 2.5pt)[#circle(radius: 6.5pt, fill: c.amber)[
  #align(center + horizon)[#text(font: font-display, size: 7.5pt, weight: 800, fill: white)[#n]]
]]

// =============================================================================
// COPERTINA, FRONTESPIZIO, COLOPHON
// =============================================================================
#let copertina() = page(margin: 0pt, header: none, footer: none)[
  #let w = 210mm
  #let h = 297mm
  #box(width: w, height: h, clip: true, fill: gradient.linear(c.navy0, c.navy1, c.navy2, angle: 155deg))[
    #place(top + left, rect(width: w, height: h, stroke: none, fill: gradient.radial(
      c.emerald.transparentize(80%), c.emerald.transparentize(100%), center: (50%, 22%), radius: 50%)))
    #place(top + left, rect(width: w, height: h, stroke: none, fill: gradient.radial(
      c.cyan.transparentize(86%), c.cyan.transparentize(100%), center: (50%, 78%), radius: 55%)))

    // occhiello
    #place(top + center, dy: 26mm)[
      #text(font: font-display, size: 10pt, weight: 600, tracking: 5pt, fill: c.cyan-bright)[GUIDA ALL'USO]
    ]
    // marchio
    #place(top + center, dy: 40mm)[#image("../immagini/marchio-studio.png", width: 46mm, alt: "Il marchio di Favella Studio")]
    // titolo
    #place(top + center, dy: 94mm)[
      #align(center)[
        #text(font: font-display, size: 50pt, weight: 800, tracking: 0.5pt,
          fill: gradient.linear(white, rgb("#bcd3e6"), angle: 90deg))[Favella Studio]
        #v(4mm)
        #box(inset: (x: 12pt, y: 5pt), radius: 20pt, stroke: 1.2pt + brand)[
          #text(font: font-mono, size: 12pt, weight: 600, tracking: 2.2pt, fill: c.soft)[#STUDIO]
        ]
        #v(5mm)
        #text(font: font-display, size: 16pt, weight: 600, fill: c.soft)[L'ambiente di scrittura per FAVELLA 1]
      ]
    ]
    // la finestra dell'app
    #place(top + center, dy: 164mm)[
      #box(width: 168mm, height: 92mm, radius: 7pt, clip: true,
        stroke: 1pt + gradient.linear(c.cyan.transparentize(30%), c.emerald.transparentize(50%), c.amber.transparentize(30%), angle: 20deg))[
        #image("../immagini/aspetto-notte.png", width: 168mm, alt: "Favella Studio col tema notte: la scheda di una stanza")
      ]
    ]
    // autore e edizione
    #place(bottom + center, dy: -18mm)[
      #align(center)[
        #text(font: font-display, size: 13pt, weight: 500, fill: c.soft)[Simone Pizzi]
        #v(2.5mm)
        #text(font: font-display, size: 8.5pt, weight: 600, tracking: 1.6pt, fill: rgb("#7c91a6"))[#upper(EDIZIONE)]
      ]
    ]
  ]
]

#let frontespizio() = page(header: none, footer: none)[
  #v(1fr)
  #align(center)[
    #image("../immagini/marchio-studio.png", width: 34mm, alt: "Il marchio di Favella Studio")
    #v(8mm)
    #text(font: font-display, size: 10.5pt, weight: 600, tracking: 4.5pt, fill: c.cyan-dark)[GUIDA ALL'USO]
    #v(5mm)
    #text(font: font-display, size: 38pt, weight: 800, fill: c.ink)[Favella Studio]
    #v(3mm)
    #text(font: font-display, size: 20pt, weight: 800, tracking: 2pt, fill: brand)[#STUDIO]
    #v(5mm)
    #box(width: 46mm, line(length: 100%, stroke: 1.5pt + brand))
    #v(6mm)
    #text(font: font-display, size: 15pt, weight: 600, fill: c.cyan-dark)[L'ambiente di scrittura per FAVELLA 1]
    #v(8mm)
    #text(font: font-display, size: 12pt, weight: 500, fill: c.ink)[Simone Pizzi]
  ]
  #v(1fr)
  #align(center)[
    #text(font: font-display, size: 9.5pt, weight: 600, fill: c.cyan-dark, tracking: 0.5pt)[#EDIZIONE]
    #v(1.5mm)
    #text(font: font-mono, size: 9pt, fill: c.ink-soft)[Favella Studio #STUDIO · motore FAVELLA #MOTORE]
  ]
  #v(8mm)
]

#let colophon() = page(header: none, footer: none)[
  #v(1fr)
  #align(center)[
    #image("../immagini/marchio-favella.png", width: 26mm, alt: "Il marchio di FAVELLA 1")
    #v(6mm)
    #set par(justify: false, leading: 0.9em)
    #set text(size: 10pt, fill: c.ink-soft)
    #text(font: font-display, size: 12.5pt, weight: 600, fill: c.ink)[Favella Studio — Guida all'uso]
    #v(2.5mm)
    #text(size: 9.5pt)[#EDIZIONE · Favella Studio #STUDIO · motore FAVELLA #MOTORE]
    #v(3mm)
    #box(width: 30mm, line(length: 100%, stroke: 1pt + gradient.linear(c.cyan, c.amber)))
    #v(3.5mm)
    #text(fill: c.ink, weight: 600)[© 2026 Simone Pizzi — Runtime Edizioni]
    #v(4.5mm)
    #block(width: 78%)[Favella Studio e FAVELLA 1 sono open source, con licenza MIT. Questa guida si distribuisce gratuitamente insieme all'app e sul sito.]
    #v(4.5mm)
    #block(width: 78%)[Sito ufficiale: #link("https://www.favella.eu/studio")[www.favella.eu/studio]. Il codice è su #link("https://github.com/Pitz72/FAVELLA1")[github.com/Pitz72/FAVELLA1], nella cartella `studio/`.]
    #v(4.5mm)
    #block(width: 78%)[Le schermate sono prese dall'app vera, col tema «carta», sulla storia d'esempio «La Casa di Via Stradivari». Il linguaggio si impara nel «Manuale di Programmazione» di FAVELLA 1. Composto con #link("https://typst.app")[Typst]: titoli in Sora, testo in Inter, codice in Source Code Pro.]
  ]
  #v(1fr)
]

// =============================================================================
// CONFIGURAZIONE DEL DOCUMENTO
// =============================================================================
#let conf(doc) = {
  set document(
    title: "Favella Studio — Guida all'uso",
    author: "Simone Pizzi",
    description: "La guida all'uso di Favella Studio " + STUDIO + ", l'ambiente di scrittura per FAVELLA 1.",
    keywords: ("Favella Studio", "FAVELLA 1", "narrativa interattiva", "avventure testuali", "guida"),
  )
  set page(
    paper: "a4",
    margin: (top: 25mm, bottom: 22mm, x: 21mm),
    header: context {
      let pg = here().page()
      let h1 = query(heading.where(level: 1))
      let corrente = none
      for h in h1 { if h.location().page() <= pg { corrente = h } }
      if corrente != none {
        set text(font: font-body, size: 8.5pt, fill: c.muted)
        grid(columns: (1fr, auto), align(left)[Favella Studio · Guida all'uso], align(right)[#corrente.body])
        v(-0.35em)
        line(length: 100%, stroke: 0.4pt + c.rule)
      }
    },
    footer: context {
      let pg = counter(page).get().first()
      if pg > 1 {
        set text(font: font-mono, size: 9pt, fill: c.ink-soft)
        align(center)[#pg]
      }
    },
  )
  set text(font: font-body, size: 11.2pt, fill: c.ink, lang: "it", hyphenate: true)
  set par(justify: true, leading: 0.78em, spacing: 1.05em)
  set heading(numbering: none)
  set list(indent: 4pt, body-indent: 6pt, marker: text(fill: c.cyan-dark)[•])
  set enum(indent: 4pt)
  show figure: set block(above: 1.3em, below: 1.4em, breakable: false)
  show figure.caption: it => {
    set text(size: 9.2pt, fill: c.ink-soft)
    set par(justify: false)
    [#text(weight: 700, fill: c.cyan-dark)[#it.supplement #context it.counter.display(it.numbering)] — #it.body]
  }
  show heading.where(level: 1): it => {
    pagebreak(weak: true)
    _capnum.step()
    block(above: 0pt, below: 1em)[
      #context text(font: font-display, size: 11pt, weight: 700, fill: c.cyan-dark, tracking: 2pt)[
        #upper("Capitolo " + str(_capnum.get().first()))
      ]
      #v(1mm)
      #text(font: font-display, size: 27pt, weight: 800, fill: c.ink, hyphenate: false)[#it.body]
      #v(2mm)
      #box(width: 40mm, line(length: 100%, stroke: 2.5pt + gradient.linear(c.cyan, c.emerald)))
    ]
    v(0.3em)
  }
  show heading.where(level: 2): it => block(above: 1.6em, below: 0.65em, sticky: true)[
    #text(font: font-display, size: 15.5pt, weight: 700, fill: c.surface)[#it.body]
  ]
  show heading.where(level: 3): it => block(above: 1.2em, below: 0.45em, sticky: true)[
    #text(font: font-display, size: 12pt, weight: 600, fill: c.cyan-dark)[#it.body]
  ]
  show raw.where(block: false): it => fav(it.text)
  show strong: set text(fill: c.surface)
  show link: set text(fill: c.cyan-dark)
  doc
}
