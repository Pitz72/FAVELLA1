// =============================================================================
// copertina-kdp.typ — Copertina integrale (wrap) per Amazon KDP.
// Quarta di copertina + dorso + prima, in un unico foglio alle misure esatte
// con abbondanza (bleed). Stessa identità di marca del manuale.
//
//   Trim libro          : 6,69 × 9,61″  (169,93 × 244,09 mm)
//   Pagine (interno KDP) : 84  →  manuale-interno-kdp.pdf
//   Carta                : bianca (BN o colore standard) → dorso 84×0,002252″
//   Bleed                : 0,125″ (3,175 mm) su ogni lato esterno
//
// Wrap risultante: 13,819 × 9,860″  ≈  351,0 × 250,4 mm  (dorso 4,80 mm).
//
// ⚠ Se cambi carta o numero di pagine, ricalcola `pagine`/`mult` qui sotto.
// ⚠ Dorso < 100 pp. → niente testo sul dorso (regola KDP): resta navy pieno.
// Build: typst compile --font-path fonts copertina-kdp.typ copertina-kdp.pdf
// =============================================================================

#import "lib/manuale-template.typ": c, font-display, font-body, font-mono

// --- GEOMETRIA ---------------------------------------------------------------
#let trim-w = 6.69in
#let trim-h = 9.61in
#let bleed  = 0.125in
#let pagine = 84
#let mult   = 0.002252in        // bianca, BN / colore standard
#let spine  = pagine * mult      // ≈ 0,18917″ (4,80 mm)
#let safe   = 0.25in             // margine di sicurezza dai tagli e dalle pieghe

#let cover-w = 2 * trim-w + spine + 2 * bleed
#let cover-h = trim-h + 2 * bleed

// Centri orizzontali dei due pannelli, riferiti al centro pagina (per `place`).
#let front-cx = (bleed + trim-w + spine + trim-w / 2) - cover-w / 2
#let back-cx  = (bleed + trim-w / 2) - cover-w / 2
#let panel-w  = trim-w - 2 * safe       // larghezza utile di un pannello

#set page(
  width: cover-w,
  height: cover-h,
  margin: 0pt,
  fill: gradient.linear(c.dark, c.surface, c.panel, angle: 145deg),
)
#set text(font: font-body, fill: white)

// alone ciano tenue dietro l'emblema della prima
#place(top + center, dx: front-cx, dy: cover-h * 0.16)[
  #circle(radius: 120pt, fill: gradient.radial(c.cyan.transparentize(82%), c.panel.transparentize(100%)))
]

// =============================================================================
// PRIMA DI COPERTINA (pannello destro) — fedele al fronte del libro
// =============================================================================
#place(horizon + center, dx: front-cx, dy: -0.35in)[
  #box(width: panel-w)[
    #align(center)[
      #box(fill: rgb("#eef4fa"), radius: 30pt, inset: 24pt, stroke: 1pt + c.brace)[
        #image("assets/logo.png", width: 116pt)
      ]
      #v(10mm)
      #text(font: font-display, size: 42pt, weight: 800, tracking: 3pt)[FAVELLA 1]
      #v(2mm)
      #box(width: 46mm, line(length: 100%, stroke: 1.5pt + gradient.linear(c.cyan, c.emerald, c.amber)))
      #v(7mm)
      #text(font: font-display, size: 23pt, weight: 600, fill: rgb("#dceaf6"))[
        Manuale di Programmazione
      ]
      #v(4mm)
      #text(font: font-body, size: 11pt, fill: c.muted, tracking: 0.3pt)[
        Il linguaggio della narrativa interattiva in italiano
      ]
    ]
  ]
]

#place(bottom + center, dx: front-cx, dy: -(bleed + safe + 0.15in))[
  #align(center)[
    #text(font: font-display, size: 12.5pt, weight: 500, fill: rgb("#cfe0ee"))[Simone Pizzi]
    #v(2mm)
    #text(font: font-mono, size: 9.5pt, fill: c.cyan-bright, tracking: 1pt)[v0.29.0]
    #v(1.5mm)
    #text(font: font-display, size: 8.5pt, weight: 500, fill: c.muted, tracking: 1.2pt)[SECONDA EDIZIONE · 2026]
  ]
]

// =============================================================================
// QUARTA DI COPERTINA (pannello sinistro) — sintesi + barcode + marchio
// =============================================================================
#place(top + center, dx: back-cx, dy: bleed + safe + 0.2in)[
  #align(center)[
    #image("assets/logo.png", width: 30pt)
    #v(3mm)
    #text(font: font-display, size: 13pt, weight: 700, fill: rgb("#dceaf6"), tracking: 1pt)[FAVELLA 1]
  ]
]

#place(horizon + center, dx: back-cx, dy: -0.2in)[
  #box(width: panel-w)[
    #set par(justify: false, leading: 0.78em, spacing: 1.0em)
    #set text(size: 11pt, fill: rgb("#cddcea"))
    #align(center)[
      #text(size: 12.5pt, weight: 600, fill: white)[Scrivi una storia. Ottieni un mondo.]
    ]
    #v(4mm)
    In FAVELLA 1 il codice è una frase italiana col punto in fondo. Niente
    parentesi graffe, niente variabili criptiche: scrivi #text(fill: c.cyan-bright, font: font-mono, size: 9.5pt)[La cucina è una stanza.]
    e la cucina esiste, pronta da esplorare.

    Questo manuale ti porta dalla prima riga fino a un'avventura testuale intera,
    costruita sotto i tuoi occhi un pezzo alla volta: stanze e oggetti, regole che
    rispondono a ciò che il giocatore fa, personaggi con cui parlare, meccanismi
    che scattano da soli quando il tempo passa.

    Ogni costrutto lo vedi al lavoro dentro «La Casa di Via Stradivari», una storia
    che si gioca davvero — e che, pagina dopo pagina, imparerai a scrivere per
    intero.
    #v(5mm)
    #align(center)[
      #text(style: "italic", fill: rgb("#9fb4c8"), size: 10.5pt)[
        Per chi ha sempre voluto raccontare un mondo, e farlo rispondere.
      ]
    ]
  ]
]

// Marchio editoriale in basso a sinistra
#place(bottom + left, dx: bleed + safe, dy: -(bleed + safe))[
  #text(font: font-display, size: 8.5pt, weight: 500, fill: c.muted)[
    Manuale ufficiale · Seconda edizione
  ]
]

// Spazio riservato al codice a barre ISBN: KDP lo sovrastampa in basso a destra
// della quarta. Lasciamo un'area bianca pulita (≈ 2 × 1,2″) con i margini di
// sicurezza richiesti.
#let bc-w = 2in
#let bc-h = 1.2in
#place(
  top + left,
  dx: bleed + trim-w - safe - bc-w,
  dy: cover-h - bleed - safe - bc-h,
)[
  #box(width: bc-w, height: bc-h, fill: white, radius: 1.5pt, stroke: 0.5pt + rgb("#b9c6d4"))[
    #align(center + horizon)[
      #text(size: 6.5pt, fill: rgb("#8a99a8"))[Spazio ISBN / codice a barre\ (assegnato da KDP)]
    ]
  ]
]
