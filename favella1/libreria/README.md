# Libreria standard di FAVELLA 1

Moduli `.fav` riusabili, da includere nelle tue storie con la direttiva
`Includi "…".`. Sono **vocabolario pronto all'uso**: sinonimi, proprietà e verbi
che ricorrono in quasi ogni avventura, così non li riscrivi ogni volta.

| Modulo | Cosa aggiunge |
|--------|---------------|
| [`sinonimi.fav`](sinonimi.fav) | sinonimi dei verbi di libreria (`scruta`, `arraffa`, `spalanca`, …) |
| [`proprieta.fav`](proprieta.fav) | coppie di proprietà opposte comuni (`rotta`/`integra`, `bagnata`/`asciutta`, …) |
| [`verbi.fav`](verbi.fav) | verbi d'azione pronti (`accendi`, `spingi`, `bevi`, `aspetta`, …) |

## Come si usano

I moduli sono frammenti di sorgente: il preprocessore li espande **testualmente**
nel tuo file prima della compilazione (l'invariante LALR resta intatto). Una
direttiva occupa un'intera riga e il percorso è relativo al file che include.

### Se hai clonato il repo o hai i file accanto alla tua storia

```
Includi "sinonimi.fav".
Includi "proprieta.fav".
Includi "verbi.fav".
```

Metti le direttive **dopo** aver dichiarato le stanze del tuo gioco (come ogni
altro `Includi`).

### Se hai installato FAVELLA con pip

I moduli vivono dentro il pacchetto, non accanto alla tua storia. Copiali nella
cartella del tuo gioco con un comando, poi includili come sopra:

```sh
favella1 libreria                 # elenca i moduli disponibili
favella1 libreria copia sinonimi  # copia sinonimi.fav nella cartella corrente
favella1 libreria copia --tutti   # copia tutti i moduli
```

## Note

- È **sicuro** includere un modulo per intero: sinonimi, proprietà e verbi non
  usati non producono errori né avvisi. Se preferisci un file più snello, tieni
  solo le righe che ti servono.
- Le coppie `aperta`/`chiusa` e `accesa`/`spenta` sono **già** nel motore: non
  vanno ridichiarate (le trovi in `proprieta.fav` come promemoria, commentate).
- Per dare un nome a una **direzione** non si usa `è come` (rimappa solo i
  verbi): dichiara una coppia di direzioni opposte, es.
  `Sinistra e destra sono direzioni opposte.`.
