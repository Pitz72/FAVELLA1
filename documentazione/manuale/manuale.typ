#import "lib/manuale-template.typ": *

// Versione del motore ed etichetta d'edizione: un solo punto di verità.
#let MOTORE = "v1.0.0"
#let EDIZIONE = "Seconda edizione · 2026"

// Due tirature dalla stessa sorgente:
//  • digitale (default) — include la copertina navy a pagina intera;
//  • interno KDP (`--input kdp=1`) — parte dal frontespizio, senza copertina,
//    perché in stampa la copertina è un file a sé (nel kit KDP esterno).
#let per-kdp = "kdp" in sys.inputs

#show: conf.with(titolo: "Manuale di Programmazione", autore: "Simone Pizzi")

// ---- FRONTE DEL LIBRO -------------------------------------------------------
#if not per-kdp {
  copertina(versione: MOTORE, autore: "Simone Pizzi", edizione: EDIZIONE)
}
#frontespizio(versione: MOTORE, autore: "Simone Pizzi", edizione: EDIZIONE)

// ---- COLOPHON / PAGINA DEI DIRITTI (p2, verso del frontespizio) --------------
#colophon(versione: MOTORE, autore: "Simone Pizzi", edizione: EDIZIONE)

// ---- DEDICA (p3, recto) -----------------------------------------------------
#pagebreak(to: "odd", weak: true)
#dedica[
  A Bonaventura Di Bello,#linebreak()
  che con le sue storie ci ha portato#linebreak()
  in quel mondo di mezzo tra computer e fantasia.
  #v(3mm)
  Grazie per tutta l'ispirazione.

  #v(8mm)
  #box(width: 22mm, line(length: 100%, stroke: 0.8pt + gradient.linear(c.cyan, c.amber)))
  #v(8mm)

  A Pietro Bernasconi,#linebreak()
  che ha spinto FAVELLA dove non era stata pensata per andare#linebreak()
  e così le ha insegnato a fare cose che non sapeva ancora fare.
  #v(3mm)
  Alcune di queste pagine esistono per merito suo.
]

// ---- INDICE (recto) ---------------------------------------------------------
#pagebreak(to: "odd", weak: true)
#page(header: none)[
  #text(font: font-display, size: 22pt, weight: 800, fill: c.ink)[Indice]
  #v(2mm)
  #box(width: 38mm, line(length: 100%, stroke: 2.5pt + gradient.linear(c.cyan, c.emerald)))
  #v(6mm)
  #outline(title: none, depth: 2, indent: 1.2em)
]

// ---- CAPITOLI (in ordine) ---------------------------------------------------
#include "capitoli/01-introduzione.typ"
#include "capitoli/02-installazione.typ"
#include "capitoli/03-anatomia-frase.typ"
#include "capitoli/04-stanze.typ"
#include "capitoli/05-topologia.typ"
#include "capitoli/06-oggetti.typ"
#include "capitoli/07-proprieta.typ"
#include "capitoli/08-contenitori-supporti.typ"
#include "capitoli/09-stati-contatori.typ"
#include "capitoli/10-regole-invece-di.typ"
#include "capitoli/11-logica-conseguenze.typ"
#include "capitoli/11b-caso-quantita.typ"
#include "capitoli/12-fine-partita.typ"
#include "capitoli/13-eventi-turni.typ"
#include "capitoli/14-demoni.typ"
#include "capitoli/15-buio-luce.typ"
#include "capitoli/16-personaggi-dialoghi.typ"
#include "capitoli/17-trasporto.typ"
#include "capitoli/18-moduli.typ"
#include "capitoli/19-comandi-giocatore.typ"
#include "capitoli/20-riepilogo.typ"

// ---- PADDING A MULTIPLO DI 4 (obbligo brossura KDP) --------------------------
// Solo per l'interno di stampa: aggiunge pagine vacat (senza testatine né numero)
// finché il totale è multiplo di 4. L'ebook non viene impaginato con pagine bianche.
#if per-kdp {
  // Normalizza il cursore all'inizio della prima pagina libera dopo il contenuto:
  // così `here().page() - 1` è sempre l'ultima pagina di contenuto, a prescindere
  // dal fatto che l'ultimo capitolo riempia o no la pagina fino in fondo.
  pagebreak(weak: true)
  context {
    let contenuto = here().page() - 1
    let pad = calc.rem(4 - calc.rem(contenuto, 4), 4)
    for _ in range(pad) {
      page(header: none, footer: none)[#hide[·]]
    }
  }
}
