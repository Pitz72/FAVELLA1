// =============================================================================
// copertina-arte.typ — La copertina del «Manuale di Programmazione» (3ª edizione).
// Un solo disegno, due usi: la copertina dell'ebook (pagina intera) e la prima +
// quarta della copertina wrap per KDP (copertina-kdp.typ).
//
// Idea: FAVELLA 1 è «il codice è una frase italiana col punto in fondo». In primo
// piano ci sono perciò tre frasi vere, coi punti in ambra; dietro, come una mappa
// del tabellone di un'avventura testuale, le stanze della «Casa di Via Stradivari»
// collegate dalle loro uscite, con un segno ambra dove si trova il giocatore.
//
// Questo file NON importa nulla (così lo possono usare sia il template sia la
// copertina KDP senza dipendenze circolari): la palette è ripetuta qui, identica a
// quella di manuale-template.typ.
// =============================================================================

#let _k = (
  navy0: rgb("#0a1526"), navy1: rgb("#050b16"), navy2: rgb("#02050b"),
  panel: rgb("#0b1726"), brace: rgb("#1e3a52"),
  cyan: rgb("#22d3ee"), cyan-bright: rgb("#5cf3ff"), teal: rgb("#2dd4bf"),
  emerald: rgb("#34d399"), amber: rgb("#f59e0b"), flame: rgb("#fb923c"),
  muted: rgb("#7c91a6"), soft: rgb("#cfe0ee"), ice: rgb("#eaf4fb"),
)
#let _display = ("Sora", "Inter", "Segoe UI")
#let _body = ("Inter", "Segoe UI")
#let _mono = ("Source Code Pro", "Consolas")
#let _brand = gradient.linear(_k.cyan, _k.teal, _k.emerald, _k.amber)
#let _fondo = gradient.linear(_k.navy0, _k.navy1, _k.navy2, angle: 155deg)

// -----------------------------------------------------------------------------
// LA MAPPA — stanze e uscite sul fondo. `w`×`h` è l'area; `tono` (0–1) ne regola
// l'intensità (la quarta di copertina la vuole più discreta).
// -----------------------------------------------------------------------------
#let mappa(w, h, tono: 1.0) = {
  // (nome, x, y, larghezza, altezza, accesa) — frazioni di w e h
  let stanze = (
    ("ingresso",  0.05, 0.05, 0.20, 0.085, false),
    ("soggiorno", 0.38, 0.02, 0.25, 0.100, true),
    ("studio",    0.74, 0.07, 0.21, 0.085, false),
    ("corridoio", 0.12, 0.27, 0.22, 0.080, false),
    ("cucina",    0.47, 0.60, 0.24, 0.105, true),
    ("soffitta",  0.77, 0.30, 0.18, 0.085, false),
    ("cantina",   0.05, 0.52, 0.20, 0.090, false),
    ("giardino",  0.33, 0.27, 0.27, 0.105, false),
    ("orto",      0.74, 0.58, 0.20, 0.090, false),
    ("pozzo",     0.12, 0.80, 0.16, 0.075, false),
    ("capanno",   0.74, 0.82, 0.20, 0.080, false),
  )
  let uscite = ((0, 1), (1, 2), (0, 3), (1, 4), (3, 4), (4, 5), (2, 5), (3, 6),
                (4, 7), (6, 7), (7, 8), (5, 8), (6, 9), (7, 10), (8, 10))
  let cx(i) = (stanze.at(i).at(1) + stanze.at(i).at(3) / 2) * w
  let cy(i) = (stanze.at(i).at(2) + stanze.at(i).at(4) / 2) * h
  // la mappa svanisce in alto (dove c'è il titolo) e in basso (dove c'è l'autore)
  let sfuma(y) = calc.min(1.0, calc.max(0.0, calc.min(y / 0.30, (1.02 - y) / 0.20)))
  let filo(y) = 0.9pt + _k.cyan.transparentize(100% - 42% * tono * sfuma(y))

  box(width: w, height: h, clip: true)[
    // uscite: due tratti ortogonali da centro a centro (le stanze le coprono)
    #for (a, b) in uscite {
      place(top + left, line(start: (cx(a), cy(a)), end: (cx(b), cy(a)), stroke: filo(cy(a) / h)))
      place(top + left, line(start: (cx(b), cy(a)), end: (cx(b), cy(b)), stroke: filo((cy(a) + cy(b)) / 2 / h)))
    }
    // le stanze
    #for (nome, x, y, rw, rh, accesa) in stanze {
      let f = tono * sfuma(y + rh / 2)
      let tinta = if accesa { _k.emerald } else { _k.cyan }
      place(top + left, dx: x * w, dy: y * h)[
        #box(
          width: rw * w, height: rh * h, radius: 4pt,
          fill: if accesa { _k.emerald.transparentize(100% - 17% * f) }
                else { _k.panel.transparentize(100% - 78% * f) },
          stroke: 0.9pt + tinta.transparentize(100% - (if accesa { 78% } else { 46% }) * f),
        )[
          #align(center + horizon)[
            #text(font: _mono, size: 6.6pt, tracking: 0.8pt,
              fill: tinta.transparentize(100% - (if accesa { 90% } else { 58% }) * f))[#upper(nome)]
          ]
        ]
      ]
    }
    // il giocatore: un punto ambra con l'alone, nella cucina
    #let px = (stanze.at(4).at(1) + stanze.at(4).at(3) * 0.78) * w
    #let py = cy(4)
    #let fp = tono * sfuma(py / h)
    #place(top + left, dx: px - 26pt, dy: py - 26pt)[
      #circle(radius: 26pt, stroke: none,
        fill: gradient.radial(_k.amber.transparentize(100% - 62% * fp), _k.amber.transparentize(100%)))
    ]
    #place(top + left, dx: px - 3.4pt, dy: py - 3.4pt)[
      #circle(radius: 3.4pt, fill: _k.amber.transparentize(100% - 100% * calc.min(1.0, fp * 1.5)), stroke: none)
    ]
  ]
}

