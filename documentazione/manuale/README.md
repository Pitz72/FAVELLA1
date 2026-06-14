# Manuale di Programmazione — FAVELLA 1

Sorgente del manuale d'autore in **PDF tipografico**, generato con
[Typst](https://typst.app). Allineato al motore **v0.29.0** e focalizzato
*esclusivamente sul linguaggio*; ogni costrutto è illustrato con esempi reali
tratti dalla storia guida **«La Casa di Via Stradivari»**
(`esempi/materiale-didattico/`). Edizione corrente: **Seconda edizione · 2026**.

## Come compilare

Serve Typst ≥ 0.13 (`winget install --id Typst.Typst`), poi:

```powershell
pwsh ./build.ps1            # -> manuale.pdf
pwsh ./build.ps1 -Watch     # ricompila live
pwsh ./build.ps1 -Png       # esporta anche le anteprime pag-{p}.png
```

Oppure direttamente. La sorgente è unica e produce due tirature:

```
# Edizione digitale (con copertina navy a pagina intera):
typst compile --font-path fonts manuale.typ manuale.pdf

# Interno per la stampa KDP (parte dal frontespizio, senza copertina):
typst compile --input kdp=1 --font-path fonts manuale.typ manuale-interno-kdp.pdf

# Copertina integrale (wrap fronte-retro) per KDP, alle misure esatte con bleed:
typst compile --font-path fonts copertina-kdp.typ copertina-kdp.pdf
```

### Note di produzione (Amazon KDP)

- Trim: **6,69×9,61″** (169,93×244,09 mm), formato standard KDP.
- Interno: **84 pagine**, capitoli su pagina dispari (recto). Spedire
  `manuale-interno-kdp.pdf` (senza la copertina, che è un file a sé).
- Copertina wrap: **351,0×250,4 mm**, bleed 3,175 mm, dorso 4,80 mm calcolato per
  84 pp. su carta bianca. **Ricalcolare il dorso** in `copertina-kdp.typ` se cambiano
  il numero di pagine o la carta. Dorso senza testo (regola KDP sotto 100 pp.).

## Struttura

| Percorso | Ruolo |
|---|---|
| `manuale.typ` | Documento principale: fronte del libro + capitoli (toggle copertina via `--input kdp=1`). |
| `capitoli/` | I 20 capitoli, un file `.typ` ciascuno. |
| `lib/manuale-template.typ` | Identità tipografica: palette di marca, font, copertina, frontespizio, dedica, colophon, impaginazione, titoli, box (`sintassi`, `tranello`, `prova`, `nota`, `esempio`). |
| `lib/fav.typ` | Evidenziatore di sintassi `.fav` (`#fav(...)`, `#fav-inline(...)`). |
| `copertina-kdp.typ` | Copertina integrale (wrap) per KDP, alle misure esatte con bleed. |
| `assets/logo.png` | Marchio `{F1}` ufficiale. |
| `fonts/` | Font di marca **statici** (Sora, Source Code Pro — licenza OFL). |
| `manuale.pdf` | Edizione digitale compilata, tracciata nel repo per il download diretto. |
| `manuale-interno-kdp.pdf` | Interno di stampa (senza copertina) da caricare su KDP. |
| `copertina-kdp.pdf` | Copertina wrap di stampa. |

## Stato

**Completo** (Seconda edizione · 2026): **20 capitoli**, copertina, doppia dedica e
colophon — **84 pagine**, allineato alla **v0.29.0**. Pronto per la stampa su Amazon
KDP (trim 6,69×9,61″, interno + copertina wrap dedicati).

## Font e licenze

I font in `fonts/` sono istanze statiche di **Sora** e **Source Code Pro**,
entrambi distribuiti con licenza **SIL Open Font License 1.1**. Il corpo del
testo usa **Inter** (di sistema), il codice ripiega su **Consolas** se Source
Code Pro non è disponibile.
