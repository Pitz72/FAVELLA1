# Favella Studio

> ## ⚠️ ESPERIMENTO IN FASE PRIMORDIALE
>
> Favella Studio è un **tentativo** di dare un ambiente di sviluppo visuale al linguaggio
> FAVELLA. Non è un prodotto finito, non è supportato, non ha una data di uscita: è un
> cantiere fermo a metà. La versione dice `0.9.x` e lo dice sul serio.
>
> Nasceva come progetto separato e a pagamento; dal **10 agosto 2026** è pubblicato in
> chiaro dentro il repository di FAVELLA 1, **così com'è**. Se a qualcuno interessa — per
> usarlo, studiarlo, forkarlo, riprenderlo in mano o portarlo altrove — **è a
> disposizione**, con licenza MIT. Aspettatevi spigoli.
>
> Il **linguaggio** FAVELLA 1, invece, è completo, stabile e testato: quello vive nella
> radice del repository e non c'entra con lo stato di questo IDE.

Ambiente di sviluppo desktop per il linguaggio **FAVELLA** — Electron + React + Vite +
TypeScript, con il motore FAVELLA (Python) eseguito come *sidecar* via JSON-RPC su NDJSON.

> Sostituisce il vecchio `favella_studio.py` (PySide6). Il motore (compilatore Lark, runtime,
> linter, moduli, dialoghi) resta **interamente in Python**, riusato senza riscritture.

## Architettura

```
React/Electron (renderer)  ──IPC contextBridge──▶  Electron main  ──NDJSON su stdio──▶  ../favella_server.py
   UI dell'IDE                                       spawn + supervisione                  importa il motore FAVELLA
```

- **`../favella_server.py`** — sidecar Python: loop NDJSON, importa il motore con import piatti.
  Disciplina stdout rigorosa: i `print()` del motore non toccano mai il canale di protocollo.
- **`src/main/`** — processo principale Electron: finestra, spawn/supervisione del sidecar
  (`sidecar.ts`: timeout per-metodo, riavvio con backoff, kill pulito), canale IPC `rpc`.
- **`src/preload/`** — `contextBridge` espone `window.favella` (rpc, eventi, stato sidecar).
- **`src/renderer/`** — UI React.
- **`src/shared/protocol.ts`** — tipi JSON-RPC condivisi (allineati a `favella_server.py`).

## Prerequisiti

- Node.js 20+ e npm
- Il repo FAVELLA nella cartella padre, con `.venv` Python funzionante (`../.venv`) e `lark` installato.

## Sviluppo

```bash
npm install        # una volta
npm run dev        # avvia Vite (HMR) + Electron; fa spawn del sidecar dalla .venv
```

In dev il sidecar è lanciato da `../.venv/Scripts/python.exe ../favella_server.py`.

## Build & packaging

```bash
npm run build      # builda main/preload/renderer in out/
npm run dist       # build + electron-builder → installer in release/
```

Installer per **Windows (NSIS)**, **macOS (dmg + zip)** e **Linux (AppImage)**, con icone di
marca da `branding/icone/`. Il motore Python va prima congelato con PyInstaller e incluso come
`extraResources/engine` (binario per-OS). Dettagli in **`PACKAGING.md`**.

**Build automatica (consigliata):** la GitHub Action **`Build IDE (Windows / macOS / Linux)`**
(`.github/workflows/build.yml`) costruisce i tre OS in parallelo. **Avvio solo manuale**
(GitHub → Actions → *Run workflow*): nessun trigger automatico.

## Stato (roadmap a fasi)

- [x] **Fase 0 — Scaffold**: spina dorsale Electron ↔ React ↔ sidecar Python; `ping`,
      `engine.version`, `engine.lexicon`; supervisione e riavvio del sidecar.
- [x] **Fase 1 — Editor**: Monaco (offline) con lingua `favella` (Monarch da `engine.lexicon`),
      Project Explorer, schede file con dirty-state e salvataggio (Ctrl+S), barra di stato.
- [x] **Fase 2 — Compile & diagnostica**: RPC `compile` + `analizza_file_strutturato`
      (additiva), pannello Problemi con salto a riga, marker inline in Monaco,
      auto-compile del buffer live (debounce) e `Ctrl+B`.
