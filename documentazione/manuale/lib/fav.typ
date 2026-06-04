// =============================================================================
// fav.typ — Evidenziatore di sintassi per il linguaggio FAVELLA 1 (.fav)
//
// Espone:
//   #fav(```...```)            blocco di codice .fav evidenziato (tema scuro di marca)
//   #fav-inline("...")         frammento .fav inline
//
// L'evidenziazione segue la filosofia «il codice è prosa»: si illuminano solo
// le PAROLE STRUTTURALI (copule, verbi-chiave, tipi, marcatori), le stringhe, i
// numeri, i commenti e le interpolazioni [var]. Articoli e preposizioni restano
// nel colore del testo, così la frase si legge come italiano.
// =============================================================================

#let fav-colors = (
  bg:      rgb("#0b1726"),   // navy panel
  border:  rgb("#1e3a52"),   // brace
  text:    rgb("#e8f0f8"),   // testo codice
  keyword: rgb("#5cf3ff"),   // ciano brillante — parole strutturali
  string:  rgb("#34d399"),   // smeraldo — stringhe
  comment: rgb("#5a728a"),   // muted — commenti
  number:  rgb("#f59e0b"),   // ambra — numeri
  interp:  rgb("#fb923c"),   // fiamma — interpolazioni [var]
  punct:   rgb("#9fb4c9"),   // punteggiatura
)

// Parole che «si illuminano». Volutamente NON include articoli e preposizioni
// generiche (di/del/in/su/con/a/e), per non appesantire la lettura.
#let fav-keywords = (
  // tipi e dichiarazioni
  "stanza", "cosa", "contenitore", "supporto", "personaggio",
  "stato", "contatore", "comando", "direzioni", "dialogo",
  // copule e connettori semantici
  "è", "sono", "collega", "comincia", "inizia", "parte",
  "dice", "conduce", "diventa", "ha", "dà", "chiama", "anche", "si",
  // regole
  "Invece", "se", "dire", "oppure", "non", "adesso", "chiude",
  // conseguenze
  "aumenta", "diminuisci", "vinci", "perdi", "termina", "portare", "può",
  // quantificatori / confronti / proprietà speciali
  "almeno", "massimo", "meno", "più", "prendibile", "opposte",
  // tempo e demoni
  "Al", "turno", "turni", "Ogni", "Quando", "vera",
  // varie
  "Includi", "nodo", "opzione", "nulla", "inventario", "giocatore", "oggetti", "spazi",
  // direzioni di base
  "nord", "sud", "est", "ovest",
)

#let _is-word(c) = c.match(regex("^[\p{L}\p{N}']$")) != none

#let _render-word(w) = {
  if w in fav-keywords {
    text(fill: fav-colors.keyword, weight: "medium", w)
  } else if w.match(regex("^[0-9]+$")) != none {
    text(fill: fav-colors.number, w)
  } else {
    text(fill: fav-colors.text, w)
  }
}

// Rende una stringa "..." evidenziando le interpolazioni [var] in fiamma.
#let _render-string(s) = {
  let ms = s.matches(regex("\[[^\]]*\]"))
  if ms.len() == 0 {
    return text(fill: fav-colors.string, s)
  }
  let out = ()
  let pos = 0
  for m in ms {
    if m.start > pos { out.push(text(fill: fav-colors.string, s.slice(pos, m.start))) }
    out.push(text(fill: fav-colors.interp, weight: "bold", m.text))
    pos = m.end
  }
  if pos < s.len() { out.push(text(fill: fav-colors.string, s.slice(pos))) }
  out.join()
}

#let _render-line(line) = {
  let cl = line.clusters()
  let i = 0
  let out = ()
  let leading = true
  while i < cl.len() {
    let c = cl.at(i)
    if c == "\"" {
      // stringa fino alla " di chiusura (rispetta l'escape \")
      let j = i + 1
      let s = "\""
      let closed = false
      while j < cl.len() {
        let cj = cl.at(j)
        if cj == "\\" and j + 1 < cl.len() {
          s = s + cj + cl.at(j + 1)
          j = j + 2
          continue
        }
        s = s + cj
        j = j + 1
        if cj == "\"" { closed = true; break }
      }
      out.push(_render-string(s))
      i = j
      leading = false
    } else if c == "#" {
      // commento fino a fine riga
      let rest = cl.slice(i).join()
      out.push(text(fill: fav-colors.comment, style: "italic", rest))
      i = cl.len()
    } else if c == " " {
      let j = i
      while j < cl.len() and cl.at(j) == " " { j = j + 1 }
      let count = j - i
      if leading {
        let pad = ""
        for _ in range(count) { pad = pad + "\u{00A0}" }
        out.push(text(fill: fav-colors.text, pad))
      } else {
        out.push(text(" "))
      }
      i = j
    } else if _is-word(c) {
      let j = i
      while j < cl.len() and _is-word(cl.at(j)) { j = j + 1 }
      let w = cl.slice(i, j).join()
      out.push(_render-word(w))
      i = j
      leading = false
    } else {
      out.push(text(fill: fav-colors.punct, c))
      i = i + 1
      leading = false
    }
  }
  out.join()
}

// Estrae il testo grezzo da un argomento che può essere una stringa o un blocco raw.
#let _raw-text(code) = {
  if type(code) == str { code }
  else if type(code) == content and code.has("text") { code.text }
  else { repr(code) }
}

#let fav(code) = {
  let src = _raw-text(code)
  let lines = src.split("\n")
  while lines.len() > 0 and lines.first().trim() == "" { lines = lines.slice(1) }
  while lines.len() > 0 and lines.last().trim() == "" { lines = lines.slice(0, -1) }
  block(
    width: 100%,
    fill: fav-colors.bg,
    radius: 5pt,
    inset: (x: 12pt, y: 11pt),
    stroke: 0.6pt + fav-colors.border,
    breakable: true,
  )[
    #set text(font: ("Source Code Pro", "Consolas"), size: 8.5pt, fill: fav-colors.text)
    #set par(justify: false, leading: 0.78em, hanging-indent: 1.2em, first-line-indent: 0pt)
    #lines.map(_render-line).join(linebreak())
  ]
}

#let fav-inline(code) = {
  let src = _raw-text(code)
  box(
    fill: rgb("#0b1726"),
    radius: 2.5pt,
    inset: (x: 3.5pt, y: 0pt),
    outset: (y: 2.5pt),
  )[#text(font: ("Source Code Pro", "Consolas"), size: 0.86em, fill: fav-colors.keyword)[#_render-line(src)]]
}
