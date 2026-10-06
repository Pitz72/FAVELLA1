# favella-engine — asset vendorati per la cassetta-gioco (Pyodide)

Questi file sono **copie** del motore e delle avventure, serviti staticamente e
caricati nel browser via Pyodide (vedi `src/lib/favellaRuntime.ts`).

**NON modificarli qui.** Sono copie. La fonte di verità è la cartella radice del
progetto FAVELLA 1.

> ✅ **STATO AL 2026-10-06: motore 1.4.4, sito 2.8.4.**
> I cinque moduli in `engine/` sono il motore **1.4.4**: il motore parla per
> eventi e propone i pulsanti-verbo, e `src/lib/favellaRuntime.ts` li usa
> (cassette-gioco con i pulsanti, `src/components/PulsantiVerbo.tsx`). Sono
> sempre gli stessi cinque file: gli strumenti che la 1.4.0 ha tolto da
> `compilatore.py` (`strumenti_ide.py`, `esportazione.py`) nel browser non
> servono. Un test della suite (`test_copie_del_motore_nel_sito_allineate`)
> fallisce se queste copie non sono identiche ai sorgenti, un altro
> (`test_elenchi_dei_moduli_del_motore_allineati`) se gli elenchi dei moduli di
> sito, esperimento e validatore non coincidono. `scripts/valida_checkpoint.py`:
> 53/53. `src/constants.tsx` punta alla release v1.4.4 (GitHub e PyPI). `galleria/il-viaggiatore/` e `esperimento/` sono *Il Viaggiatore* 1.11.1.
> `galleria/il-viaggiatore/` richiede almeno la 1.1.0.

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

## Segnalazioni dal gioco «Il Viaggiatore» (2026-10-01, motore 1.4.0) — RISOLTE nella 1.4.1 (committate)

> Tutte e quattro sono corrette (`gioco.py`, `libreria_azioni.py`,
> `compilatore.py`), con 4 test nuovi in `test_linguaggio.py` (1115 passati, 0 falliti) e il
> `CHANGELOG`. Le copie del sito (`engine/*.fav`) sono risincronizzate. Le voci qui sotto restano
> come storia: che cosa era sbagliato, e come lo si è visto.

Quattro cose trovate giocando e collaudando *Il Viaggiatore* (repo del gioco, `motore/` è una
copia del 1.4.0). Le prime tre sono spigoli, la quarta un guasto. Non vanno corretti nel gioco; qui sono
solo annotate, in attesa di decidere se e quando toccarle nel motore.

1. **Una mossa verso un'uscita che non c'è fa passare un turno.** In una stanza senza uscita a
   ovest, `ovest` risponde «Non puoi andare in quella direzione.» e il turno avanza (eventi,
   demoni, sete e fame compresi). Un comando non capito (`blablabla`: «Non capisco questo
   verbo.»), dalla 1.2.0, non lo fa. Verificato: turno +1 contro +0. Per un gioco di
   sopravvivenza è un costo che il giocatore non vede arrivare; in uno senza orologio non
   conta. Possibile correzione: trattarlo come un comando non capito, o renderlo opzionale.
2. **Posare una cosa ristampa la stanza intera.** `lascia il coltello` risponde «Lasciato: il
   coltello.» e subito dopo la descrizione completa del luogo, con uscite e presenze, come
   dopo un `guarda`. In una partita lunga, ogni «lascia» riempie lo schermo di un testo che
   il giocatore ha già letto. `prendi`, invece, risponde solo «Preso: …». Possibile
   correzione: la sola frase, e la stanza ristampata solo se la posa cambia ciò che si vede
   (per esempio al buio).
3. **Rimappare un verbo del motore su un comando d'autore dà un avviso anche quando è voluto, e
   l'avviso dice il verbo sbagliato.** Il gioco dichiara `"colpisci" è come attacca.` perché,
   con il fucile in mano, «colpire» vuol dire sparare. La compilazione avvisa:
   «'colpisci' è già un verbo del motore (fa come 'colpisci'): con questa dichiarazione farà
   invece come 'attacca'.» Il «fa come 'colpisci'» è il nome dell'azione di libreria (il suo
   primo nome), cioè lo stesso verbo che si sta rimappando: chi legge non capisce cosa faceva
   prima. L'avviso è in `compilatore.py`, nei due punti dove si compone «fa come {principali}»
   (`def_sinonimo` e `_applica_sinonimo_differito`). Due richieste: dire che cosa faceva
   il verbo (la sua azione di libreria, in parole) e permettere di dichiarare che il cambio è
   voluto, così da non lasciare in ogni compilazione un avviso che nessuno più legge. Nel
   Viaggiatore resta l'unico avviso, voluto, e va ricordato a mano.
4. **Un verbo seguito da una parola di direzione dà un errore interno.** `accendi su`, `apri su`,
   `chiudi su`, `mangia su` rispondono «[ERRORE CRITICO] Si è verificato un errore durante
   l'esecuzione del comando: 'NoneType' object has no attribute 'proprieta'» (in
   `libreria_azioni.py`, `_ha(oggetto, …)` riceve `None`: «su» è una direzione, non una cosa,
   e il parser non trova l'oggetto ma prosegue). Con una parola qualunque (`accendi xyz`)
   risponde correttamente «Non vedo 'xyz' qui.»; anche `spegni con` lo fa. Trovato dal
   collaudo del testo (`collaudo/testo.py` del gioco, che prova ogni verbo con ogni genere di
   bersaglio). Possibile correzione: se l'oggetto non si risolve, «Non vedo … qui.» come
   per le altre parole, o un controllo `None` in `_ha`.
