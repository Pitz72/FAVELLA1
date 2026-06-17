# favella-engine — asset vendorati per la cassetta-gioco (Pyodide)

Questi file sono **copie** del motore e delle avventure, serviti staticamente e
caricati nel browser via Pyodide (vedi `src/lib/favellaRuntime.ts`).

**NON modificarli qui.** Sono copie. La fonte di verità è la cartella radice del
progetto FAVELLA 1.

## ⚠️ Convenzione di nome: i moduli del motore si chiamano `*.fav` (puro)

L'hosting del deploy reale (runtimeradio.it) **vieta i file `.py`** (403) — e
anche `.md`, `.txt`, `.json`. E con «.py» in MEZZO al nome (`utils.py.fav`)
Apache valuta anche quell'estensione e prova a ESEGUIRE il file (HTTP 500).
Quindi: **niente «.py» nel nome servito, da nessuna parte**. I moduli sono
`compilatore.fav`, `gioco.fav`, `strutture.fav`, `libreria_azioni.fav`,
`utils.fav`: `favellaRuntime.ts` li scarica così e li scrive nel filesystem di
Pyodide col nome vero (`compilatore.py` ecc.), quindi gli import Python non
cambiano. (Questo SYNC.md non viene mai scaricato dal sito: il 403 su di lui è
irrilevante.)

## Da rigenerare quando il motore (o la Casa) cambia versione

Dalla radice del repository FAVELLA 1 (bash):

```
# motore — NB: l'estensione diventa .fav (al posto di .py)
for f in compilatore gioco strutture libreria_azioni utils; do
  cp "$f.py" "landingpage/public/favella-engine/engine/$f.fav"
done

# avventura «La Casa di Via Stradivari»
cp esempi/materiale-didattico/storia.fav \
   esempi/materiale-didattico/oggetti.fav \
   esempi/materiale-didattico/dialoghi.fav \
   landingpage/public/favella-engine/casa/

# Galleria ufficiale (3 storie brevi, una cartella ciascuna)
for s in il-faro i-tre-sigilli il-giardino-murato; do
  cp "favella1/galleria/$s/$s.fav" \
     "landingpage/public/favella-engine/galleria/$s/$s.fav"
done
```

In PowerShell:

```powershell
foreach ($f in 'compilatore','gioco','strutture','libreria_azioni','utils') {
  Copy-Item "$f.py" "landingpage\public\favella-engine\engine\$f.fav"
}
```

Unica dipendenza esterna del motore: **lark** (puro Python, installata a runtime
con `micropip`, versione PINNATA in `favellaRuntime.ts`). Tutto il resto è
libreria standard.