// -----------------------------------------------------------------------------
// Le tre frasi, nella scheda scura. I punti sono la firma della copertina.
// -----------------------------------------------------------------------------
#let _frasi(corpo: 15.5pt) = {
  let nome(t) = text(fill: white, weight: 600)[#t]
  let verbo(t) = text(fill: _k.cyan-bright)[#t]
  let punto = text(fill: _k.amber, weight: 800, size: corpo * 1.18)[.]
  set text(font: _mono, size: corpo, weight: 500, fill: _k.soft)
  set par(leading: 0.78em, spacing: 0.78em)
  [#nome[La cucina] #verbo[è una stanza]#punto]
  linebreak()
  [#nome[Il tavolo] #verbo[è nella] #nome[cucina]#punto]
  linebreak()
  [#nome[Il giocatore] #verbo[è nella] #nome[cucina]#punto]
}

// -----------------------------------------------------------------------------
// LA PRIMA DI COPERTINA.
//   w, h   dimensioni dell'area (a vivo: comprendono l'abbondanza, se c'è)
//   ins    margini di sicurezza (top, right, bottom, left) entro cui sta il testo
// -----------------------------------------------------------------------------
#let fronte(w, h, ins: (top: 36pt, right: 36pt, bottom: 36pt, left: 36pt),
            versione: "v1.4.1", edizione: "Terza edizione · 2026",
            autore: "Simone Pizzi", logo: "../assets/logo-hero.png") = {
  let iw = w - ins.left - ins.right
  let ih = h - ins.top - ins.bottom
  let ver = versione.replace("v", "")

  box(width: w, height: h, clip: true, fill: _fondo)[
    // alba dietro il logo e velo teal sotto il titolo
    #place(top + left, rect(width: w, height: h, stroke: none, fill: gradient.radial(
      _k.cyan.transparentize(70%), _k.cyan.transparentize(100%), center: (50%, 21%), radius: 52%)))
    #place(top + left, rect(width: w, height: h, stroke: none, fill: gradient.radial(
      _k.teal.transparentize(90%), _k.teal.transparentize(100%), center: (50%, 52%), radius: 55%)))

    // la mappa, nella metà bassa, sfumata verso l'alto
    #place(top + left, dy: h * 0.50)[#mappa(w, h * 0.50, tono: 0.9)]

    // occhiello
    #place(top + left, dx: ins.left, dy: ins.top)[
      #box(width: iw)[#align(center)[
        #text(font: _display, size: 8.6pt, weight: 600, tracking: 4.4pt, fill: _k.cyan-bright)[MANUALE DI PROGRAMMAZIONE]
      ]]
    ]

    // il logo, su un disco di luce così le graffe navy si leggono
    #let lw = iw * 0.46
    #let ly = ins.top + ih * 0.085
    #let rd = lw * 0.60
    #place(top + left, dx: w / 2 - rd, dy: ly + lw * 0.245 - rd)[
      #circle(radius: rd, stroke: none, fill: gradient.radial(
        (_k.ice.transparentize(6%), 0%), (_k.ice.transparentize(14%), 55%), (_k.ice.transparentize(100%), 100%)))
    ]
    #place(top + left, dx: (w - lw) / 2, dy: ly)[#image(logo, width: lw)]

    // titolo, versione, sottotitolo
    #place(top + left, dx: ins.left, dy: ins.top + ih * 0.325)[
      #box(width: iw)[#align(center)[#stack(dir: ttb, spacing: 4.5mm,
        text(font: _display, size: 53pt, weight: 800, tracking: 1.2pt,
          fill: gradient.linear(white, rgb("#bcd3e6"), angle: 90deg))[FAVELLA 1],
        box(inset: (x: 11pt, y: 4.5pt), radius: 20pt, stroke: 1.2pt + _brand)[
          #text(font: _mono, size: 11.5pt, weight: 600, tracking: 2.2pt, fill: _k.soft)[#ver]
        ],
        text(font: _display, size: 15.5pt, weight: 600, fill: _k.soft)[
          Il linguaggio della narrativa interattiva\ in italiano
        ],
      )]]
    ]

    // la scheda con le tre frasi
    #place(top + left, dx: ins.left + iw * 0.075, dy: ins.top + ih * 0.625)[
      #box(width: iw * 0.85, inset: (x: 15pt, y: 12pt), radius: 7pt,
        fill: _k.navy2.transparentize(8%),
        stroke: 1pt + gradient.linear(_k.cyan.transparentize(35%), _k.emerald.transparentize(55%), _k.amber.transparentize(35%), angle: 20deg))[
        #_frasi()
        #v(7pt)
        #line(length: 100%, stroke: 0.6pt + _k.cyan.transparentize(72%))
        #v(5pt)
        #text(font: _mono, size: 9pt, fill: _k.emerald.transparentize(8%))[› La cucina esiste. C'è un tavolo.]
      ]
    ]

    // autore + edizione, in basso
    #place(bottom + left, dx: ins.left, dy: -ins.bottom)[
      #box(width: iw)[#align(center)[
        #text(font: _display, size: 12.5pt, weight: 500, fill: _k.soft)[#autore]
        #v(2.6mm)
        #text(font: _display, size: 8.6pt, weight: 600, tracking: 1.6pt, fill: _k.muted)[#upper(edizione)]
      ]]
    ]
  ]
}

