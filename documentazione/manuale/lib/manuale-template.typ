// =============================================================================
// manuale-template.typ — Identità tipografica del «Manuale di Programmazione»
// FAVELLA 1. Palette, font, copertina, impaginazione, titoli e box ricorrenti.
// =============================================================================

#import "fav.typ": fav, fav-inline, fav-colors

// --- PALETTE DI MARCA (da landingpage/tailwind.config.js) ---------------------
#let c = (
  void:    rgb("#03060d"),
  dark:    rgb("#050a14"),
  panel:   rgb("#0b1726"),
  surface: rgb("#0f2032"),
  brace:   rgb("#1e3a52"),
  cyan:        rgb("#22d3ee"),
  cyan-bright: rgb("#5cf3ff"),
  cyan-dark:   rgb("#0e7490"),
  emerald: rgb("#34d399"),
  emerald-dark: rgb("#0f766e"),
  teal:    rgb("#2dd4bf"),
  amber:   rgb("#f59e0b"),
  amber-dark: rgb("#b45309"),
  flame:   rgb("#fb923c"),
  ink:        rgb("#142433"),  // testo corpo (navy quasi-nero)
  ink-soft:   rgb("#3a4f63"),
  muted:      rgb("#5a728a"),
  rule:       rgb("#d7e2ec"),  // filetti chiari
  paper:      rgb("#ffffff"),
)

// --- FONT ---------------------------------------------------------------------
#let font-display = ("Sora", "Inter", "Segoe UI")
#let font-body    = ("Inter", "Segoe UI")
#let font-mono    = ("Source Code Pro", "Consolas")

// Contatore di capitolo dedicato (più prevedibile del counter(heading) interno).
#let _capnum = counter("fav-capitolo")

// =============================================================================
// COPERTINA — pagina a vivo, navy, fedele al mockup originale
// =============================================================================
#let copertina(versione: "v0.18.0", autore: "Simone Pizzi") = page(
  margin: 0pt,
  fill: gradient.linear(c.dark, c.surface, c.panel, angle: 145deg),
  header: none,
  footer: none,
)[
  // alone ciano molto tenue dietro l'emblema
  #place(top + center, dy: 24%)[
    #circle(radius: 95pt, fill: gradient.radial(c.cyan.transparentize(78%), c.panel.transparentize(100%)))
  ]
  #pad(x: 20mm, y: 22mm)[
    #set text(fill: white)
    #v(1fr)
    #align(center)[
      #box(fill: rgb("#eef4fa"), radius: 30pt, inset: 24pt, stroke: 1pt + c.brace)[
        #image("../assets/logo.png", width: 116pt)
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
    #v(1fr)
    #align(center)[
      #text(font: font-display, size: 12.5pt, weight: 500, fill: rgb("#cfe0ee"))[#autore]
      #v(2mm)
      #text(font: font-mono, size: 9.5pt, fill: c.cyan-bright, tracking: 1pt)[#versione]
    ]
  ]
]

// =============================================================================
// FRONTESPIZIO + COLOPHON
// =============================================================================
#let frontespizio(versione: "v0.18.0", data: "Edizione 2026", autore: "Simone Pizzi") = {
  page(header: none, footer: none)[
    #v(1fr)
    #align(center)[
      #image("../assets/logo.png", width: 52pt)
      #v(6mm)
      #text(font: font-display, size: 30pt, weight: 800, fill: c.ink)[FAVELLA 1]
      #v(2mm)
      #text(font: font-display, size: 16pt, weight: 500, fill: c.cyan-dark)[Manuale di Programmazione]
      #v(3mm)
      #text(font: font-body, size: 10.5pt, fill: c.muted)[Il linguaggio in cui l'italiano #emph[è] il codice]
      #v(7mm)
      #text(font: font-display, size: 12pt, weight: 500, fill: c.ink)[#autore]
    ]
    #v(1fr)
    #align(center)[
      #text(font: font-mono, size: 9pt, fill: c.ink-soft)[Motore #versione · #data]
    ]
    #v(8mm)
  ]
}

// Dedica — pagina d'apertura facoltativa (dopo il frontespizio). Non tocca
// l'impaginazione dei capitoli: vive in un proprio foglio, senza testatine.
#let dedica(testo) = {
  page(header: none, footer: none)[
    #v(1fr)
    #align(center)[
      #set text(font: font-body, size: 12pt, fill: c.ink-soft, style: "italic")
      #set par(leading: 0.95em, justify: false)
      #testo
    ]
    #v(2fr)
  ]
}