- [x] **Fase 3 — Gioca**: sessione di gioco nel sidecar (`session.start/send/reset`)
      che avvolge `elabora_comando` sotto cattura stdout; `compila_mondo` additiva
      (Mondo giocabile dal buffer live); pannello console con eco dei comandi,
      bottoni per le opzioni di dialogo, banner di esito e ▶ Gioca / F5.
- [x] **Fase 4 — Mappa + Stato**: RPC `world.graph` (topologia) e `world.snapshot`
      (stato live); dock destro a schede Gioca/Mappa/Stato; mappa react-flow con
      layout a griglia dalle direzioni e stanza corrente evidenziata; ispettore di
      variabili, inventario e oggetti aggiornato a ogni turno.
- [x] **Finestra di gioco dedicata** (stile Godot): ▶ Gioca / F5 aprono una finestra
      separata col solo gioco, font grande e blocchi Storia · Parser · Inventario
      (sempre visibile) · Stato · Mappa. L'IDE resta invariato.
- [x] **Fase 5 — Debugger passo-passo**: RPC `session.history` (uno snapshot per turno);
      scheda «🐞 Debug» con la timeline dei turni e il diff dello stato (spostamenti,
      inventario, variabili, proprietà, esito).
- [x] **Salvataggio partite** (command-log): 💾 Salva / 📂 Carica nella finestra di gioco,
      file `.favsave`. RPC `session.save`/`session.load` (replay deterministico dei comandi).
- [x] **Guardia «modifiche non salvate»**: avviso Salva/Non salvare/Annulla (modal in stile
      IDE) chiudendo una scheda o l'app con un `.fav` modificato.
