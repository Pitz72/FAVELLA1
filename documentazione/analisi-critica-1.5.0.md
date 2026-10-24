# FAVELLA 1 — Revisione critica del linguaggio (1.5.0)

> Motore **1.5.0**, grammatica **1.5.0**. Revisione del 24 ottobre 2026.
>
> **Esito in una riga.** Il linguaggio è in salute eccellente. Le 33 criticità
> dell'analisi 1.2.1 (GS-1…GS-4, G-1…G-9, M-1…M-11, L-1…L-9) restano chiuse; le
> tredici frasi nuove della 1.5.0 (§28 della specifica) si comportano come
> dichiarato. Questa revisione, condotta con una batteria di sonde avversarie
> mirata alle frasi nuove e alle loro cuciture, ha trovato **due difetti**: uno
> **medio** (diagnostica) e uno **lieve** (coerenza del linter). Entrambi sono
> corretti nel **motore radice** (`compilatore.py`, la fonte di verità); la suite
> resta verde (453 funzioni, 1286 asserzioni del linguaggio + 50 del collaudatore)
> e la guardia LALR(1) accetta la grammatica modificata senza ambiguità. Il
> consolidamento in un rilascio **1.5.1** (numero di versione in `strutture.py`,
> voce di CHANGELOG, copie del motore in `landingpage/` e `studio/`, PyPI e sito)
> segue la procedura di rilascio e non è compreso in questa revisione.

---

## 0. Metodo e scala di gravità

**Fonti.** Specifica `grammatica-1.5.0.md` (in particolare §28); `piano-1.5.0.md`;
codice di `compilatore.py`, `gioco.py`, `strutture.py`, `libreria_azioni.py`,
`favella_utils.py`; la libreria standard e la galleria; la demo *Il Relitto
Silente* (il banco di prova della 1.5.0).

**Verifica.** La suite esistente è verde. Ogni ipotesi è stata messa alla prova
con una storia-sonda minima, compilata con `favella.py compila` e, dove serviva,
giocata turno per turno con `favella.py gioca`. Le voci marcate **✅** sono state
riprodotte e ne è riportata l'uscita osservata. Il metodo è quello dell'analisi
1.2.1: le criticità vivono **nei punti in cui le tre letture di una frase** (lo
scanner a regex della Passata 1, la grammatica LALR della Passata 2, il parser del
giocatore scritto a mano) **non coincidono**, e in questa release soprattutto nel
*trattamento degli errori delle frasi nuove*, perché sono il codice più recente.

**Scala di gravità** (invariata rispetto alla 1.2.1).

| Livello | Criterio |
|---|---|
| **Gravissima** | Il motore fa silenziosamente altro rispetto a ciò che l'autore ha scritto, su costrutti comuni; né il compilatore, né il linter, né il collaudo se ne accorgono. |
| **Grave** | Difetto funzionale o trappola frequente; l'errore si vede, ma per capirlo serve conoscere l'interno del motore, oppure manca una capacità che il resto del linguaggio dà per scontata. |
| **Media** | Limite espressivo o incoerenza con un rimedio ragionevole. |
| **Lieve** | Difetti estetici, prestazioni non urgenti, documentazione non allineata. |

---

## 1. Che cosa è stato sondato

Ventidue sonde, raggruppate per area di rischio.

1. **Frasi nuove felici** (comportamento conforme): riga di stato con `[se]`
   annidato; `per la prima volta` + `altrimenti` su una regola; `Ogni N turni … e
   poi dire`; `e poi dire` che legge il valore *dopo* le conseguenze mentre `dire`
   legge quello *prima* (la vecchia trappola runtime è risolta per i testi che
   usano `e poi dire`); `il giocatore va in …` mostra la stanza, `si ritrova in …`
   no; uscite condizionali che restano nascoste finché la condizione è falsa e
   danno il testo `altrimenti` al passaggio.
