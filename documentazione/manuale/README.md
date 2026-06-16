# Manuale di Programmazione — FAVELLA 1

Sorgente del manuale d'autore in **PDF tipografico**, generato con
[Typst](https://typst.app). Focalizzato *esclusivamente sul linguaggio*; ogni
costrutto è illustrato con esempi reali tratti dalla storia guida **«La Casa di Via
Stradivari»** (`esempi/materiale-didattico/`). Edizione corrente: **Seconda
edizione · 2026**, allineata al motore **v0.29.0**.

> ⚠️ **Da rigenerare per la 1.0.0.** Il linguaggio FAVELLA è ora alla versione
> **1.0.0** (completo e definitivo: vedi il [CHANGELOG](../../CHANGELOG.md)). Questa
> edizione del PDF è ancora ferma alla v0.29.0 e **non copre** le espansioni
> successive (Cassetto A + Temi 1-4 e Tema 3). La **terza edizione** andrà
> rigenerata sul linguaggio 1.0.0; le novità da incorporare sono elencate sotto.

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

### Da incorporare alla prossima edizione

- **Espansioni post-0.29 → linguaggio 1.0.0** (vedi `documentazione/grammatica-1.0.0.md`
  e il CHANGELOG): **Cassetto A** (v0.30.0: diagnostica nomi, `dire` opzionale nelle
  regole); **Tema 1** «i contatori si parlano» (v0.31.0: quantità come operando
  `di [forza]`/`un numero fra A e B`, confronti fra grandezze); **Tema 2** «casualità
  d'autore» (v0.32.0: `diventa uno fra …`, `càpita (N su M)`); **Tema 4** «mondo che
  cambia in scena» (v0.33.0: buio commutabile, battuta di dialogo condizionale);
  **Tema 3** «lo stato che parla allo stato» (v0.34.0: copia `… diventa …` e confronto
  `… è come …` fra stati). Da capitolare con esempi e citando le **demo stress-test di
  genere** (`esempi/demo/`). I Temi 5a/5b sono fuori dal linguaggio (annotarlo).
- **2026-06-15** — Aggiunta nel cap. 3 («Anatomia di una frase», sorgente
  `.typ`) una `#nota` che rende esplicita la regola *«il punto di fine frase va
  fuori dalle virgolette»* (`…gancio.".`, non `…gancio."`). Il manuale la mostrava
  solo per esempio: un autore alle prime armi, mettendo il punto dentro, otteneva
  un errore «entità sconosciuta» su una riga lontana. La nota è già nella sorgente
  e nel PDF **digitale**; l'interno di stampa KDP (`manuale-interno-kdp.pdf`, 84 pp.)
  **non** è stato rigenerato per non alterare l'impaginazione dell'edizione corrente
  già pronta. Reincorporare alla prossima tiratura (ricontrollare conteggio pagine
  e dorso).

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
