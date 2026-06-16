# Distribuzione di FAVELLA 1 — installer multipiattaforma

Questo documento spiega **come è impacchettato** FAVELLA 1 (il linguaggio) e
**come si rilascia** una nuova versione. L'obiettivo: un autore — anche non
tecnico — installa FAVELLA e la usa **senza clonare il repo né installare
Python**.

## Cosa contiene la distribuzione

Un unico eseguibile, **`favella1`**, con sottocomandi:

| Comando | Cosa fa |
|---------|---------|
| `favella1 gioca <storia.fav>` | compila e gioca una storia da terminale |
| `favella1 compila <storia.fav>` | compila e mostra errori/avvisi (non gioca) |
| `favella1 collaudo <storia.fav>` | collaudatore statico (catena della vittoria) |
| `favella1 playground [storia.fav]` | apre l'editor + motore nel browser (offline) |
| `favella1 esporta <storia.fav>` | genera un `.html` autoportante giocabile (Pyodide) |
| `favella1 versione` | stampa la versione del motore |

Alias inglesi: `play`, `check`, `test`, `export`, `version`.

Le avventure ufficiali (`esempi/demo/`) sono incluse nel bundle, così si può
giocare subito dopo l'installazione.

### Il playground è offline

`favella1 playground` avvia un piccolo server locale (solo libreria standard di
Python, nessuna dipendenza nuova) su `127.0.0.1` e apre il browser su una pagina
editor + terminale. Il motore usato è quello **nativo** incluso nell'eseguibile:
è **completamente offline**, alla velocità di Python, con la diagnostica reale
del compilatore. (Diverso da `esporta`, che produce un HTML basato su Pyodide e
richiede la rete al primo avvio.)

## Architettura del pacchetto

- **Entry-point**: `favella.py` — strato sottile (argparse) sopra `gioco.py`,
  `compilatore.py`, `collaudo.py`. Non contiene logica di linguaggio: il motore
  resta congelato.
- **Playground**: `favella_playground.py` — server `http.server` + frontend
  vanilla incorporato.
- **Freeze**: `favella1.spec` (PyInstaller, build *one-dir*). Include `lark`
  (`collect_all`), i 5 moduli del motore **anche come sorgente** (servono a
  `esporta` a runtime, via `sys._MEIPASS`) e le demo.
- **Packaging per-OS**: `packaging/windows/installer.nsi` (NSIS),
  `packaging/linux/` (AppRun + .desktop per AppImage), `.dmg` via `hdiutil`.

## Build locale (facoltativa)

Non è necessaria: la build vera la fa la CI. Per provarla in locale:

```sh
python -m pip install lark pyinstaller
pyinstaller --noconfirm --clean favella1.spec
# Eseguibile in dist/favella1/favella1[.exe]
dist/favella1/favella1 versione
```

## Rilascio (CI — la via ufficiale)

Il workflow `.github/workflows/release.yml` builda su **Windows, macOS e Linux**
in parallelo e impacchetta per ogni OS.

### Per tagliare una release

1. Allinea le versioni (vedi sotto) e aggiorna il `CHANGELOG.md`.
2. Crea e spingi un tag `v*`:
   ```sh
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. La CI builda i tre installer, esegue uno smoke su ciascuno e **pubblica una
   GitHub Release** con questi asset:
   - `favella1-setup-<versione>-windows-x64.exe` (installer NSIS)
   - `favella1-<versione>-macos-arm64.dmg`
   - `favella1-<versione>-linux-x86_64.AppImage`

### Validare la CI senza pubblicare

Si può lanciare il workflow a mano (non crea una Release, produce solo gli
artifact scaricabili dalla pagina dell'Action):

```sh
gh workflow run release.yml --ref <branch>
```

## Versioni in lockstep

La fonte di verità è **`VERSIONE_MOTORE`** in `strutture.py`. Il workflow ricava
la versione da lì per nominare gli artefatti. Il **tag** `v<versione>` deve
coincidere. Non esistono numeri di versione separati per l'installer.

## Note sulla firma

Gli eseguibili **non sono firmati** (nessun certificato Apple/Windows). Al primo
avvio l'utente vedrà un avviso di **Gatekeeper** (macOS) o **SmartScreen**
(Windows): è atteso. La firma/notarizzazione potrà essere aggiunta in seguito.
