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
// Copertina dell'ebook (pagina singola, a piena pagina) nello stile premium del
// banner v1.0.0: fondo navy diagonale, aloni radiali, graffe-filigrana, pulviscolo,
// logo hero, wordmark in gradiente, versione nel gradiente di marca.
#let copertina(versione: "v1.0.0", autore: "Simone Pizzi", edizione: "Seconda edizione · 2026") = page(
  margin: 0pt,
  fill: gradient.linear(rgb("#081120"), rgb("#050b16"), rgb("#03070f"), angle: 145deg),
  header: none,
  footer: none,
)[
  #let ver = versione.replace("v", "")
  #let titleGrad = gradient.linear(rgb("#ffffff"), rgb("#c4d8ea"), angle: 90deg)
  #let brandGrad = gradient.linear(c.cyan, c.teal, c.emerald, c.amber)

  // Aloni radiali (ciano dietro il logo, teal dietro il titolo)
  #place(top + left, dx: 0pt, dy: 0pt)[
    #rect(width: 100%, height: 100%, stroke: none, fill: gradient.radial(
      c.cyan.transparentize(74%), c.cyan.transparentize(100%), center: (50%, 22%), radius: 56%))
  ]
  #place(top + left, dx: 0pt, dy: 0pt)[
    #rect(width: 100%, height: 100%, stroke: none, fill: gradient.radial(
      c.teal.transparentize(88%), c.teal.transparentize(100%), center: (50%, 46%), radius: 48%))
  ]
  // Graffe-filigrana ai bordi
  #place(horizon + left, dx: -0.55in, dy: 0pt)[
    #text(font: font-display, weight: 800, size: 760pt, fill: c.teal.transparentize(95%))[\{]
  ]
  #place(horizon + right, dx: 0.55in, dy: 0pt)[
    #text(font: font-display, weight: 800, size: 760pt, fill: c.teal.transparentize(95%))[\}]
  ]
  // Pulviscolo stellare
  #let star(fx, fy, r, op) = place(top + left, dx: fx * 100%, dy: fy * 100%)[
    #circle(radius: r, fill: rgb("#9fe9f5").transparentize(op), stroke: none)
  ]
  #star(0.16, 0.10, 1.4pt, 78%)
  #star(0.85, 0.14, 1.6pt, 72%)
  #star(0.78, 0.33, 1.2pt, 80%)
  #star(0.12, 0.52, 1.3pt, 82%)
  #star(0.88, 0.60, 1.4pt, 80%)
  // Vignettatura
  #place(top + left, dx: 0pt, dy: 0pt)[
    #rect(width: 100%, height: 100%, stroke: none, fill: gradient.radial(
      rgb("#000000").transparentize(100%), rgb("#000000").transparentize(48%), center: (50%, 48%), radius: 78%))
  ]

  // Blocco superiore: logo + titolo
  #place(top + center, dx: 0pt, dy: 0.8in)[
    #box(width: 84%)[
      #align(center)[
        #image("../assets/logo-hero.png", width: 3.3in)
        #v(0.34in)
        #text(font: font-display, size: 12pt, weight: 600, tracking: 5.5pt, fill: c.cyan-bright)[MOTORE DI NARRATIVA INTERATTIVA]
        #v(6mm)
        #text(font: font-display, size: 54pt, weight: 800, tracking: 1pt, fill: titleGrad)[FAVELLA 1]
        #v(3mm)
        #text(font: font-display, size: 30pt, weight: 800, tracking: 2pt, fill: brandGrad)[#ver]
        #v(5mm)
        #box(width: 46mm, line(length: 100%, stroke: 2pt + brandGrad))
        #v(6mm)
        #text(font: font-display, size: 20pt, weight: 600, fill: rgb("#dceaf6"))[Manuale di Programmazione]
      ]
    ]
  ]
  // Autore + edizione, in basso
  #place(bottom + center, dx: 0pt, dy: -0.8in)[
    #align(center)[
      #text(font: font-display, size: 12.5pt, weight: 500, fill: rgb("#cfe0ee"))[#autore]
      #v(3mm)
      #text(font: font-display, size: 9pt, weight: 500, tracking: 1.4pt, fill: rgb("#7c91a6"))[#upper(edizione)]
    ]
  ]
]

// =============================================================================
// FRONTESPIZIO + COLOPHON
// =============================================================================
// Frontespizio interno (pagina bianca): rispecchia ORDINE e CONTENUTI della
// copertina (occhiello «MOTORE…», FAVELLA 1, 1.0.0, linea, Manuale di Programmazione),
// adattati alla stampa interna — testo scuro su bianco, accenti di marca.
#let frontespizio(versione: "v1.0.0", edizione: "Seconda edizione · 2026", autore: "Simone Pizzi") = {
  let ver = versione.replace("v", "")
  let brandGrad = gradient.linear(c.cyan-dark, c.teal, c.emerald, c.amber)
  page(header: none, footer: none)[
    #v(1fr)
    #align(center)[
      #image("../assets/logo-hero.png", width: 2.1in)
      #v(9mm)
      #text(font: font-display, size: 11pt, weight: 600, tracking: 5pt, fill: c.cyan-dark)[MOTORE DI NARRATIVA INTERATTIVA]
      #v(6mm)
      #text(font: font-display, size: 40pt, weight: 800, tracking: 1pt, fill: c.ink)[FAVELLA 1]
      #v(2.5mm)
      #text(font: font-display, size: 22pt, weight: 800, tracking: 2pt, fill: brandGrad)[#ver]
      #v(5mm)
      #box(width: 46mm, line(length: 100%, stroke: 1.5pt + brandGrad))
      #v(6mm)
      #text(font: font-display, size: 17pt, weight: 600, fill: c.cyan-dark)[Manuale di Programmazione]
      #v(8mm)
      #text(font: font-display, size: 12pt, weight: 500, fill: c.ink)[#autore]
    ]
    #v(1fr)
    #align(center)[
      #text(font: font-display, size: 9.5pt, weight: 600, fill: c.cyan-dark, tracking: 0.5pt)[#edizione]
      #v(1.5mm)
      #text(font: font-mono, size: 9pt, fill: c.ink-soft)[Allineato al motore #versione]
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
#let colophon(versione: "v0.18.0", autore: "Simone Pizzi", edizione: "Seconda edizione · 2026") = {
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
      #edizione, allineata al motore #versione.
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
    // Trim standard KDP 6,69×9,61″ (169,93×244,09 mm). Gutter interno 23 mm
    // ben oltre il minimo KDP (9,5 mm fino a 150 pp.); margine esterno 18 mm.
    width: 6.69in,
    height: 9.61in,
    margin: (top: 24mm, bottom: 22mm, inside: 23mm, outside: 18mm),
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
    // Ogni capitolo apre su pagina dispari (recto, «bella pagina»): se serve,
    // Typst lascia bianco il verso precedente.
    pagebreak(to: "odd", weak: true)
    _capnum.step()
    block(above: 0pt, below: 0.9em)[
      #context text(font: font-display, size: 11pt, weight: 700, fill: c.cyan-dark, tracking: 2pt)[
        #upper("Capitolo " + str(_capnum.get().first()))
      ]
      #v(1mm)
      #text(font: font-display, size: 27pt, weight: 800, fill: c.ink, hyphenate: false)[#it.body]
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
