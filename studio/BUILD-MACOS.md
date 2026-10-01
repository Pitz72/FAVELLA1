# Favella Studio su macOS — costruiscilo da te

Gli installer ufficiali di Favella Studio sono per **Windows** e **Linux**. Per macOS non
ne pubblichiamo uno: un'app non firmata e non notarizzata (serve un abbonamento Apple
Developer, e un Mac, per farlo bene) farebbe più danni che altro, con Gatekeeper che la
blocca. Ma costruirsi la propria è facile, ed è la strada consigliata: dura **cinque minuti**
e l'app che ne esce è *tua*, quindi macOS si fida.

Funziona su Apple Silicon (M1 e successivi) e su Intel: l'app prende l'architettura del
Mac su cui la costruisci.

## Che cosa serve

- **Python 3.12** (`brew install python@3.12`, oppure da python.org).
- **Node.js 20 o più nuovo** (`brew install node`).
- Gli **strumenti da riga di comando di Xcode** (`xcode-select --install`).
- Questo repository (`git clone https://github.com/Pitz72/FAVELLA1`).

## Il modo corto

Dalla radice del repository:

```bash
./studio/scripts/build-locale.sh
```

Lo script fa tutto: installa `lark` e `pyinstaller` in un ambiente virtuale, esegue i
test del motore, congela il motore, controlla che il motore congelato funzioni, installa
le dipendenze dell'IDE e costruisce l'app. Alla fine ti dice dove trovarla:

```
studio/release/FavellaStudio-1.0.0-arm64.dmg      (oppure ...-x64.dmg)
studio/release/FavellaStudio-1.0.0-arm64.zip
```

Apri il `.dmg`, trascina **Favella Studio** in *Applicazioni*, e basta.

## Il primo avvio

L'app è tua ma non è firmata da uno sviluppatore Apple, quindi alla prima apertura macOS
può dire che «non può essere aperta». Basta uno di questi due gesti, **una volta sola**:

- clic destro (o Ctrl+clic) sull'app → **Apri** → **Apri**; oppure
- da Terminale: `xattr -dr com.apple.quarantine "/Applications/Favella Studio.app"`

(Se l'hai costruita tu sullo stesso Mac, di solito non succede nemmeno.)

## Il modo lungo (per capire cosa succede)

```bash
# 1. Un ambiente Python con le dipendenze del motore
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade pip lark pyinstaller

# 2. (facoltativo) i test del motore
python test_linguaggio.py && python test_collaudo.py

# 3. Congela il motore → dist/favella_engine
python -m PyInstaller --noconfirm favella_engine.spec

# 4. Controlla che il motore congelato risponda
python studio/scripts/smoke-sidecar.py

# 5. L'app
cd studio
npm ci
npm run dist:mac        # → studio/release/*.dmg e *.zip
```

## Se qualcosa non va

- **«manca ../dist/favella_engine»**: il passo 3 non è andato a buon fine; rileggi il suo
  messaggio d'errore (di solito manca `lark` nell'ambiente attivo).
- **`npm ci` fallisce**: controlla `node --version` (serve 20+).
- **L'app si apre ma «Il motore è in errore»**: lancia il passo 4: ti dice cosa non va.
- Per **firmare e notarizzare** (se vuoi distribuirla ad altri) servono un Apple Developer ID
  e le variabili `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`…: vedi la documentazione di
  electron-builder. Per uso personale non serve.

Favella Studio funziona anche **senza** costruirlo: il linguaggio FAVELLA 1 si usa dal
terminale con `pip install favella1`, e le storie esportate sono pagine web che girano ovunque.
