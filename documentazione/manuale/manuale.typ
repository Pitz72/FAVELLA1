#import "lib/manuale-template.typ": *

#show: conf.with(titolo: "Manuale di Programmazione", autore: "Simone Pizzi")

// ---- FRONTE DEL LIBRO -------------------------------------------------------
#copertina(versione: "v0.29.0", autore: "Simone Pizzi")
#frontespizio(versione: "v0.29.0", autore: "Simone Pizzi")

// ---- DEDICA -----------------------------------------------------------------
#dedica[
  A Bonaventura Di Bello,#linebreak()
  che con le sue storie ci ha portato#linebreak()
  in quel mondo di mezzo tra computer e fantasia.
  #v(3mm)
  Grazie per tutta l'ispirazione.
]

// ---- INDICE -----------------------------------------------------------------
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
#include "capitoli/12-fine-partita.typ"
#include "capitoli/13-eventi-turni.typ"
#include "capitoli/14-demoni.typ"
#include "capitoli/15-buio-luce.typ"
#include "capitoli/16-personaggi-dialoghi.typ"
#include "capitoli/17-trasporto.typ"
#include "capitoli/18-moduli.typ"
#include "capitoli/19-comandi-giocatore.typ"
#include "capitoli/20-riepilogo.typ"

// ---- COLOPHON ---------------------------------------------------------------
#colophon(versione: "v0.29.0", autore: "Simone Pizzi")
