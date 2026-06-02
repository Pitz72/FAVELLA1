# Changelog — Favella Studio

Tutte le versioni rilevanti dell'IDE Favella Studio. Il versioning è indipendente
da quello del linguaggio/motore FAVELLA (attualmente v0.12.1).
Schema: [SemVer](https://semver.org/lang/it/) 0.x (pre-1.0).

## [Fase 6a.2] — 2026-06-02 — Serializzatore canonico (round-trip, scrittura)

*Sidecar `0.8.1`; versione IDE invariata a `0.8.1` (nessuna UI ancora: è la base motore).*

### Aggiunto
- **`serializza_frase` + RPC `outline.serialize`**: data una specifica strutturata
  (op + campi) genera **la frase `.fav` canonica** nello stile d'autore (es.
  `L'ingresso collega nord a il salotto.`, `La descrizione della cucina è "…".`).
  È la metà in **scrittura** del round-trip: l'IDE comporrà le frasi dalle modifiche
  delle form e le inserirà/sostituirà nel buffer usando gli span di `world.outline`.
  Op: room/object def, description (con preposizione articolata concordata),
  connection, position (niente doppio articolo: `sul tavolo`, `nell'astuccio`),
  property, prendibile, alias, start.

### Corretto
- **`world.outline` multi-file**: ogni ancora è ora uno **span `{file, line, endLine}`**
  (prima solo la riga). In progetti con `Includi`, una frase può vivere in un file
  diverso dal radice: senza il `file` lo splicer avrebbe editato il file sbagliato.
  Verificato: `tavolino` risolto a `oggetti.fav:25`, non più `storia.fav:25`.
  (Rinominati i campi: `defLine`/`descLine`/`line` → `defSpan`/`descSpan`/`span`.)

## [0.8.1] — 2026-06-02 — Guardia «modifiche non salvate» + fondazione editor visuali

### Aggiunto
- **Avviso di salvataggio in uscita**: chiudendo una scheda o l'app con un `.fav`
  modificato, ora compare un dialogo **Salva / Non salvare / Annulla** (prima le
  modifiche si perdevano in silenzio). Vale sia per la singola scheda sia per la
  finestra (un solo avviso riepilogativo con N file). Esc = Annulla, Invio = Salva.
- Il dialogo è un **modal integrato nello stile dell'IDE** (sfondo scurito, card
  arrotondata, titolo oro, pulsanti primary/ghost/danger), non più la finestra
  nativa di Windows. Handshake `before-close` main↔renderer: il main intercetta la
  chiusura, il renderer mostra il modal e conferma.
- **Fondazione Fase 6a (editor visuali) — lato lettura**: RPC `world.outline` e
  funzione additiva `analizza_outline` che restituisce un modello editabile di
  stanze e oggetti con lo **span sorgente di ogni frase** (per il futuro round-trip
  testo↔visuale: editing chirurgico per-frase senza toccare commenti/prosa/ordine).
  `costruisci_parser` ha ora un flag `propagate_positions` (default `False`, così
  il percorso del motore e dei test resta byte-stabile). Sidecar a `0.8.0`.
  Nessuna UI ancora: è solo la base, già verificata via NDJSON. **334 test verdi.**

## [0.8.0] — 2026-06-02 — Salvataggio partite (command-log)

### Aggiunto
- **Salva / Carica partita** nella finestra di gioco (💾 / 📂), su file `.favsave`.
  Approccio **command-log**: poiché FAVELLA è deterministico, il salvataggio è la
  semplice **sequenza dei comandi giocati** (+ riferimento alla storia: path e
  sorgente). Il caricamento **ricompila il mondo e ri-esegue i comandi**, riproducendo
  esattamente lo stato e mostrando il transcript fino al punto salvato. Salvataggi
  minuscoli e robusti, senza serializzare il Mondo.
- RPC `session.save` (esporta `{version, path, source, commands, turn}`) e
  `session.load` (ricompila + replay). Dialoghi file nativi gestiti dal processo main
  (`game:writeSave` / `game:readSave`). Sidecar a `0.7.0`.
- Notifica transitoria in finestra di gioco («Partita salvata/caricata (turno N)»).

## [0.7.0] — 2026-06-02 — Fase 5: Debugger passo-passo