2. **Validazioni promesse** (tutte scattano, con messaggi d'autore): ciclo fra
   stati calcolati; assegnazione di uno stato calcolato; `e basta` in un `Invece
   di`; `e basta` non in coda; `e poi dire` ripetuto; collisione nome-di-testo con
   un contatore o un oggetto (C9); IFID malformato; `segnala ""` vuoto.
3. **Regressione delle correzioni storiche** (tutte tengono): i sinonimi di
   libreria fanno scattare la regola scritta col verbo canonico (GS-1); `guarda X`
   esamina X (GS-2); `dai X a Y` con la preposizione `a` (G-7); il movimento
   forzato verso una stanza (`e adesso il giocatore va …`).
4. **Trattamento degli errori delle frasi nuove messe in posizione/forma
   sbagliata** — l'area che ha prodotto i due difetti sotto.

---

## 2. Criticità trovate

### R1 — `per la prima volta` sui demoni ricorrenti dà l'errore grezzo del parser ✅ *(Media — diagnostica)*

> **Corretta nel motore radice (destinata al rilascio 1.5.1).**

**Cosa.** `per la prima volta` è un costrutto 1.5.0 valido sui demoni `Quando`,
sugli arrivi e sulle regole. Su `Ogni turno se …` e su `N turni dopo che …` *deve*
essere un errore (la specifica C3 lo dichiara: quei demoni non hanno una «prima
volta» ben definita). Il transformer conteneva già il messaggio d'autore giusto —

```
«per la prima volta» vale per «Quando …», non per «Ogni turno se …».
«per la prima volta» vale per «Quando …», non per «N turni dopo che …».
```

— ma la **grammatica** non prevedeva `prima_volta?` su quelle due produzioni
(`demone_ogni`, `demone_dopo`), così quei due messaggi erano **codice
irraggiungibile**. L'autore riceveva invece l'errore grezzo del parser:

```
Ogni turno se l'aria è più di 0 per la prima volta: diminuisci l'aria.
                                ^  Mi aspettavo: i due punti «:».
```

**Perché conta.** È la cuffia fra la grammatica e la validazione semantica: il
rifiuto era giusto, ma il *messaggio* tradiva il principio G-2 («errori pensati per
chi non programma»), uno dei pilastri del progetto. Un autore che ha imparato `per
la prima volta` sui demoni `Quando` lo prova per analogia su `Ogni turno se` e
riceve un messaggio che indica il punto sbagliato e non spiega nulla.

**Correzione.** Nello stile del progetto (accetta a grammatica, rifiuta con un
messaggio semantico — lo stesso che fa `e basta` fuori posto): aggiunto
`prima_volta?` alle produzioni `demone_ogni` e `demone_dopo`, così il transformer
*raggiunge* la diagnostica già scritta. LALR(1) resta 0-ambiguo: dopo la condizione
il lookahead `per` (inizio di `prima_volta`) è disgiunto dai continuatori
`oppure`/`e`/`)` e da `:`, come già argomentato per `demone_quando`.

### R2 — Titolo, autore, prologo e IFID dichiarati due volte tacciono ✅ *(Lieve — coerenza del linter)*

> **Corretta nel motore radice (destinata al rilascio 1.5.1).**

**Cosa.** `La riga di stato è "…".`, `Il testo "…" è "…".` e `I comandi si …`
avvisano quando sono dichiarati due volte con valori diversi («vale l'ultima»).
`Il titolo`, `L'autore`, `Il prologo` e `L'IFID` no: sovrascrivono in silenzio.
Un'incoerenza del linter: lo stesso fatto (due dichiarazioni di presentazione in
conflitto) a volte si vede, a volte sparisce.

**Correzione.** Aggiunto l'avviso «… è dichiarato due volte: vale l'ultima.» ai
quattro casi, con la stessa forma degli altri. Non blocca nulla e non cambia il
testo di gioco: una sola dichiarazione non produce avvisi; la politica resta
«l'ultima vince».

---

## 3. Osservazioni: limiti strutturali persistenti (non difetti)

Non sono criticità: sono scelte di progetto confermate, che però conviene avere
sott'occhio perché definiscono il perimetro del linguaggio e alimentano la
pianificazione dell'espansione.

- **Il clamp è una conseguenza manuale, non un invariante.** `X resta fra A e B`
  (`cons_limita`) va richiamato esplicitamente a ogni modifica (`… e adesso la sete
  resta fra 0 e 100`). Senza, i contatori vanno sotto zero: la vecchia trappola
  «diminuisci sotto zero» del Viaggiatore resta l'idioma da ricordare. Un
  **invariante dichiarato una volta** (`La sete resta sempre fra 0 e 100.`) che il
  motore applica dopo ogni scrittura toglierebbe un'intera classe di dimenticanze.
  Candidato piccolo e ad alto valore per l'espansione.
- **Mondo chiuso** (4c rimandata): niente oggetti creati a runtime.
- **Niente quantità/plurali** (5a NO-GO) né **modelli di entità** (5b sconsigliato):
  dieci guardie identiche restano dieci blocchi (ammorbiditi da `qualcosa di P`,
  dai vincoli `Prima di … e basta` e dagli stati calcolati della 1.5.0).
- **Stati e contatori solo globali**: gli attributi numerici di un oggetto sono
  variabili dal nome composto (`la vita del cane`), non campi dell'oggetto.
- **Relazioni assenti come concetto**: «X è nascosto sotto Y», «A si fida di B»,
  «la chiave apre la porta» si codificano a mano con stati e condizioni. È il vuoto
  più grande e la pista più promettente per un salto di versione (vedi il documento
  di espansione).

---

## 4. Verifica

- **Suite completa verde dopo le correzioni:** `test_linguaggio.py` 453 funzioni
  (1286 asserzioni) + `test_collaudo.py` 50, `0` falliti. La guardia LALR(1)
  (`test_150_guardia_lalr_frasi_nuove`) accetta la grammatica con i due
  `prima_volta?` aggiunti.
- **Test di regressione aggiunti** (disciplina «ogni correzione ha i suoi test»):
  - in `test_150_c3_per_la_prima_volta`: due asserzioni che verificano il messaggio
    d'autore mirato su `Ogni turno se` e su `N turni dopo che` (R1);
  - in `test_150_riga_di_stato_e_ifid`: l'avviso di doppia dichiarazione per
    titolo/autore/prologo/IFID e l'assenza di falsi positivi su una sola
    dichiarazione (R2).

---

## 5. Appendice — Riepilogo

| ID | Gravità | Titolo | Verifica | Stato |
|---|---|---|---|---|
| R1 | Media | `per la prima volta` sui demoni ricorrenti: errore grezzo del parser invece del messaggio d'autore | ✅ | corretta nel motore radice, 1.5.1 (grammatica `demone_ogni`/`demone_dopo`) |
| R2 | Lieve | Titolo/autore/prologo/IFID dichiarati due volte tacciono | ✅ | corretta nel motore radice, 1.5.1 (`compilatore.py`, transformer) |

Nessuna criticità **gravissima** o **grave** aperta. Le 33 dell'analisi 1.2.1
restano chiuse (ricampionate con sonde: GS-1, GS-2, G-7 e il movimento forzato —
tutte tengono).
