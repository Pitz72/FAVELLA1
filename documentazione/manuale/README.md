# Manuale di Programmazione — FAVELLA 1

Sorgente del manuale d'autore in **PDF tipografico**, generato con
[Typst](https://typst.app). Focalizzato *esclusivamente sul linguaggio*; ogni
costrutto è illustrato con esempi reali tratti dalla storia guida **«La Casa di Via
Stradivari»** (`esempi/materiale-didattico/`). Edizione corrente: **Seconda
edizione · 2026**, allineata al motore **v1.0.0** (il linguaggio è completo e
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
- Interno: **84 pagine** (multiplo di 4, con pagine vacat in coda solo per il KDP),
  **colore standard** (la grafica è a colori). Solo il **capitolo 1** apre su pagina
  dispari (recto); gli altri proseguono sulla prima pagina utile. Caricare
  `manuale-interno-kdp.pdf` (senza copertina).
- Paratesto: frontespizio (p1) · pagina dei diritti/colophon (p2, verso del
  frontespizio) · dedica allineata a destra (p3, recto) · indice su recto.
- Copertina wrap: dorso per **84 pp.** → `84 × 0,002252″ = 0,1892″ ≈ **4,81 mm**`
  (carta bianca; il colore standard ha lo stesso spessore-pagina del B/N). Dorso
  senza testo (regola KDP sotto 100 pp.). Sorgente `copertina-kdp.typ` (cartella
  KDP esterna) con `pagine = 84`; foglio copertina 994,98 × 709,92 pt.

## Struttura

| Percorso | Ruolo |
|---|---|
| `manuale.typ` | Documento principale: fronte del libro + capitoli (toggle copertina via `--input kdp=1`). |
| `capitoli/` | I 21 capitoli, un file `.typ` ciascuno. |
| `lib/manuale-template.typ` | Identità tipografica: palette di marca, font, copertina, frontespizio, dedica, colophon, impaginazione, titoli, box (`sintassi`, `tranello`, `prova`, `nota`, `esempio`). |
| `lib/fav.typ` | Evidenziatore di sintassi `.fav` (`#fav(...)`, `#fav-inline(...)`). |
| `assets/logo.png` | Marchio `{F1}` ufficiale. |
| `fonts/` | Font di marca **statici** (Sora, Source Code Pro — licenza OFL). |
| `manuale.pdf` | **Ebook pubblico**: edizione digitale compilata, tracciata nel repo per il download diretto. |
| *(kit KDP, fuori dal repo)* | `copertina-kdp.typ`, `manuale-interno-kdp.pdf`, `copertina-kdp.pdf` e l'asset `copertina-manuale.png` vivono in `C:\Users\Utente\Documents\KDP\FAVELLA1`. |

## Stato

**Completo** (Seconda edizione · 2026): **21 capitoli**, copertina, doppia dedica e
pagina dei diritti — **84 pagine**, allineato alla **v1.0.0**. L'ebook è pronto;
l'interno KDP è rigenerato (colore standard, multiplo di 4) e la copertina wrap è
ricalcolata con dorso a 84 pp. (4,81 mm).

## Font e licenze

I font in `fonts/` sono istanze statiche di **Sora** e **Source Code Pro**,
entrambi distribuiti con licenza **SIL Open Font License 1.1**. Il corpo del
testo usa **Inter** (di sistema), il codice ripiega su **Consolas** se Source
Code Pro non è disponibile.
