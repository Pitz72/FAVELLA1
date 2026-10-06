# Manuale di Programmazione — FAVELLA 1

Sorgente del manuale d'autore in **PDF tipografico**, generato con
[Typst](https://typst.app). Focalizzato *esclusivamente sul linguaggio*; ogni
costrutto è illustrato con esempi reali tratti dalla storia guida **«La Casa di Via
Stradivari»** (`esempi/materiale-didattico/`). Edizione corrente: **Terza
edizione · 2026**, allineata al motore **v1.4.3** (il linguaggio è completo e
definitivo: vedi il [CHANGELOG](../../CHANGELOG.md)).

## Come compilare

Serve Typst ≥ 0.13 (`winget install --id Typst.Typst`), poi:

```powershell
pwsh ./build.ps1            # -> manuale.pdf
pwsh ./build.ps1 -Watch     # ricompila live
pwsh ./build.ps1 -Png       # esporta anche le anteprime pag-{p}.png
```

Oppure direttamente. La sorgente è unica e produce due tirature.

**Ebook pubblico** (resta nel repo, con copertina navy a pagina intera):

```
typst compile --font-path fonts manuale.typ manuale.pdf
```

**Kit di stampa KDP** — vive **fuori dal repo**, in
`C:\Users\Utente\Documents\KDP\FAVELLA1` (cartella autonoma, con `lib/`, `assets/`,
`fonts/` propri):

```
# Interno (dal repo, output verso la cartella KDP esterna):
typst compile --input kdp=1 --font-path fonts manuale.typ <KDP>\manuale-interno-kdp.pdf

# Copertina wrap (dalla cartella KDP esterna):
typst compile --font-path fonts copertina-kdp.typ copertina-kdp.pdf
```

### Note di produzione (Amazon KDP)

- Trim: **6,69×9,61″** (169,93×244,09 mm), formato standard KDP.
- Interno: **96 pagine** (multiplo di 4, con pagine vacat in coda solo per il KDP),
  **colore standard** (la grafica è a colori). Solo il **capitolo 1** apre su pagina
  dispari (recto); gli altri proseguono sulla prima pagina utile. Caricare
  `manuale-interno-kdp.pdf` (senza copertina).
- Paratesto: frontespizio (p1) · pagina dei diritti/colophon (p2, verso del
  frontespizio) · dedica allineata a destra (p3, recto) · indice su recto.
- Copertina wrap: dorso per **96 pp.** → `96 × 0,002252″ = 0,2162″ ≈ **5,49 mm**`
  (carta bianca; il colore standard ha lo stesso spessore-pagina del B/N). Dorso
  senza testo (regola KDP sotto 100 pp.). Sorgente `copertina-kdp.typ` (cartella
  KDP esterna, e anche in questa cartella) con `pagine = 96`; foglio copertina
  996,93 × 709,92 pt. Se cambia il numero di pagine, ricalcola `pagine` nelle due copie.

## Struttura

| Percorso | Ruolo |
|---|---|
| `manuale.typ` | Documento principale: fronte del libro + capitoli (toggle copertina via `--input kdp=1`). |
| `capitoli/` | I 21 capitoli, un file `.typ` ciascuno. |
| `lib/edizione.typ` | **Versione del motore ed etichetta d'edizione** (`MOTORE`, `EDIZIONE`): l'unico punto da toccare a ogni rilascio o nuova edizione. |
| `lib/copertina-arte.typ` | Il disegno della copertina (prima, quarta, mappa delle stanze), condiviso da ebook e copertina KDP. |
| `lib/manuale-template.typ` | Identità tipografica: palette di marca, font, copertina, frontespizio, dedica, colophon, impaginazione, titoli, box (`sintassi`, `tranello`, `prova`, `nota`, `esempio`). |
| `lib/fav.typ` | Evidenziatore di sintassi `.fav` (`#fav(...)`, `#fav-inline(...)`). |
| `assets/logo.png` | Marchio `{F1}` ufficiale. |
| `fonts/` | Font di marca **statici** (Sora, Source Code Pro — licenza OFL). |
| `manuale.pdf` | **Ebook pubblico**: edizione digitale compilata, tracciata nel repo per il download diretto. |
| `copertina-kdp.typ` | Sorgente della copertina wrap per KDP (solo il sorgente, non il PDF). |
| *(kit KDP, fuori dal repo)* | `manuale-interno-kdp.pdf`, `copertina-kdp.pdf` e una copia di sorgente, `lib/`, `assets/`, `fonts/` vivono in `C:\Users\Utente\Documents\KDP\FAVELLA1`. |

## Stato

**Completo** (Terza edizione · 2026): **21 capitoli**, copertina, doppia dedica e
pagina dei diritti — **95 pagine** (ebook), allineato alla **v1.4.1**. L'ebook è pronto;
l'interno KDP è rigenerato (colore standard, 96 pagine, multiplo di 4) e la copertina wrap è
ricalcolata con dorso a 96 pp. (5,49 mm).

## Font e licenze

I font in `fonts/` sono istanze statiche di **Sora** e **Source Code Pro**,
entrambi distribuiti con licenza **SIL Open Font License 1.1**. Il corpo del
testo usa **Inter** (di sistema), il codice ripiega su **Consolas** se Source
Code Pro non è disponibile.
