> ℹ️ **Build automatico**: il workflow vivo è `/.github/workflows/build-ide.yml`
> nella radice del repository (Actions → «Build IDE — Favella Studio» → Run
> workflow, avvio manuale). Quello in `studio/.github/` è storico e non viene
> eseguito: GitHub legge solo i workflow nella radice.

# Packaging — Favella Studio (Fase 7)

Due artefatti distribuibili:

1. **Gioco** → `📦 Esporta` nell'IDE produce **un singolo `.html`** autoportante che
   gira nel browser via Pyodide (zero installazioni per il giocatore). Nessun build
   necessario: è già pronto nell'IDE.
2. **IDE** → installer di Favella Studio per **Windows (NSIS)**, **macOS (dmg + zip)** e
   **Linux (AppImage)**. Due modi:
   - **Automatico (consigliato):** la GitHub Action **`Build IDE (Windows / macOS / Linux)`**
     costruisce i tre OS in parallelo e pubblica gli artefatti. Avvio **solo manuale**
     (`workflow_dispatch`). Vedi la sezione in fondo.
   - **Manuale locale:** i due passi qui sotto (PyInstaller + electron-builder), eseguiti
     sull'OS che si vuole impacchettare (con la `.venv` del progetto attiva).

## Prerequisiti
- La `.venv` del repo FAVELLA1 con `lark` installato (come per lo sviluppo del sidecar).
- `pip install pyinstaller` nella stessa `.venv`.
- Node + dipendenze dell'IDE installate (`cd studio && npm install`).

## Passo 1 — Congelare il sidecar (PyInstaller)
Dalla **root del repo FAVELLA1** (con la `.venv` attiva):

```powershell
pyinstaller --onefile --name favella_engine --collect-all lark `
  --add-data "utils.py;." --add-data "strutture.py;." `
  --add-data "libreria_azioni.py;." --add-data "compilatore.py;." `
  --add-data "gioco.py;." favella_server.py
```

Note:
- Il separatore di `--add-data` è **`;`** su Windows (su Linux/Mac è `:`).
- `--collect-all lark` è indispensabile: Lark costruisce la grammatica a runtime e
  carica risorse proprie; senza, l'exe congelato fallisce al primo parse.
- I 5 `.py` del motore sono inclusi come *datas* perché **`esporta_html`** li rilegge
  da disco per incorporarli nell'HTML del gioco (in un bundle PyInstaller li trova in
  `sys._MEIPASS`, gestito già da `compilatore.esporta_html`).
- Output: **`dist/favella_engine.exe`** (nella root FAVELLA1).

## Passo 2 — Build dell'installer IDE (electron-builder)
Da **`studio/`**:

```powershell
npm run dist
```

Questo esegue `electron-vite build` (renderer/preload/main in `out/`) e poi
`electron-builder`, che:
- impacchetta `out/**` + `package.json`;
- copia **`../dist/favella_engine.exe`** in `resources/engine/favella_engine.exe`
  (campo `build.extraResources` in `package.json`);
- produce **`studio/release/FavellaStudio-Setup-<versione>.exe`** (target NSIS,
  installer con scelta cartella).

In produzione il main (`src/main/sidecar.ts`) lancia
`process.resourcesPath/engine/favella_engine.exe` invece del Python della `.venv`
(vedi `resolveCommand`), quindi il path combacia con l'`extraResources` qui sopra.

## Passo 3 — Smoke test dell'installer
1. Installa con `FavellaStudio-Setup-<versione>.exe`.
2. Avvia: la barra di stato deve mostrare **«Motore pronto»** (il sidecar congelato
   parte). Se resta su «starting/crashed», controlla la console (`--collect-all lark`).
3. Apri un `.fav`, compila, **▶ Gioca**, e prova **📦 Esporta** (l'HTML del gioco usa i
   `.py` bundlati).

## Caveat noti
- **Firma**: l'installer non è firmato → SmartScreen mostrerà un avviso. Per la
  distribuzione pubblica aggiungere un certificato di code-signing alla config
  `build.win` (es. `certificateFile`/`certificatePassword` o un signing via env).
- **Dimensione**: l'exe del sidecar include Python + Lark (~15–25 MB); l'installer
  complessivo include anche Electron (~80–120 MB). Normale per un'app Electron+Python.
- **Aggiornare il motore nell'installer**: il sidecar è una COPIA congelata del motore
  della repo pubblica al momento del build. Ri-esegui il Passo 1 quando il motore cambia.
- Versione di PyInstaller: testato come ricetta standard (PyInstaller 6.x). Se l'API
  dello spec cambia, la riga `pyinstaller …` qui sopra resta il riferimento canonico.

## Build automatica multipiattaforma (GitHub Actions)

Workflow: **`.github/workflows/build.yml`** nel repo PRIVATO `favella-studio`.

- **Avvio SOLO MANUALE**: GitHub → *Actions* → *Build IDE (Windows / macOS / Linux)* →
  *Run workflow* (input opzionale `ref_motore` = branch/tag del motore pubblico, default
  `main`). Nessun trigger automatico su push/PR/tag.
- **Cosa fa**, per ognuno di `windows-latest` / `macos-latest` / `ubuntu-latest`:
  1. fa il checkout del motore pubblico `Pitz72/FAVELLA1` nella **root** e di questo repo in
     **`studio/`** (ricrea il layout root + studio richiesto dal packaging);
  2. installa `lark` + `pyinstaller` e **congela il sidecar** col separatore `--add-data`
     giusto per OS (`;` su Windows, `:` altrove) → `dist/favella_engine[.exe]` (+`chmod +x`
     su mac/linux);
  3. `npm ci` in `studio/` e `npm run dist` → **electron-builder** produce l'installer
     nativo (NSIS / dmg+zip / AppImage), con il binario del sidecar copiato negli
     `extraResources` (nome per-OS, vedi `package.json`) e le **icone di marca** da
     `branding/icone/`;
  4. carica gli **artefatti** scaricabili (`favella-studio-Windows/macOS/Linux`).
- **Build NON firmati** (`CSC_IDENTITY_AUTO_DISCOVERY=false`): SmartScreen/Gatekeeper
  avviseranno. Per la firma aggiungere i certificati come *secrets* e la relativa config
  `build.win`/`build.mac`.
- Il sidecar resta una **copia congelata** del motore al `ref_motore` scelto: per aggiornarlo
  basta rilanciare il workflow.