### Aggiunto
- **RPC `session.history`** nel sidecar: la sessione registra **uno snapshot per
  turno** (più il comando che l'ha prodotto, `null` per lo stato iniziale). Sidecar
  a `0.6.0`.
- **Scheda «🐞 Debug»** nel dock destro: timeline turno-per-turno con il **diff dello
  stato** calcolato fra snapshot consecutivi — spostamenti del giocatore, oggetti
  presi/lasciati, cambi di **variabili** (stati/contatori), spostamenti di oggetti,
  cambi di **proprietà** (es. porta chiusa → aperta) ed esito della partita. Ogni passo
  mostra turno, comando e i cambiamenti; più recente in cima; ⟳ per aggiornare.
- La history si rilegge dal **sidecar condiviso**, quindi il debugger nell'IDE
  riflette anche le partite giocate nella **finestra di gioco** (⟳ per aggiornare).
- Pulsante **🐞 Debug** in barra del titolo (apre il dock sulla scheda Debug).

### Corretto
- **Bug critico di digitazione nell'editor**: modificando la riga di un errore dopo
  averci cliccato sopra nel pannello Problemi, il testo si scriveva **al contrario**.
  Causa: l'effetto di "salto al cursore" (reveal) dipendeva da `active`, che cambia
  identità a ogni battitura, e rispingeva il cursore alla posizione del reveal a ogni
  tasto. Ora dipende solo dalla richiesta di reveal (nonce) e da `activePath`.
  L'editor passa inoltre a `defaultValue` (uncontrolled) per non reimpostare il buffer.

### Aggiunto (UX)
- **Pulsante Salva** in barra del titolo: **● Salva** (ambra) quando ci sono modifiche,
  **✓ Salvato** a riposo. Affianca le scorciatoie esistenti `Ctrl+S` / `Ctrl+Shift+S`.

## [0.6.0] — 2026-06-02 — Finestra di gioco dedicata

### Aggiunto
- **Finestra di gioco separata** (stile Godot): **▶ Gioca** e **F5** ora aprono una
  finestra dedicata al solo gioco, con **font grande** e layout **a blocchi**:
  - **Storia** — il racconto, in serif e corpo grande, con auto-scroll ed eco dei comandi;
  - **Parser** — input dei comandi e bottoni delle opzioni di dialogo, banner di esito;
  - **Inventario** — sempre visibile, con la capacità di trasporto «(usati/max)»;
  - **Stato** — variabili (stati/contatori) live;
  - **Mappa** — la mappa react-flow con la stanza corrente evidenziata.
- **L'IDE non cambia**: Editor, Problemi e il dock Gioca/Mappa/Stato restano come
  prima (anteprima/ispezione). Le due finestre hanno store indipendenti ma parlano
  allo **stesso sidecar** (un'unica partita, posseduta dalla finestra di gioco).
- Ponte main↔finestra: `game:open` (l'IDE passa path + buffer live), `game:launchPayload`
  (la finestra lo recupera all'avvio), evento `game-relaunch` (ri-pressione di ▶ Gioca).
  La finestra carica la stessa build del renderer con hash `#game`.

### Note
- L'avvio del gioco compila e gioca il **buffer live** del file `.fav` attivo
  (anche non salvato), come per l'anteprima.
- Le **opzioni di dialogo** non sono più duplicate: l'elenco numerato del motore è
  filtrato dal log (`righeConsole`) perché reso come **bottoni**; la battuta dell'NPC resta.
- Mappa della finestra in modalità **compatta** (`MapView compact`: niente minimappa,
  che in un riquadro piccolo copriva il grafo) e con **più spazio** (colonna a 430px,
  la mappa cresce, lo Stato limitato).

## [0.5.1] — 2026-06-02 — Capacità di trasporto nell'inspector

### Aggiunto
- `world.snapshot` ora riporta **`carryUsed`/`carryMax`** (capacità di trasporto del
  giocatore, Livello 7 del linguaggio / motore v0.13.0); l'ispettore di stato mostra
  «Inventario (n/max)». `carryMax` è `null` se l'autore non ha dichiarato una capacità
  (inventario illimitato). Sidecar a `0.5.1`, motore riportato a `0.13.0`.

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
