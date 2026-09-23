# favella-engine — asset vendorati per la cassetta-gioco (Pyodide)

Questi file sono **copie** del motore e delle avventure, serviti staticamente e
caricati nel browser via Pyodide (vedi `src/lib/favellaRuntime.ts`).

**NON modificarli qui.** Sono copie. La fonte di verità è la cartella radice del
progetto FAVELLA 1.

> 🟡 **STATO AL 2026-09-23: motore 1.1.0 copiato qui, NON ancora pubblicato.**
> I cinque moduli in `engine/` sono stati riallineati al motore **1.1.0** (nuova
> frase `Il posto della X è "…".`, vedi CHANGELOG), consolidamento compreso
> (avviso sulla capienza, posto di un oggetto che parte in inventario). Il sito in produzione
> (runtimeradio.it) serve ancora la **1.0.1**: **nessun deploy è stato fatto**, per
> scelta dell'autore. Anche `galleria/il-viaggiatore/` è cambiato (revisione del
> gioco + uso del posto iniziale) e **richiede** la 1.1.0: le due cose vanno
> pubblicate insieme. Prima del deploy:
> 1. `npm run build` del sito e dell'`esperimento`, e prova nel browser di almeno
>    una storia della Galleria e de *Il Viaggiatore*;
> 2. decidere se allineare anche i testi del sito che citano la 1.0.1 (download,
>    pagina Programma) — il pacchetto pip e l'IDE desktop sono ancora 1.0.1;
> 3. solo allora il deploy (credenziali in `~/.favella1-deploy/`).
> Le altre storie della Galleria funzionano identiche con la 1.1.0 (modifica additiva).

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
