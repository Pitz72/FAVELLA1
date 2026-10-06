// =============================================================================
// copertina-kdp.typ — Copertina integrale (wrap) per Amazon KDP della «Guida di
// Favella Studio». Quarta di copertina + dorso + prima, in un unico foglio alle
// misure esatte con abbondanza (bleed). Stesso formato e stessa carta del
// Manuale di Programmazione di FAVELLA 1: sono due libri della stessa collana.
//
//   Trim libro          : 6,69 × 9,61″  (169,93 × 244,09 mm)
//   Pagine (interno KDP) : 56  →  guida-interno-kdp.pdf   (multiplo di 4)
//   Carta                : bianca, colore standard → dorso 56 × 0,002252″
//   Bleed                : 0,125″ (3,175 mm) su ogni lato esterno
//
// Wrap risultante: 13,756 × 9,860″  ≈  349,4 × 250,4 mm  (dorso 3,20 mm).
//
// ⚠ Se cambia il numero di pagine dell'interno, ricalcola `pagine` qui sotto.
// ⚠ Dorso < 79 pp.: niente testo sul dorso (regola KDP); resta un filetto di marca.
// ⚠ La versione e l'edizione stanno in lib/guida.typ (le stesse dell'interno).
// Build: pwsh build-kdp.ps1   (o: typst compile --font-path ../../documentazione/manuale/fonts copertina-kdp.typ <uscita>.pdf)
// =============================================================================

#import "lib/guida.typ": STUDIO, MOTORE, EDIZIONE

// --- PALETTE (identica a quella della guida e del manuale) -----------------------
#let k = (
  navy0: rgb("#0a1526"), navy1: rgb("#050b16"), navy2: rgb("#02050b"),
  panel: rgb("#0b1726"),
  cyan: rgb("#22d3ee"), cyan-bright: rgb("#5cf3ff"), teal: rgb("#2dd4bf"),
  emerald: rgb("#34d399"), amber: rgb("#f59e0b"),
  muted: rgb("#7c91a6"), soft: rgb("#cfe0ee"), ice: rgb("#eaf4fb"),
)
#let display = ("Sora", "Inter", "Segoe UI")
#let body = ("Inter", "Segoe UI")
#let mono = ("Source Code Pro", "Consolas")
#let brand = gradient.linear(k.cyan, k.teal, k.emerald, k.amber)
#let fondo = gradient.linear(k.navy0, k.navy1, k.navy2, angle: 155deg)

// --- GEOMETRIA ---------------------------------------------------------------
#let trim-w = 6.69in
#let trim-h = 9.61in
#let bleed  = 0.125in
#let pagine = 56
#let mult   = 0.002252in         // bianca, BN / colore standard
#let spine  = pagine * mult       // ≈ 0,12611″ (3,20 mm)
#let safe   = 0.25in              // margine di sicurezza dai tagli e dalle pieghe

#let cover-w = 2 * trim-w + spine + 2 * bleed
#let cover-h = trim-h + 2 * bleed
#let pannello-w = trim-w + bleed   // un pannello, abbondanza esterna compresa

#set page(width: cover-w, height: cover-h, margin: 0pt, fill: rgb("#050b16"))

// --- PRIMA DI COPERTINA --------------------------------------------------------
#let fronte(w, h, ins) = {
  let iw = w - ins.left - ins.right
  let ih = h - ins.top - ins.bottom
  box(width: w, height: h, clip: true, fill: fondo)[
    #place(top + left, rect(width: w, height: h, stroke: none, fill: gradient.radial(
      k.emerald.transparentize(80%), k.emerald.transparentize(100%), center: (50%, 22%), radius: 50%)))
    #place(top + left, rect(width: w, height: h, stroke: none, fill: gradient.radial(
      k.cyan.transparentize(86%), k.cyan.transparentize(100%), center: (50%, 78%), radius: 55%)))

    #place(top + left, dx: ins.left, dy: ins.top)[
      #box(width: iw)[#align(center)[
        #text(font: display, size: 8.6pt, weight: 600, tracking: 4.4pt, fill: k.cyan-bright)[GUIDA ALL'USO]
      ]]
    ]
    #place(top + left, dx: ins.left, dy: ins.top + ih * 0.05)[
      #box(width: iw)[#align(center)[#image("immagini/marchio-studio.png", width: iw * 0.22, alt: "Il marchio di Favella Studio")]]
    ]
    #place(top + left, dx: ins.left, dy: ins.top + ih * 0.235)[
      #box(width: iw)[#align(center)[#stack(dir: ttb, spacing: 4.2mm,
        text(font: display, size: 44pt, weight: 800, tracking: 0.5pt,
          fill: gradient.linear(white, rgb("#bcd3e6"), angle: 90deg))[Favella Studio],
        box(inset: (x: 11pt, y: 4.5pt), radius: 20pt, stroke: 1.2pt + brand)[
          #text(font: mono, size: 11pt, weight: 600, tracking: 2.2pt, fill: k.soft)[#STUDIO]
        ],
        text(font: display, size: 14.5pt, weight: 600, fill: k.soft)[L'ambiente di scrittura\ per FAVELLA 1],
      )]]
    ]
    // la finestra dell'app
    #place(top + left, dx: ins.left, dy: ins.top + ih * 0.495)[
      #box(width: iw, radius: 7pt, clip: true,
        stroke: 1pt + gradient.linear(k.cyan.transparentize(30%), k.emerald.transparentize(50%), k.amber.transparentize(30%), angle: 20deg))[
        #image("immagini/aspetto-notte.png", width: iw, alt: "Favella Studio col tema notte: la scheda di una stanza")
      ]
    ]
    #place(bottom + left, dx: ins.left, dy: -ins.bottom)[
      #box(width: iw)[#align(center)[
        #text(font: display, size: 12.5pt, weight: 500, fill: k.soft)[Simone Pizzi]
        #v(2.6mm)
        #text(font: display, size: 8.6pt, weight: 600, tracking: 1.6pt, fill: k.muted)[#upper(EDIZIONE)]
      ]]
    ]
  ]
}

