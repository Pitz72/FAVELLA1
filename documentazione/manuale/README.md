# Manuale di Programmazione — FAVELLA 1

Sorgente del manuale d'autore in **PDF tipografico**, generato con
[Typst](https://typst.app). Allineato al motore **v0.18.0** e focalizzato
*esclusivamente sul linguaggio*; ogni costrutto è illustrato con esempi reali
tratti dalla storia guida **«La Casa di Via Stradivari»**
(`esempi/materiale-didattico/`).

## Come compilare

Serve Typst ≥ 0.13 (`winget install --id Typst.Typst`), poi:

```powershell
pwsh ./build.ps1            # -> manuale.pdf
pwsh ./build.ps1 -Watch     # ricompila live
pwsh ./build.ps1 -Png       # esporta anche le anteprime pag-{p}.png
```

Oppure direttamente:

```
typst compile --font-path fonts manuale.typ manuale.pdf
```

## Struttura

| Percorso | Ruolo |
|---|---|
| `manuale.typ` | Documento principale: fronte del libro + capitoli. |
| `capitoli/` | I 17 capitoli, un file `.typ` ciascuno. |
| `lib/manuale-template.typ` | Identità tipografica: palette di marca, font, copertina, impaginazione, titoli, box (`sintassi`, `tranello`, `prova`, `nota`, `esempio`). |
| `lib/fav.typ` | Evidenziatore di sintassi `.fav` (`#fav(...)`, `#fav-inline(...)`). |
| `assets/logo.png` | Marchio `{F1}` ufficiale. |
| `fonts/` | Font di marca **statici** (Sora, Source Code Pro — licenza OFL). |
| `manuale.pdf` | Il manuale compilato, tracciato nel repo per il download diretto. |

## Stato

**Completo** (2026-06-04): **17 capitoli + appendici**, copertina, dedica e
colophon — circa 59 pagine. Allineato alla **v0.18.0**. Il vecchio `manuale.md`
(≈0.0.9.2) è stato rimosso.

## Font e licenze

I font in `fonts/` sono istanze statiche di **Sora** e **Source Code Pro**,
entrambi distribuiti con licenza **SIL Open Font License 1.1**. Il corpo del
testo usa **Inter** (di sistema), il codice ripiega su **Consolas** se Source
Code Pro non è disponibile.