- [x] **Fase 6 — Editor visuali** (stanze/oggetti/dialoghi): **completa**. **Mappa editabile**
      (✏️ Modifica: trascina per collegare, ➕ Stanza, clic per eliminare connessioni) e
      **inspector oggetti** (📦 crea + modifica Tipo/Prendibile/Posizione/Descrizione/Proprietà/
      Alias) pronti; round-trip via `world.outline`/`outline.serialize` + splice in Monaco con
      undo nativo. **Proprietà a due stati**: le coppie opposte (aperta↔chiusa + custom) si editano
      come selettori segmentati, non tag liberi (`opposite_decl`). Migliorie IDE: Nuovo progetto,
      dock ridimensionabile, tab unificate, pannelli live. **Contenuto di contenitori/supporti**:
      Posizione raggruppata (stanze/contenitori/supporti) con preposizione articolata
      (`nella scatola`, `sul tavolo`) + sezione Contenuto editabile. **Editor di regole/eventi
      (⚙ Regole)** in corso a sotto-step: **6c.1 lettura+elimina** fatto (RPC `world.rules`),
      **6c.2 creazione** fatto (builder in **modale ampia**) e **6c.3** fatto — **condizioni
      booleane annidate** (gruppi `e`/`oppure` con parentesi, negazione infissa solo su
      possesso/proprietà/stato), **modifica** delle regole esistenti (✎ riapre la modale
      precompilata, o «✎ testo» per quelle troppo complesse) e conseguenza di **spostamento**
      (`move`: nel nulla / in inventario / stanza / contenitore / supporto, prep concordata).
      **6c.4 fatto (IDE 0.9.9)**: **eventi visuali** (`Al turno N` / `Ogni N turni`) nella stessa
      modale via toggle Regola/Evento, con ✎ per modificarli; **avviso «Invece di sostituisce
      l'azione normale»** sui verbi con effetto di default (prendi/lascia/metti/apri).
      **Editor STANZE (🏠 Stanze, IDE 0.9.10 / sidecar 0.9.4)**: descrizione + posizione iniziale
      del giocatore (round-trip via `descSpan`/`startSpan`), uscite in sola lettura. Più un fix
      all'ordine delle posizioni (oggetto → stanza creata di recente = append in fondo).
      **Editor DIALOGHI/NPC (💬 Dialoghi, 6b) COMPLETO** (IDE 0.9.11 / sidecar 0.9.6, RPC
      `world.dialogues`): un **copione modificabile in-place**, ordinato. **① Personaggi**
      (con nodo d'ingresso e «rendi personaggio»); **② Copione**: ogni nodo è una scheda con
      **battuta** e **risposte** editabili sul posto, **rinomina del nodo propagata** a tutti i
      riferimenti, ★ nodo d'ingresso, 🗑 elimina nodo; le parti avanzate delle risposte
      (condizione `se …`, conseguenze `e adesso …`) si aprono con ⚙ (riusa i costruttori delle
      Regole via `logicBuilder`). ➕ crea un nodo (chi parla + etichetta + prima battuta).
      Chiude la Fase 6 degli editor visuali.
- [x] **Pannello «Stati & Contatori» (⚖ Stati, IDE 0.9.8 / sidecar 0.9.3)**: crea/modifica/
      elimina i **parametri di stato** del mondo — **stati** (variabili a parole, enum-like) e
      **contatori** (numeri da 0). Creazione in modale ampia (nome, valore iniziale, elenco
      valori ammessi); i valori ammessi si persistono in un **commento canonico**
      `# valori di X: a, b, c` (ignorato dal motore → byte-stabile) che popola i menu del
      builder **subito**. Modifica inline (chip valori: clic = iniziale ★, × = togli; +valore;
      elimina). Backend additivo: `analizza_variabili` + RPC `world.variables` + op serializzatore
      stati + `menu.stateValues` (valori osservati ∪ commento). **344 test verdi.**
- [x] **Fase 7 — Packaging**: **📦 Esporta** genera un **HTML autoportante** del gioco
      (motore + storia appiattita, giocabile nel browser via Pyodide, zero installazioni).
      **Installer IDE** (NSIS) configurato (`build` in package.json + `PACKAGING.md`): sidecar
      congelato con PyInstaller in `resources/engine/`, `npm run dist`. Il build dell'installer
      va lanciato su Windows (vedi PACKAGING.md). **+ Autoformat (↕ Riordina)** e **drag mappa
      persistente**: l'IDE è completo.

## Allineamento al linguaggio (FAVELLA 1.0.0)

Il motore vivo importato dal sidecar è già a **v1.0.0**: compilare, **▶ Giocare** ed
**📦 Esportare** funzionano su qualunque storia 1.0.0, inclusi i costrutti dei Temi 1-5
(quantità dinamiche, casualità, indirezione fra stati, mondo dinamico).

Gli **editor visuali della logica** (⚙ Regole, 💬 Dialoghi) coprono la grammatica fino
a 0.18.0 **e i Temi 1-5** (v0.9.22): quantità dinamiche dei contatori (`[contatore]`,
`un numero fra A e B`), confronto/copia stato↔stato (`è come`/`diventa`), sorteggio
(`uno fra …`), probabilità (`càpita N su M`) si compongono e si modificano dalla form,
con round-trip testo↔visuale completo.

Dalla **0.9.24 la copertura è COMPLETA**: ogni costrutto di FAVELLA 1.0.0 — incluso il
**buio commutabile** (Tema 4a) e il **movimento dei personaggi** (`va in corridoio` /
`cambia stanza`, A5) — si compone e si modifica dalle form, con round-trip testo↔visuale.
Il fallback **«✎ testo»** (modifica nel sorgente Monaco) resta solo per le condizioni
booleane troppo annidate per la modale, non più per singoli costrutti del linguaggio.

Dalla **0.9.25** è in corso una **revisione UX/IA** degli editor (analisi e visione in
`UX-EDITOR-REVISIONE.md`): vocabolario unico della logica (**Quando il giocatore… / Solo
se… / Fai questo…**), menu degli effetti e atomi di condizione raggruppati per
*progressive disclosure*, schede della titlebar in due gruppi (*Costruisci il mondo* /
*Prova e osserva*) e «🔎 Stato» rinominata **«🔎 Partita»**. Dalla **0.9.26** la Mappa è
sempre editabile nel dock (niente più interruttore «✏️ Modifica») e le stanze si creano
anche dalla scheda 🏠 Stanze (➕), non solo dalla Mappa. Con la **0.9.27** la revisione è
**completa** (tutti e 6 i principi): gli errori di un editor compaiono in un banner inline
nel dock (dove l'azione nasce, non solo nel toast), e la larghezza del dock si ricorda fra
le sessioni. Solo presentazione: motore, backend e frasi `.fav` generate sono invariati.

Piano completo: `../../.claude/plans/starry-wandering-key.md` (radice utente).