// --- QUARTA DI COPERTINA -------------------------------------------------------
#let retro(w, h, ins) = {
  let iw = w - ins.left - ins.right
  let isbn-w = 2in
  let isbn-h = 1.2in
  box(width: w, height: h, clip: true, fill: fondo)[
    #place(top + left, rect(width: w, height: h, stroke: none, fill: gradient.radial(
      k.cyan.transparentize(88%), k.cyan.transparentize(100%), center: (50%, 14%), radius: 55%)))
    #place(top + left, rect(width: w, height: h, stroke: none, fill: gradient.radial(
      k.emerald.transparentize(92%), k.emerald.transparentize(100%), center: (50%, 85%), radius: 55%)))

    #place(top + left, dx: ins.left, dy: ins.top)[
      #box(width: iw)[#align(center)[
        #image("immagini/marchio-studio.png", width: 34pt, alt: "Il marchio di Favella Studio")
        #v(3mm)
        #text(font: display, size: 12pt, weight: 700, tracking: 2.4pt, fill: k.soft)[FAVELLA STUDIO]
      ]]
    ]

    #place(top + left, dx: ins.left + iw * 0.04, dy: ins.top + 88pt)[
      #box(width: iw * 0.92)[
        #set par(justify: false, leading: 0.74em, spacing: 0.95em)
        #set text(font: body, size: 10.3pt, fill: rgb("#cddcea"))
        #align(center)[#text(font: display, size: 15pt, weight: 700, fill: white)[Scrivi la tua avventura,\ senza perderti fra i file.]]
        #v(5mm)
        Favella Studio è l'ambiente di scrittura per FAVELLA 1, il linguaggio in cui il codice
        è una frase italiana col punto in fondo. Il testo, le stanze con una mappa da trascinare,
        gli oggetti, i personaggi e i loro dialoghi, le regole e la prova della storia con i
        pulsanti-verbo: tutto in un'app sola, gratuita e open source, per Windows e Linux.

        Questa guida ti accompagna passo per passo, schermata dopo schermata, sulla storia
        d'esempio «La Casa di Via Stradivari»: come si crea una stanza, come si collega, come
        si scrive una regola o un dialogo, come si prova e si regala la storia. E come si
        torna indietro quando qualcosa va storto.

        #text(fill: k.soft)[Studio si legge anche a occhi stanchi: tema notte o carta, contrasto
        alto, interfaccia ingrandibile e tutto raggiungibile da tastiera. Il linguaggio si
        impara nel «Manuale di Programmazione» di FAVELLA 1.]
        #v(2mm)
        #align(center)[
          #text(style: "italic", fill: rgb("#9fb4c8"), size: 10pt)[Per chi ha una storia da scrivere, e vuole vederla nascere.]
        ]
      ]
    ]

    #place(bottom + left, dx: ins.left, dy: -ins.bottom)[
      #text(font: display, size: 8pt, weight: 500, fill: k.muted)[Guida all'uso · Favella Studio #STUDIO · #EDIZIONE]
    ]
    // spazio dell'ISBN (KDP lo sovrastampa): area bianca pulita
    #place(bottom + right, dx: -ins.right, dy: -ins.bottom)[
      #box(width: isbn-w, height: isbn-h, fill: white, radius: 1.5pt)[
        #align(center + horizon)[
          #text(size: 6.5pt, fill: rgb("#8a99a8"))[Spazio ISBN / codice a barre\ (assegnato da KDP)]
        ]
      ]
    ]
  ]
}

// quarta di copertina (sinistra): l'abbondanza è a sinistra, in alto e in basso
#place(top + left)[
  #retro(pannello-w, cover-h,
    (top: bleed + safe + 0.1in, right: safe, bottom: bleed + safe, left: bleed + safe))
]

// prima di copertina (destra): l'abbondanza è a destra, in alto e in basso
#place(top + left, dx: bleed + trim-w + spine)[
  #fronte(pannello-w, cover-h,
    (top: bleed + safe + 0.1in, right: bleed + safe, bottom: bleed + safe + 0.05in, left: safe))
]

// dorso: nessun testo (sotto le 79 pagine), solo il filetto di marca al centro
#place(top + left, dx: bleed + trim-w, dy: 0pt)[
  #box(width: spine, height: cover-h, fill: gradient.linear(rgb("#071020"), rgb("#050b16"), angle: 90deg))
]
#place(top + left, dx: bleed + trim-w + spine / 2 - 0.5pt, dy: cover-h * 0.12)[
  #rect(width: 1pt, height: cover-h * 0.76, stroke: none, fill: gradient.linear(
    (rgb("#22d3ee").transparentize(100%), 0%), (rgb("#34d399"), 35%), (rgb("#f59e0b"), 70%),
    (rgb("#f59e0b").transparentize(100%), 100%), angle: 90deg))
]