// Colophon — chiude il libro: chi, con cosa, con quali caratteri.
#let colophon(versione: "v0.18.0", autore: "Simone Pizzi") = {
  pagebreak(weak: true)
  page(header: none, footer: none)[
    #v(1fr)
    #align(center)[
      #image("../assets/logo.png", width: 40pt)
      #v(5mm)
      #set par(justify: false, leading: 0.85em)
      #set text(font: font-body, size: 9.5pt, fill: c.ink-soft)
      #text(font: font-display, size: 11pt, weight: 600, fill: c.ink)[FAVELLA 1 — Manuale di Programmazione]
      #v(3mm)
      Linguaggio, motore e manuale ideati e scritti da #text(fill: c.ink, weight: 600)[#autore].
      #linebreak()
      Allineato al motore #versione.
      #v(4mm)
      Composto con #link("https://typst.app")[Typst]. \
      Titoli in Sora, testo in Inter, codice in Source Code Pro. \
      Gli esempi sono tratti da «La Casa di Via Stradivari».
      #v(4mm)
      #box(width: 30mm, line(length: 100%, stroke: 1pt + gradient.linear(c.cyan, c.amber)))
    ]
    #v(1fr)
  ]
}

// =============================================================================
// BOX RICORRENTI
// =============================================================================
#let _callout(titolo, accent, sfondo, corpo) = block(
  width: 100%,
  fill: sfondo,
  stroke: (left: 3pt + accent),
  radius: (top-right: 4pt, bottom-right: 4pt),
  inset: (left: 12pt, rest: 10pt),
  above: 1.1em, below: 1.1em,
)[
  #text(font: font-display, size: 8pt, weight: 700, fill: accent, tracking: 1pt)[#upper(titolo)]
  #v(-0.3em)
  #set text(size: 9.8pt)
  #corpo
]

#let sintassi(corpo) = _callout("Sintassi", c.cyan-dark, rgb("#eef9fc"), corpo)
#let tranello(corpo) = _callout("⚠ Tranello", c.amber-dark, rgb("#fdf6ec"), corpo)
#let prova(corpo)    = _callout("Prova tu", c.emerald-dark, rgb("#edfaf4"), corpo)
#let nota(corpo)     = _callout("Nota", c.ink-soft, rgb("#f1f5f9"), corpo)

// Esempio tratto dalla storia guida: didascalia + blocco .fav evidenziato.
#let esempio(da: "«La Casa di Via Stradivari»", corpo) = block(above: 1.2em, below: 1.2em)[
  #text(font: font-display, size: 7.5pt, weight: 600, fill: c.muted, tracking: 0.8pt)[
    #upper("Esempio · " + da)
  ]
  #v(0.35em)
  #corpo
]

// =============================================================================
// CONFIGURAZIONE DOCUMENTO
// =============================================================================
#let conf(titolo: "Manuale di Programmazione", autore: "Simone Pizzi", doc) = {
  set document(title: "FAVELLA 1 — " + titolo, author: autore)

  set page(
    width: 170mm,
    height: 240mm,
    margin: (top: 24mm, bottom: 22mm, inside: 23mm, outside: 19mm),
    header: context {
      let pg = here().page()
      let h1 = query(heading.where(level: 1))
      let corrente = none
      for h in h1 { if h.location().page() <= pg { corrente = h } }
      if corrente != none {
        set text(font: font-body, size: 8pt, fill: c.muted)
        grid(
          columns: (1fr, auto),
          align(left)[FAVELLA 1 · Manuale di Programmazione],
          align(right)[#corrente.body],
        )
        v(-0.4em)
        line(length: 100%, stroke: 0.4pt + c.rule)
      }
    },
    footer: context {
      let pg = counter(page).get().first()
      if pg > 1 {
        set text(font: font-mono, size: 8.5pt, fill: c.ink-soft)
        align(center)[#pg]
      }
    },
  )

  set text(font: font-body, size: 10.5pt, fill: c.ink, lang: "it", hyphenate: true)
  set par(justify: true, leading: 0.72em, spacing: 0.95em, first-line-indent: 0pt)
  set heading(numbering: none)

  // Titoli
  show heading.where(level: 1): it => {
    pagebreak(weak: true)
    _capnum.step()
    block(above: 0pt, below: 0.9em)[
      #context text(font: font-display, size: 11pt, weight: 700, fill: c.cyan-dark, tracking: 2pt)[
        #upper("Capitolo " + str(_capnum.get().first()))
      ]
      #v(1mm)
      #text(font: font-display, size: 27pt, weight: 800, fill: c.ink)[#it.body]
      #v(2mm)
      #box(width: 38mm, line(length: 100%, stroke: 2.5pt + gradient.linear(c.cyan, c.emerald)))
    ]
    v(0.4em)
  }
  show heading.where(level: 2): it => block(above: 1.5em, below: 0.6em)[
    #text(font: font-display, size: 15pt, weight: 600, fill: c.surface)[#it.body]
  ]
  show heading.where(level: 3): it => block(above: 1.1em, below: 0.4em)[
    #text(font: font-display, size: 11.5pt, weight: 600, fill: c.cyan-dark)[#it.body]
  ]

  // Codice inline
  show raw.where(block: false): it => box(
    fill: rgb("#eef3f7"),
    radius: 2.5pt,
    inset: (x: 3.5pt, y: 0pt),
    outset: (y: 2.5pt),
  )[#text(font: font-mono, size: 0.86em, fill: c.cyan-dark)[#it]]

  // Enfasi
  show strong: set text(fill: c.surface)
  show link: set text(fill: c.cyan-dark)

  doc
}