// -----------------------------------------------------------------------------
// LA QUARTA DI COPERTINA (solo per il wrap di stampa). Stesso fondo e stessa mappa,
// ma discreta: sopra c'è il testo di presentazione e lo spazio del codice ISBN.
// -----------------------------------------------------------------------------
#let retro(w, h, ins: (top: 36pt, right: 36pt, bottom: 36pt, left: 36pt),
           versione: "v1.4.1", edizione: "Terza edizione · 2026",
           logo: "../assets/logo.png") = {
  let iw = w - ins.left - ins.right
  let ver = versione.replace("v", "")
  let isbn-w = 2in
  let isbn-h = 1.2in

  box(width: w, height: h, clip: true, fill: _fondo)[
    #place(top + left, dy: h * 0.52)[#mappa(w, h * 0.48, tono: 0.6)]
    #place(top + left, rect(width: w, height: h, stroke: none, fill: gradient.radial(
      _k.cyan.transparentize(88%), _k.cyan.transparentize(100%), center: (50%, 14%), radius: 55%)))

    // marchio in alto
    #place(top + left, dx: ins.left, dy: ins.top)[
      #box(width: iw)[#align(center)[
        #box(fill: _k.ice, radius: 9pt, inset: 6pt)[#image(logo, width: 26pt)]
        #v(3mm)
        #text(font: _display, size: 12pt, weight: 700, tracking: 2.4pt, fill: _k.soft)[FAVELLA 1]
      ]]
    ]

    // testo
    #place(top + left, dx: ins.left + iw * 0.04, dy: ins.top + 90pt)[
      #box(width: iw * 0.92)[
        #set par(justify: false, leading: 0.74em, spacing: 0.95em)
        #set text(font: _body, size: 10.6pt, fill: rgb("#cddcea"))
        #align(center)[#text(font: _display, size: 15pt, weight: 700, fill: white)[Scrivi una storia.\ Ottieni un mondo.]]
        #v(5mm)
        In FAVELLA 1 il codice è una frase italiana col punto in fondo. Niente graffe,
        niente variabili criptiche: scrivi
        #text(font: _mono, size: 9.4pt, fill: _k.cyan-bright)[La cucina è una stanza]#text(fill: _k.amber, weight: 800)[.]
        e la cucina esiste, pronta da esplorare.

        Questo manuale ti porta dalla prima riga a un'avventura testuale intera,
        costruita un pezzo alla volta: stanze e oggetti, regole che rispondono a ciò che
        fa il giocatore, personaggi con cui parlare, meccanismi che scattano da soli
        quando il tempo passa. Ogni costrutto lo vedi al lavoro dentro «La Casa di Via
        Stradivari», una storia che si gioca davvero.

        #text(fill: _k.soft)[Questa #lower(edizione.split(" ").first())
        edizione è allineata a FAVELLA #ver: salvataggi, collaudo che gioca,
        sinonimi d'autore e pulsanti-verbo.]
        #v(2mm)
        #align(center)[
          #text(style: "italic", fill: rgb("#9fb4c8"), size: 10pt)[Per chi ha sempre voluto raccontare un mondo, e farlo rispondere.]
        ]
      ]
    ]

    // marchio editoriale
    #place(bottom + left, dx: ins.left, dy: -ins.bottom)[
      #text(font: _display, size: 8pt, weight: 500, fill: _k.muted)[Manuale ufficiale · #edizione]
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
