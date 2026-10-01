# Packaging — Favella Studio

> Il workflow vivo è `/.github/workflows/build-ide.yml` (nella radice del repository).
> Quello in `studio/.github/` è storico e non viene eseguito.

Favella Studio ha due parti da impacchettare insieme:

1. **L'IDE** (Electron + React), costruito con electron-builder.
2. **Il motore** (il «sidecar» Python, `favella_server.py`), **congelato** con PyInstaller in
   un solo eseguibile, che l'installer porta dentro (`resources/engine/`). Così chi lo installa
   non ha bisogno di Python.

Installer ufficiali: **Windows** (NSIS, `.exe`) e **Linux** (`.AppImage`). **macOS** non ha un
installer ufficiale: ognuno si costruisce il proprio — vedi [BUILD-MACOS.md](BUILD-MACOS.md).

## Il modo automatico (consigliato)

GitHub → **Actions** → «Favella Studio — build e pubblicazione» → **Run workflow**.

- «Pubblicare la Release?» **vuota**: costruisce Windows e Linux e lascia gli installer come
  artefatti dell'esecuzione (build di prova).
- **Spuntata**: in più crea la Release `studio-v<versione>` (la versione sta in
  `studio/package.json`) con gli installer allegati. Non è mai «Latest».

Prima di impacchettare, il workflow esegue la suite del motore, congela il motore e lo **prova**
(`studio/scripts/smoke-sidecar.py`: lo lancia, compila una storia, la gioca, esporta la pagina):
se il motore congelato non funziona, l'installer non nasce.

## Il modo locale (sul computer che vuoi impacchettare)

Un comando solo, dalla radice del repository:

| Sistema | Comando |
|---|---|
| Windows | `.\studio\scripts\build-locale.ps1` |
| Linux, macOS | `./studio/scripts/build-locale.sh` |

Oppure a mano, in tre passi:

```bash
# 1. Il motore congelato → dist/favella_engine[.exe]   (dalla radice, con lark e pyinstaller)
python -m PyInstaller --noconfirm favella_engine.spec

# 2. (consigliato) prova che risponda
python studio/scripts/smoke-sidecar.py

# 3. L'app → studio/release/
cd studio && npm ci && npm run dist:win     # oppure dist:linux | dist:mac
```

`npm run dist:*` si ferma con un messaggio chiaro se il passo 1 non è stato fatto
(`scripts/verifica-motore.cjs`).

## Dettagli

- **`favella_engine.spec`** elenca i moduli del motore (compresi `strumenti_ide` ed
  `esportazione`, nati nella 1.4.0) e include `lark` con `collect_all`: Lark costruisce la
  grammatica a runtime e carica risorse proprie, senza non funziona. I cinque moduli del motore
  sono inclusi anche come file, perché l'esportazione di una storia in pagina web li rilegge.
- **electron-builder** (`studio/package.json` → `build`): copia il motore congelato in
  `resources/engine/` (`extraResources`), usa le icone di `branding/icone/` e produce
  `FavellaStudio-Setup-<versione>.exe` (Windows) e `FavellaStudio-<versione>.AppImage` (Linux).
- In produzione `src/main/sidecar.ts` lancia il motore da `resources/engine/`; in sviluppo usa
  `../.venv` e `../favella_server.py`.
- **Niente firma**: gli installer non sono firmati (Windows può mostrare un avviso SmartScreen:
  «Maggiori informazioni» → «Esegui comunque»).
- Le **storie** si possono dare anche senza installare niente: «Esporta come pagina web
  giocabile» produce un solo `.html` che gira in qualunque browser.
