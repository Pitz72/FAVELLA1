# Favella Studio — Guida all'uso

La guida dell'app, in PDF: [`guida-favella-studio.pdf`](guida-favella-studio.pdf)
(45 pagine, A4, PDF accessibile PDF/UA-1). Viaggia dentro gli installer di Studio (menu
**··· › Guida di Favella Studio (PDF)**, o **Leggi la guida** nella prima schermata) e si
scarica da [www.favella.eu/studio](https://www.favella.eu/studio).

Spiega l'app; il linguaggio lo spiega il *Manuale di Programmazione* di FAVELLA 1
(`documentazione/manuale/`). Gli esempi usano la stessa storia del manuale, «La Casa di
Via Stradivari» (`esempi/materiale-didattico/`), che Studio apre con **Apri la storia
d'esempio**.

## Com'è fatta

| Percorso | Che cosa |
|---|---|
| `guida.typ` | il documento: copertina, frontespizio, indice, capitoli |
| `lib/guida.typ` | l'impaginazione (palette e font del manuale, A4, riquadri, tasti, figure) e i numeri di versione (`STUDIO`, `MOTORE`, `EDIZIONE`) |
| `capitoli/` | i quattordici capitoli |
| `immagini/` | le schermate (tema «carta», 1440×900 a densità 2), i marchi e `posizioni.json` |

## Rifarla

1. **Le schermate**, quando cambia l'interfaccia. Servono il ponte col motore su una
   *copia* della storia d'esempio e l'interfaccia nel browser (lo script fa modifiche
   senza salvarle, ma meglio non rischiare sull'originale):

   ```bash
   node studio/dev-web/bridge.mjs <copia>/materiale-didattico
   npm --prefix studio run dev:web
   node landingpage/scripts/foto-guida-studio.mjs
   ```

2. **Il PDF**, con [Typst](https://typst.app) 0.14 o più recente:

   ```powershell
   pwsh studio/guida/build.ps1
   ```

   oppure, da `studio/guida/`:

   ```bash
   typst compile --font-path ../../documentazione/manuale/fonts --pdf-standard ua-1 guida.typ guida-favella-studio.pdf
   ```

A ogni versione nuova di Studio: aggiornare `STUDIO` (e se serve `MOTORE`) in
`lib/guida.typ`, rifare schermate e PDF, e controllare che i nomi dei pulsanti citati nel
testo siano ancora quelli.
