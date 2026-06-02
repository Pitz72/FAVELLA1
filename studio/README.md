# Favella Studio

IDE desktop ufficiale per il linguaggio **FAVELLA** — Electron + React + Vite + TypeScript,
con il motore FAVELLA (Python) eseguito come *sidecar* via JSON-RPC su NDJSON.

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
npm run dist       # build + electron-builder → installer NSIS in release/
```

Per il packaging completo il motore Python va congelato con PyInstaller (`onedir`) e incluso come
`extraResources/engine` (vedi `electron-builder.yml`, sezione commentata).

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
- [~] **Fase 6 — Editor visuali** (stanze/oggetti/dialoghi): in corso. **Mappa editabile pronta**
      (✏️ Modifica: trascina per collegare, ➕ Stanza, clic per eliminare connessioni; round-trip
      via `world.outline`/`outline.serialize` + splice in Monaco con undo nativo). Migliorie IDE:
      Nuovo progetto, dock ridimensionabile, tab unificate. Mancano: inspector oggetti (6a.4),
      auto-refresh della mappa mentre si digita, dialoghi/NPC (6b).
- [ ] Fase 7 — Packaging del gioco

Piano completo: `../../.claude/plans/starry-wandering-key.md` (radice utente).
