# favella-engine — asset vendorati per la cassetta-gioco (Pyodide)

Questi file sono **copie** del motore e delle avventure, serviti staticamente e
caricati nel browser via Pyodide (vedi `src/lib/favellaRuntime.ts`).

**NON modificarli qui.** Sono copie. La fonte di verità è la cartella radice del
progetto FAVELLA 1.

> ⚠️ **Dal motore 1.0.1** il modulo di utilità si chiama `favella_utils` (prima
> `utils`): rinominato per igiene del namespace nel pacchetto pip. Se risincronizzi
> devi allineare **tre** posti oltre al file: `ENGINE_FILES` in `src/lib/favellaRuntime.ts`,
> lo stesso elenco in `esperimento/src/lib/favellaRuntime.ts` e la lista in
> `scripts/valida_checkpoint.py`.

## ⚠️ Convenzione di nome: i moduli del motore si chiamano `*.fav` (puro)

L'hosting del deploy reale (runtimeradio.it) **vieta i file `.py`** (403) — e
anche `.md`, `.txt`, `.json`. E con «.py» in MEZZO al nome (`strutture.py.fav`)
Apache valuta anche quell'estensione e prova a ESEGUIRE il file (HTTP 500).
Quindi: **niente «.py» nel nome servito, da nessuna parte**. I moduli sono
`compilatore.fav`, `gioco.fav`, `strutture.fav`, `libreria_azioni.fav`,
`favella_utils.fav`: `favellaRuntime.ts` li scarica così e li scrive nel filesystem di
Pyodide col nome vero (`compilatore.py` ecc.), quindi gli import Python non
cambiano. (Questo SYNC.md non viene mai scaricato dal sito: il 403 su di lui è
irrilevante.)

## Da rigenerare quando il motore (o la Casa) cambia versione

Dalla radice del repository FAVELLA 1 (bash):

```
# motore — NB: l'estensione diventa .fav (al posto di .py)
for f in compilatore gioco strutture libreria_azioni favella_utils; do
  cp "$f.py" "landingpage/public/favella-engine/engine/$f.fav"
done

# avventura «La Casa di Via Stradivari»
cp esempi/materiale-didattico/storia.fav \
   esempi/materiale-didattico/oggetti.fav \
   esempi/materiale-didattico/dialoghi.fav \
   landingpage/public/favella-engine/casa/

# Galleria — le 3 brevi ufficiali (dal pacchetto pip)
for s in il-faro i-tre-sigilli il-giardino-murato; do
  cp "favella1/galleria/$s/$s.fav" \
     "landingpage/public/favella-engine/galleria/$s/$s.fav"
done

# Galleria — gli stress-test di genere (da esempi/demo/, con i loro Includi)
G="landingpage/public/favella-engine/galleria"
cp esempi/demo/ruolo/la-cripta-del-lich.fav esempi/demo/ruolo/bottega.fav "$G/cripta-del-lich/"
cp esempi/demo/appuntamenti/cuori-al-caffe.fav                              "$G/cuori-al-caffe/"
cp esempi/demo/guida-overhaul/notte-di-gara.fav                            "$G/notte-di-gara/"
cp esempi/demo/salerno-reggio/salerno-reggio.fav esempi/demo/salerno-reggio/strada.fav \
   esempi/demo/salerno-reggio/oggetti.fav esempi/demo/salerno-reggio/guida.fav "$G/salerno-reggio/"
cp esempi/demo/sopravvivenza/la-notte-lunga.fav                            "$G/la-notte-lunga/"
# (La Casa di Via Stradivari e Il Relitto Silente restano in casa/ e relitto/,
#  vendorate sopra; la Galleria del sito le riusa da lì.)
```

In PowerShell:

```powershell
foreach ($f in 'compilatore','gioco','strutture','libreria_azioni','favella_utils') {
  Copy-Item "$f.py" "landingpage\public\favella-engine\engine\$f.fav"
}
```

Unica dipendenza esterna del motore: **lark** (puro Python, installata a runtime
con `micropip`, versione PINNATA in `favellaRuntime.ts`). Tutto il resto è
libreria standard.
