// =============================================================================
// Favella Studio — Guida all'uso. Sorgente principale.
// Compilare con build.ps1 (o build.sh): Typst ≥ 0.14, font del manuale di FAVELLA.
// Le schermate si rifanno con landingpage/scripts/foto-guida-studio.mjs.
// =============================================================================
#import "lib/guida.typ": *

#show: conf

// Nell'interno per la stampa la copertina è un file a sé (copertina-kdp.typ).
#if not per-kdp { copertina() }
#frontespizio()
#colophon()

// ---- INDICE -------------------------------------------------------------------
#if per-kdp { pagebreak(to: "odd", weak: true) }
#page(header: none)[
  #text(font: font-display, size: 24pt, weight: 800, fill: c.ink)[Indice]
  #v(2mm)
  #box(width: 40mm, line(length: 100%, stroke: 2.5pt + gradient.linear(c.cyan, c.emerald)))
  #v(7mm)
  #set text(size: 11pt)
  // Solo regole «set»: un PDF accessibile (PDF/UA) vuole le voci dell'indice intatte.
  #show outline.entry.where(level: 1): set text(weight: 700, fill: c.surface)
  #show outline.entry.where(level: 1): set block(above: 1.1em)
  #outline(title: none, depth: 2, indent: 1.4em)
]

// ---- CAPITOLI -----------------------------------------------------------------
#include "capitoli/01-benvenuto.typ"
#include "capitoli/02-installare.typ"
#include "capitoli/03-finestra.typ"
#include "capitoli/04-storia.typ"
#include "capitoli/05-stanze.typ"
#include "capitoli/06-oggetti.typ"
#include "capitoli/07-mappa.typ"
#include "capitoli/08-personaggi.typ"
#include "capitoli/09-regole.typ"
#include "capitoli/10-stati-parole.typ"
#include "capitoli/11-prova.typ"
#include "capitoli/12-sicurezza.typ"
#include "capitoli/13-leggibilita.typ"
#include "capitoli/14-scorciatoie.typ"

// ---- PADDING A MULTIPLO DI 4 (obbligo brossura KDP) --------------------------------
// Solo per l'interno di stampa: pagine vacat in coda, senza testatina né numero.
#if per-kdp {
  pagebreak(weak: true)
  context {
    let contenuto = here().page() - 1
    let pad = calc.rem(4 - calc.rem(contenuto, 4), 4)
    for _ in range(pad) {
      page(header: none, footer: none)[#hide[·]]
    }
  }
}
