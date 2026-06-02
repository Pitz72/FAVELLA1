# Changelog — Favella Studio

Tutte le versioni rilevanti dell'IDE Favella Studio. Il versioning è indipendente
da quello del linguaggio/motore FAVELLA (attualmente v0.12.1).
Schema: [SemVer](https://semver.org/lang/it/) 0.x (pre-1.0).

## [0.5.0] — 2026-06-02 — Fase 4: Mappa & Stato

### Aggiunto
- **RPC `world.graph`** nel sidecar: topologia del mondo (stanze = nodi, uscite =
  archi direzionati con la direzione, stanza di partenza marcata). Senza `path` usa
  il mondo della partita attiva; con `path`/`source` compila il buffer per
  un'anteprima della mappa **senza giocare**.
- **RPC `world.snapshot`**: stato **live** della partita attiva — posizione e nome
  della stanza, turno, esito, dialogo in corso, **variabili** (stati e contatori con
  valore), **inventario**, e tutti gli **oggetti** con posizione (stanza/contenitore/
  inventario) e proprietà.
- **Dock destro a schede** (`RightDock`): **▶ Gioca · 🗺 Mappa · 🔎 Stato** in un unico
  pannello. Il pannello Gioca della Fase 3 è ora una scheda.
- **Mappa del mondo** (react-flow): le stanze sono disposte su una **griglia che segue
  le direzioni** (nord/sud/est/ovest → su/giù/destra/sinistra; le verticali e le
  direzioni custom ripiegano su celle libere), archi reciproci uniti in un solo arco
  bidirezionale etichettato con la direzione. Pan/zoom, minimappa, controlli; la
  **stanza corrente è evidenziata** (oro) e quella di **partenza** (verde) durante il gioco.
- **Ispettore di stato**: contatori, stati, inventario e oggetti (per posizione e
  proprietà) aggiornati a **ogni turno**; intestazione con stanza/turno/esito.

### Note
- Lo `snapshot` è ricaricato dopo ogni comando (e al riavvio), così Mappa e Inspector
  restano sincronizzati con la partita. La Mappa, fuori partita, compila il `.fav`
  attivo per l'anteprima della topologia.
- Nuova dipendenza front-end: `reactflow` (^11). Build/typecheck puliti, **321 test
  del motore invariati** (le aggiunte vivono solo nel sidecar).

## [0.4.0] — 2026-06-02 — Fase 3: Gioca

### Aggiunto
- **Sessione di gioco** nel sidecar (`favella_server.py`): RPC `session.start`,
  `session.send`, `session.reset`. Avvolgono `elabora_comando` del motore — già
  *headless* (prende una stringa, non chiama `input()`, dialoghi a turni) — sotto
  **cattura di stdout**, restituendo all'IDE il testo della console e un'istantanea
  di stato `{gameOver, outcome, inDialogue, dialogueOptions, room, turn}`.
- **Compilazione giocabile** additiva in `compilatore.py`:
  `compila_mondo(percorso, sorgente=None)` — stessa pipeline di `analizza_file`,
  ma **restituisce il Mondo** invece di stamparne il riepilogo, e compila il
  **buffer live** (gli `Includi` risolti dal disco). `analizza_file` resta
  byte-stabile (**321 test invariati**).
- **Pannello «Gioca»**: console testuale con auto-scroll ed eco dei comandi,
  riga di input (Invio per inviare), **bottoni per le opzioni di dialogo** (numerate,
  filtrate per condizione), **banner di esito** (vinta/persa/terminata), indicatore di
  stanza e turno, **↻ Riavvia**. Si apre dal pulsante **▶ Gioca** in barra del titolo
  o con **F5**; gioca il file `.fav` attivo (buffer live).

### Note
- Il **riavvio** rigioca lo *stesso* sorgente da cui è nata la partita (le modifiche
  live dell'editor non rientrano a metà partita; per giocarle, ▶ Gioca riparte dal
  buffer aggiornato).
- Su errore di compilazione, `session.start` restituisce `ok=false` con le
  diagnostiche d'autore (dal canale strutturato della Fase 2), mostrate nel pannello.
- **Prossimo (Fase 4)**: chiusa questa fase, si elimina il vecchio `favella_studio.py`.

## [0.3.0] — 2026-06-01 — Fase 2: Compile & diagnostica

### Aggiunto
- **Compilazione strutturata** del motore esposta all'IDE: nuova funzione additiva
  `analizza_file_strutturato(percorso, sorgente=None)` in `compilatore.py` che
  rispecchia la pipeline di `analizza_file` (espansione `Includi` → symbol table →
  parser LALR → transformer → validazione + linter) ma **raccoglie** le diagnostiche
  invece di stamparle. `analizza_file` resta byte-stabile (321 test invariati).
- **RPC `compile`** nel sidecar (`favella_server.py`): compila un `.fav` e restituisce
  `{ok, errors, warnings, worldSummary}`. Accetta `source` opzionale per compilare il
  **buffer live** non ancora salvato (gli `Includi` sono risolti dal disco).
- **Pannello Problemi**: elenco di errori e avvisi con conteggi, file, riga:colonna e
  codice; click su una voce → **salto alla posizione** nell'editor.
- **Marker inline in Monaco** (`setModelMarkers`): sottolineatura rossa/gialla nel punto
  esatto, con il messaggio del compilatore al passaggio del mouse.
- **Auto-compile**: a ogni modifica (debounce 600 ms), all'apertura di un file e quando
  il motore diventa pronto — diagnostica sempre fresca senza dover salvare.
  `Ctrl+B` forza una compilazione.

### Note
- Posizioni **sintattiche precise** via source map dell'espansione `Includi`
  (l'errore è attribuito al file e alla riga originali anche con i moduli multi-file).
- Posizioni **semantiche best-effort**: gli errori del transformer non portano una
  riga; si individua il nome citato nel sorgente. Quando non è localizzabile, la voce è
  marcata *approssimata* (`~`) e non produce un salto preciso.

## [0.2.1] — 2026-06-01 — Fix Explorer

### Corretto
- **File di root non visibili** nel Project Explorer: le cartelle di primo livello
  erano auto-espanse e il loro contenuto spingeva i file della root (inclusi i
  `.fav`) sotto la piega. Ora le cartelle sono **chiuse di default** (stile VS Code),
  così i file della root restano subito visibili in cima.

## [0.2.0] — 2026-06-01 — Fase 1: Editor

### Aggiunto
- **Editor di codice Monaco** (il motore editor di VS Code) integrato e bundlato
  offline (nessuna CDN).
- **Lingua `favella`** registrata in Monaco: tokenizer Monarch alimentato da
  `engine.lexicon` (verbi, parole riservate, direzioni del motore) + commenti `#`
  e stringhe `"…"`; tema scuro coordinato `favella-dark`.
- **Completamento base**: keyword/verbi/direzioni del linguaggio.
- **Project Explorer**: apertura di una cartella-progetto, albero dei file, i
  file `.fav` evidenziati; apertura su click.
- **Editor a schede** con indicatore di modifiche non salvate e salvataggio
  (Ctrl+S / Salva tutto).
- **IPC file system** nel processo main: dialog di apertura cartella, lettura
  ricorsiva dell'albero, lettura/scrittura file (tutto via `contextBridge`).
- **Barra di stato** con percorso file, posizione cursore e stato sidecar.

## [0.1.0] — 2026-06-01 — Fase 0: Spina dorsale

### Aggiunto
- Scaffold **Electron + React + Vite + TypeScript** (electron-vite) con split
  main/preload/renderer.
- **Sidecar Python** (`favella_server.py`): ponte JSON-RPC su NDJSON che importa
  il motore FAVELLA esistente; metodi `ping`, `engine.version`, `engine.lexicon`;
  disciplina stdout rigorosa.
- **Supervisione del sidecar** (`src/main/sidecar.ts`): spawn dalla `.venv` in
  dev / exe PyInstaller in prod, timeout per-metodo, riavvio con backoff, kill pulito.
- **Bridge IPC sicuro** (`window.favella`): rpc, eventi del motore, stato/riavvio sidecar.
- UI di benvenuto con versioni, lessico, ping e toast di stato.
- `electron-builder.yml` predisposto per installer NSIS Windows.

### Corretto
- Crash in chiusura ("Object has been destroyed"): l'emit degli eventi ora
  verifica che la finestra non sia distrutta.
