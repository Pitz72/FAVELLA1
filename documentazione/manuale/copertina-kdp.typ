// =============================================================================
// copertina-kdp.typ — Copertina integrale (wrap) per Amazon KDP, 3ª edizione.
// Quarta di copertina + dorso + prima, in un unico foglio alle misure esatte con
// abbondanza (bleed). Il disegno è quello dell'ebook (lib/copertina-arte.typ).
//
//   Trim libro          : 6,69 × 9,61″  (169,93 × 244,09 mm)
//   Pagine (interno KDP) : 112  →  manuale-interno-kdp.pdf (motore 1.6.0)
//   Carta                : bianca (BN o colore standard) → dorso 112×0,002252″
//   Bleed                : 0,125″ (3,175 mm) su ogni lato esterno
//
// Wrap risultante: 13,882 × 9,860″  ≈  352,6 × 250,4 mm  (dorso 6,41 mm).
//
// ⚠ Se cambi carta o numero di pagine, ricalcola `pagine` qui sotto.
// ⚠ Il dorso resta senza testo (scelta di marca): un filetto al centro. Sopra le
//   100 pp. KDP lo consentirebbe, ma la copertina lo tiene pulito di proposito.
// ⚠ La versione e l'edizione stanno in lib/edizione.typ (le stesse del manuale).
// Build: typst compile --font-path fonts copertina-kdp.typ copertina-kdp.pdf
// =============================================================================

#import "lib/copertina-arte.typ": fronte, retro, _brand, _fondo
#import "lib/edizione.typ": MOTORE, EDIZIONE

// --- GEOMETRIA ---------------------------------------------------------------
#let trim-w = 6.69in
#let trim-h = 9.61in
#let bleed  = 0.125in
#let pagine = 112
#let mult   = 0.002252in        // bianca, BN / colore standard
#let spine  = pagine * mult      // ≈ 0,25222″ (6,41 mm)
#let safe   = 0.25in             // margine di sicurezza dai tagli e dalle pieghe

#let cover-w = 2 * trim-w + spine + 2 * bleed
#let cover-h = trim-h + 2 * bleed
#let pannello-w = trim-w + bleed  // un pannello, abbondanza esterna compresa

#set page(width: cover-w, height: cover-h, margin: 0pt, fill: rgb("#050b16"))

// quarta di copertina (sinistra): l'abbondanza è a sinistra, in alto e in basso
#place(top + left)[
  #retro(pannello-w, cover-h,
    ins: (top: bleed + safe + 0.1in, right: safe, bottom: bleed + safe, left: bleed + safe),
    versione: MOTORE, edizione: EDIZIONE)
]

// prima di copertina (destra): l'abbondanza è a destra, in alto e in basso
#place(top + left, dx: bleed + trim-w + spine)[
  #fronte(pannello-w, cover-h,
    ins: (top: bleed + safe + 0.1in, right: bleed + safe, bottom: bleed + safe + 0.05in, left: safe),
    versione: MOTORE, edizione: EDIZIONE)
]

// dorso: nessun testo (sotto le 100 pagine), solo il filetto di marca al centro
#place(top + left, dx: bleed + trim-w, dy: 0pt)[
  #box(width: spine, height: cover-h, fill: gradient.linear(rgb("#071020"), rgb("#050b16"), angle: 90deg))
]
#place(top + left, dx: bleed + trim-w + spine / 2 - 0.6pt, dy: cover-h * 0.12)[
  #rect(width: 1.2pt, height: cover-h * 0.76, stroke: none, fill: gradient.linear(
    (rgb("#22d3ee").transparentize(100%), 0%), (rgb("#34d399"), 35%), (rgb("#f59e0b"), 70%),
    (rgb("#f59e0b").transparentize(100%), 100%), angle: 90deg))
]
