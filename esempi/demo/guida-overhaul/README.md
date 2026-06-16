# Notte di Gara — il simulatore di guida «messo a soqquadro»

> Stress-test di genere per **FAVELLA 1** (motore v0.29.0).
> Non sostituisce [«Salerno-Reggio Calabria»](../salerno-reggio/): la **rompe di
> proposito**. Prende lo stesso modello (un viaggio = un grafo di luoghi che si
> raccontano) e gli scarica addosso tutto quello per cui non è stato pensato —
> più sistemi che girano insieme, un bivio, un meteo che cambia mentre guidi —
> per vedere *dove il motore si piega*.

## L'idea

Una corsa notturna a cronometro. **Quattro risorse** si consumano insieme
(carburante, gomme, calore del motore, lucidità), l'**andatura** è una marcia a
tre posizioni, il **meteo** muta da solo, e a metà strada un **bivio** apre due
percorsi con profili di rischio opposti: la *litoranea* (più lunga, perdona) e
il *passo* (più corto, ma surriscalda il motore — a tutta velocità ti uccide).

## Come si gioca

```
python gioco.py esempi/demo/guida-overhaul/notte-di-gara.fav
```

| Comando | Effetto |
|---|---|
| `avanti` / `indietro` | guidi al tratto successivo / precedente |
| `sinistra` / `destra` | al bivio: imbocchi la litoranea / il passo |
| `accelera` / `rallenta` | sali / scendi di marcia (lenta · media · forte) |
| `accosta` | piazzola: recuperi lucidità e **azzeri il calore** |
| `guarda`, `inventario`, `aiuto` | servizio |

**Scopo:** raggiungere il traguardo prima che ti tradisca una risorsa.
Tre esiti verificati end-to-end: vittoria sulla litoranea, vittoria sul passo
*solo se rallenti e accosti*, morte per surriscaldamento sul passo a tutta.

## Cosa esercita (e dove tiene)

- **Sistemi simultanei**: quattro contatori + due stati che si influenzano a
  vicenda, il tutto orchestrato da **demoni a soglia**. Il motore regge: la
  reattività autonoma della v0.15.0 è esattamente ciò che serve a un simulatore.
- **Interazioni emergenti**: la pioggia *raffredda* il motore ma *logora* le
  gomme. Non è scriptato come caso speciale: sono due demoni indipendenti che si
  sommano. Un comportamento che non avevo progettato è emerso da solo. *(È il
  pregio del modello a regole.)*
- **Bivio reale**: due direzioni custom in coppia (`Sinistra e destra sono
  direzioni opposte.`) bastano a ramificare il grafo.

## Dove si piega — attrito → primitiva mancante

Spingere il genere ha fatto emergere limiti reali. Nessuno è stato aggirato in
silenzio: ognuno è marcato come `ATTRITO` nel sorgente.

| # | Attrito incontrato | Workaround usato nella demo | Primitiva che lo sbloccherebbe |
|---|---|---|---|
| D1 | ✅ **RISOLTO (v0.32.0, Tema 2).** ~~Niente casualità d'autore: un meteo «dinamico» alla seconda partita era un copione.~~ | ~~Meteo sceneggiato con `Al turno N:` (deterministico).~~ Ora il meteo muta a caso: `Ogni turno se càpita (1 su 4): … e adesso il meteo diventa uno fra sereno, pioggia, nebbia.` (seedato, ANNULLA-safe). | Fatto: condizione probabilistica `càpita (N su M)` (2c) + scelta casuale fra valori di stato `diventa uno fra …` (2b). L'estrazione *numerica* `un numero fra A e B` era già in v0.31.0. |
| D2 | **Il consumo non può dipendere dall'andatura.** Vorrei «più vai forte, più bruci»: `diminuisci il carburante di [andatura]`. Non esiste: `di N` è un numero letterale. | Una **batteria di demoni a soglia**, uno per marcia (`Ogni turno se l'andatura è forte: …`). Verboso e fragile. | Contatore come operando: `aumenta il calore di [intensità]` (un contatore/valore di stato come quantità). |
| D3 | **I contatori non si parlano.** Non posso confrontare due grandezze: `se il calore è almeno le gomme`. (Verificato: il secondo nome è letto come oggetto.) | Soglie fisse contro numeri letterali. | Confronto grandezza↔grandezza: `se il calore è più di le gomme`. |
| D4 | **Nessun «valore successivo» di uno stato.** `accelera` richiede una regola per marcia perché non posso dire «sali di una posizione». | Tre regole `Invece di accelera se l'andatura è …`. | Stati ordinati / scala: `L'andatura è una marcia: lenta, media, forte.` + `sali di una marcia`. |
| D5 | **Solo interi, niente valori continui.** La «velocità» è per forza una marcia discreta. | Stato a 3 posizioni. | (Basso valore: probabilmente va bene così — annotato per completezza.) |
| D6 | **`x è come y` rimappa solo i verbi, non le direzioni.** `"sinistra" è come est.` → warning, sinonimo ignorato. | Dichiarata `Sinistra e destra sono direzioni opposte.` (anzi più pulito). | Estendere `è come` alle direzioni, oppure documentare l'idioma corretto (fatto). |
| D7 | **Nelle regole la conseguenza nuda senza `dire` è vietata** (i «tick silenziosi» A9 valgono solo per eventi/demoni). Un gesto del giocatore che muta solo lo stato deve comunque «dire» qualcosa. | Aggiunta una battuta a ogni regola. | Rendere `dire` opzionale anche nelle regole quando c'è ≥1 conseguenza (simmetria con A9). |

### Lettura d'insieme

Tre attriti (**D2, D3, D4**) sono **la stessa lacuna vista da tre lati**:
FAVELLA tratta i contatori come *celle isolate* su cui si fa aritmetica con
**costanti**, mai fra di loro. È il limite più strutturale emerso, e tornerà —
identico — nel GDR (danno che scala con la forza). **D1** (casualità) è l'altro
grande tema dei simulatori — ed entrambi sono ormai **fatti**: D2/D3 in v0.31.0
(Tema 1, contatore come operando e confronti) e D1 in v0.32.0 (Tema 2, casualità
d'autore). Erano **cassetto B** (espressività da pesare contro la semplicità del
linguaggio): vedi
[`documentazione/espansione-oltre-0.29.md`](../../../documentazione/espansione-oltre-0.29.md).

## File

| File | Contenuto |
|---|---|
| `notte-di-gara.fav` | tutto: sistemi, strada con bivio, gesti di guida, consumo, fisica dell'andatura (demoni), meteo, soglie fatali, traguardo |
