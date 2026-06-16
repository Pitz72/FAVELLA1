# FAVELLA 1 — Specifica formale della grammatica (v0.31.0)

> Documento **tecnico** versionato. Fissa lo *scheletro statico* della grammatica
> di FAVELLA 1 e il modello dei *terminali chiusi generati per-file*. **Non** è il
> manuale d'autore: descrive il linguaggio dal punto di vista del compilatore.
>
> Fonte di verità del codice: `compilatore._GRAMMAR_TEMPLATE`.
> Un test della suite (`test_spec_ebnf_allineata_alla_grammatica`) verifica che
> questa spec resti allineata ai nomi di regola della grammatica reale.
>
> **Versione.** Dalla v0.18.0 grammatica, compilatore e motore condividono **una
> sola linea di versione**: questa specifica avanza in lockstep col motore.
> Versione corrente: **0.31.0**.
>
> **Novità v0.31.0 — «Tema 1: i contatori si parlano» (Cassetto B).** Fino alla
> 0.30.0 un contatore era una **cella isolata**: si faceva aritmetica e confronti
> solo contro **costanti letterali**, mai fra celle. La 0.31.0 introduce
> l'**operando-quantità**, ciò che produce un intero al momento dell'uso, in tre
> forme: un `NUMERO` letterale (storico), il **valore di un contatore** scritto
> fra parentesi quadre `[forza]` (come l'interpolazione `[nome]` dei testi:
> `[x]` = «il valore corrente di x»), e un'**estrazione casuale**
> `un numero fra A e B`. Due nuove regole inline: **`operando`** (per le
> *quantità*: `aumenta/diminuisci … di operando`, `… diventa operando`; tutte e
> tre le forme) e **`operando_confronto`** (per i *confronti* fra contatori:
> `NUMERO` o `[VARIABILE]`, **niente** estrazione casuale — una soglia ri-pescata
> a ogni valutazione non avrebbe senso). Le sei regole `cond_contatore_*` e le tre
> conseguenze di contatore (`cons_aumenta`, `cons_diminuisci`, `cons_contatore_set`)
> delegano ora il loro termine numerico all'operando. Questo abilita **Tema 1a**
> (`diminuisci la vita del lich di [forza]`), **Tema 1b** (`se la vita è meno di
> [soglia]: …`, confronto grandezza↔grandezza) e l'**estrazione casuale d'autore**
> (`il dado diventa un numero fra 1 e 6`), che riusa l'RNG seedato del mondo
> (`Mondo.rng`, già ANNULLA-safe per A2/A5). **Nodo LALR risolto:** le tre forme
> dell'operando partono da token disgiunti (`NUMERO | "[" | "un"`), così
> `è più di 3` (NUMERO) e `è più di [forza]` (VARIABILE) convivono con un solo
> token di lookahead → LALR(1) 0-ambiguo. Le parentesi quadre, fin qui viste solo
> dentro `TESTO_QUOTATO`, diventano due token letterali che **non collidono con
> nulla** (fuori dalle stringhe non comparivano). Scelta di progetto: il
> letterale resta **nudo** (`di 3`), il riferimento a contatore è **fra parentesi**
> (`di [forza]`) — i `[…]` marcano «valore dinamico», esattamente come
> nell'interpolazione. **Scartato (1c):** il «valore successivo» di uno stato
> ordinato (`sali di una marcia`); le N regole esplicite restano più leggibili di
> un nuovo concetto di «scala» (vedi `espansione-oltre-0.29.md`). Vedi §14.
>
> **Novità v0.30.0 — «Cassetto A: robustezza, diagnostica e due simmetrie».**
> Una sola modifica di grammatica: **`dire "…"` diventa OPZIONALE anche nelle
> regole** (`def_regola`), per simmetria con i «tick silenziosi» di eventi e
> demoni (A9). Una regola che muta solo lo stato può ora omettere il testo
> (`Invece di riposa: aumenta la forza.`). `def_regola` riusa lo stesso inline
> **`_esito_temporale`** già usato da `def_evento`/`def_demone`: prima alternativa
> `dire "…" [e adesso …]`, seconda alternativa solo conseguenze. Nessun nome di
> regola cambia; LALR(1) 0-ambiguo (dopo `:` il lookahead distingue `dire` dal
> primo token di una conseguenza, identico a eventi/demoni). Le altre voci del
> Cassetto A **non toccano l'EBNF**: **A1** intercetta in Passata 1 i nomi con
> caratteri non ammessi (es. `/`, che chiuderebbe il letterale regex del terminale
> generato) con un errore d'autore localizzato invece di un `GrammarError` grezzo;
> **A4** dà un avviso mirato quando il bersaglio di `è come` è una direzione
> (l'idioma corretto resta `A e B sono direzioni opposte.`). L'indagine **A2**
> (punto dentro le virgolette) è stata **rimandata** per rischio di falsi positivi
> (la Passata 1 è tollerante per design). Vedi §13.
>
> **Novità v0.28.0 — «Revisione totale, Lotto 2» (robustezza).** Una sola
> modifica di grammatica: **`PREP_LUOGO` diventa una regex con confine destro** e
> insieme articolato COMPLETO, così una preposizione non si stacca più dall'inizio
> di un aggettivo-stato monoparola (`La lapide è incisa.` non è più letto `in`+
> `cisa`; idem `sulfurea`). Le forme con apostrofo (`nell'`, `sull'`) non portano il
> confine. Poiché `nel` non si scompone più in `nel`+`lo`, le forme articolate sono
> ora elencate per intero (`nello`, `nei`, …). Nessun nome di regola cambia. Le
> altre voci del Lotto 2 sono **runtime**: turno atomico su eccezione in una
> conseguenza (rollback all'istantanea pre-turno) e conversazione annullabile come
> unità (ANNULLA riporta a prima di `parla con …`). Vedi §13 (terminali).
>
> **Novità v0.27.0 — «Revisione totale, Lotto 1» (correttezza).** Una sola
> modifica di grammatica: la **copula plurale** si estende a stati e contatori,
> i cui nomi sono spesso plurali (`Le vite sono un contatore.`, `Le luci sono uno
> stato.`, `Le luci sono accese.`, `Le vite partono da 3.`). `def_stato`,
> `def_stato_valore` e `def_contatore` usano ora `_copula` (era `"è"`);
> `def_contatore_iniziale` accetta `"parte" | "partono"`. Riservata aggiunta:
> `partono`. LALR(1) 0-ambiguo (VARIABILE resta disgiunto da ENTITA). Le altre
> voci del Lotto 1 sono **runtime/semantica** e non toccano l'EBNF: `accesa↔spenta`
> opposte di default, `lascia` bloccato al buio, iniziale-maiuscola che preserva i
> nomi propri. Vedi §10.
>
> **Novità v0.26.0 — «A6: sinonimi di verbo».** `"ghermisci" è come prendi.`
> rimappa una parola-nuova (quotata) a un verbo di libreria: a runtime il parser la
> riscrive nel canonico, così si comporta identicamente senza una regola per ogni
> oggetto. Nuova regola **`def_sinonimo`** (`TESTO_QUOTATO "è" "come" VERBO "."`),
> distinta da `def_verbo` sul lookahead `come` vs `un`. Riservata aggiunta: `come`.
> Vedi §12.
>
> **Nota sulle release 0.20.0, 0.21.0 e 0.23.0.** Sono state **senza modifiche di
> grammatica**: A1 pronomi e anafora (0.20.0, parser dei comandi del giocatore), A3
> comandi di servizio ANNULLA/ANCORA/TRASCRIZIONE (0.21.0, runtime), e il
> collaudatore statico `collaudo.py` (0.23.0, strumento esterno). Non compaiono in
> questa EBNF perché non sono sintassi d'autore.
>
> **Novità v0.25.0 — «A5: movimento degli NPC».** Un personaggio (o altro oggetto)
> può cambiare stanza, così il mondo non sembra un museo. Due conseguenze nuove
> nella regola `conseguenza`: **`cons_png_va`** (`ENTITA "va" PREP_LUOGO ENTITA`,
> deterministica: `la guardia va nel corridoio`) e **`cons_png_cambia`**
> (`ENTITA "cambia" "stanza"`, casuale: `il gatto cambia stanza`, una stanza
> adiacente a caso pescata da `mondo.rng`). Se la mossa coinvolge la stanza del
> giocatore, il motore lo annuncia. Riservate aggiunte: `va`, `cambia`. La forma
> casuale **non** usa `va in una stanza adiacente` (collide col lexer su `PREP_LUOGO`
> `in`): `cambia stanza` è l'equivalente LALR-safe. Vedi §11.
>
> **Novità v0.24.0 — «A4: buio e luce».** Una stanza può essere dichiarata **al
> buio** (`La cantina è buia.`) e un oggetto può essere una **fonte di luce**
> (`La torcia illumina.`). In una stanza buia priva di una fonte di luce accesa
> raggiungibile il motore mostra «È buio pesto.» e blocca esamina/prendi/metti (le
> uscite restano percorribili). Una sola novità di grammatica: la regola di
> capacità **`def_illumina`** (`ENTITA "illumina" "."`). Il buio della stanza NON
> ha una regola dedicata: `buia` è una **proprietà speciale** riconosciuta nel
> transformer (per radice `bui-`), come `prendibile`. Vedi §10.
>
> **Novità v0.22.0 — «A2: varietà nelle risposte»:** una descrizione può avere
> **più varianti**, con due politiche. `La descrizione del mare è una di: "…", "…".`
> (casuale, mai due volte di fila la stessa) e `La descrizione del faro è in
> sequenza: "…", "…".` (rotazione, l'ultima resta). La regola `def_descrizione`
> delega il valore a `descr_valore` (`descr_singola` | `descr_casuale` |
> `descr_sequenza`). La casualità usa un generatore del mondo con **seme fisso**
> (riproducibile; lo stato è catturato da ANNULLA). Vedi §9.
>
> **Novità v0.19.0 — «Lezioni dallo stress-test di genere»** (vedi §8):
> - **A7** **Verbi intransitivi**: `"accelera" è un comando senza oggetto.`
>   (`verbo_con_oggetto` / `verbo_senza_oggetto`).
> - **A8** **Inventario iniziale del giocatore**: `Il giocatore ha la torcia.`
>   (`def_giocatore_inventario`).
> - **A9** **Esito temporale senza testo** («tick» silenzioso): `dire "…"`
>   opzionale in eventi e demoni (regola inline `_esito_temporale`).

## 1. Modello di compilazione (due passate + preprocessore)

La compilazione di un file `.fav` avviene in tre fasi:

- **Passata 0 — Preprocessore degli import** (`espandi_inclusioni`): espande le
  direttive `Includi "file.fav".` in un unico sorgente, **prima** del parsing.
  La direttiva non raggiunge mai il parser, quindi non incide sulla grammatica.
  In questa fase il sorgente è normalizzato in forma **NFC** (A3, 0.18.0) e nella
  tipografia (apostrofi/virgolette curve → dritte).
- **Passata 1 — Scanner / symbol table** (`costruisci_symbol_table`): raccoglie i
  nomi dichiarati di stanze e oggetti (**ENTITÀ**), di stati e contatori
  (**VARIABILE**) e le coppie di direzioni personalizzate. Riconosce sia la copula
  `è` sia `sono` (A5). Estrae i verbi multi-parola per il terminale `VERBO_MULTI`
  (lo scanner `"…" è un comando` intercetta anche la coda `senza oggetto`).
- **Passata 2 — Parsing LALR(1)** (`costruisci_parser` + `FavellaTransformer`): la
  grammatica concreta viene generata per-file sostituendo i terminali chiusi, poi
  un parser **LALR(1)** produce l'AST, trasformato nell'oggetto `Mondo`.

**Invariante fondamentale:** la grammatica è **LALR(1), non ambigua per
costruzione**. I nomi (ENTITÀ/VARIABILE/DIREZIONE) sono *terminali chiusi*
(alternanza dei soli simboli dichiarati). Ogni eventuale conflitto emerge a
build-time come `GrammarError`, mai come scelta silenziosa a runtime.

## 2. Scheletro statico (EBNF)

Le `__ENTITA__`, `__VARIABILE__`, `__DIREZIONE_ALT__` sono **segnaposto**
sostituiti per-file con le regex dei simboli noti (vedi §3). La sintassi è quella
di Lark (EBNF con azioni `-> nome`).

```ebnf
    start: dichiarazione+

    ?dichiarazione: def_stanza
                  | def_oggetto
                  | def_verbo
                  | def_descrizione
                  | def_posizione
                  | def_proprieta
                  | def_opposti
                  | def_alias
                  | def_connessione
                  | def_regola
                  | def_giocatore
                  | def_stato
                  | def_stato_valore
                  | def_contatore
                  | def_contatore_iniziale
                  | def_contenitore
                  | def_supporto
                  | def_personaggio
                  | def_dialogo_inizio
                  | def_battuta
                  | def_opzione
                  | def_direzioni
                  | def_evento
                  | def_demone
                  | def_giocatore_capacita
                  | def_giocatore_inventario
                  | def_capacita_oggetto
                  | def_illumina

    // --- COPULA FLESSIBILE NEL NUMERO (A5) ---
    _copula: "è" | "sono"

    // --- DEFINIZIONI BASE ---
    def_stanza: ENTITA _copula "una" "stanza" "."
    def_oggetto: ENTITA _copula "una" "cosa" "."
    def_contenitore: ENTITA _copula "un" "contenitore" "."
    def_supporto: ENTITA _copula "un" "supporto" "."
    def_personaggio: ENTITA _copula "un" "personaggio" "."
    // [A7] Un comando può essere TRANSITIVO (storico) o INTRANSITIVO ('senza
    // oggetto'). Dopo "comando" il lookahead "." vs "senza" distingue → 0-ambiguo.
    def_verbo: TESTO_QUOTATO "è" "un" "comando" "senza" "oggetto" "." -> verbo_senza_oggetto
             | TESTO_QUOTATO "è" "un" "comando" "."                   -> verbo_con_oggetto
    // [A6] Sinonimo di verbo: '"ghermisci" è come prendi.'. Inizia con
    // TESTO_QUOTATO come def_verbo; dopo '"…" è' il lookahead "come" vs "un"
    // distingue → LALR(1) 0-ambiguo.
    def_sinonimo: TESTO_QUOTATO "è" "come" VERBO "."
    // [A2] Il valore della descrizione è delegato a descr_valore: stringa singola
    // (storico) o varianti casuali / in sequenza. Dopo "è" il lookahead
    // TESTO_QUOTATO | "una" | "in" distingue le tre forme → LALR(1) 0-ambiguo.
    def_descrizione: "La" "descrizione" _PREP_DESCR ENTITA ( "se" condizione )? "è" descr_valore "."
    descr_valore: TESTO_QUOTATO                                            -> descr_singola
                | "una" "di" ":" TESTO_QUOTATO ( "," TESTO_QUOTATO )*      -> descr_casuale
                | "in" "sequenza" ":" TESTO_QUOTATO ( "," TESTO_QUOTATO )* -> descr_sequenza
    def_posizione: ENTITA _copula PREP_LUOGO ENTITA "."
    def_proprieta: ENTITA _copula PROPRIETA "."
    // [A4] Fonte di luce: 'La torcia illumina.'. Capacità (come 'dà N spazi'):
    // inizia con ENTITA, dopo cui il lookahead "illumina" distingue da
    // è/sono/si/collega/dà/al → LALR(1) 0-ambiguo. Il buio della stanza
    // ('La cantina è buia.') è una proprietà speciale (def_proprieta), non una regola.
    def_illumina: ENTITA "illumina" "."
    def_opposti: PROPRIETA "e" PROPRIETA "sono" "opposte" "."
    def_alias: ENTITA "si" "chiama" "anche" TESTO_QUOTATO "."
    def_connessione: ENTITA "collega" DIREZIONE "a" ENTITA "."
    def_giocatore: "Il" "giocatore" ( "comincia" | "inizia" | "parte" ) PREP_LUOGO ENTITA "."

    // --- CAPACITÀ DI TRASPORTO (Livello 7) E INVENTARIO INIZIALE (A8) ---
    def_giocatore_capacita: "Il" "giocatore" "può" "portare" NUMERO "oggetti" "."
    // [A8] Inventario iniziale: dopo 'Il giocatore' il lookahead "ha" distingue da
    // "comincia/inizia/parte" (posizione) e "può" (capacità) → 0-ambiguo.
    def_giocatore_inventario: "Il" "giocatore" "ha" ENTITA "."
    def_capacita_oggetto: ENTITA "dà" NUMERO "spazi" "."

    // --- STATO ASTRATTO (stati e contatori) ---
    // [0.27.0/A] _copula (è|sono) e "parte"|"partono": i nomi di stato/contatore
    // sono spesso plurali ('le vite', 'i punti', 'le munizioni').
    def_stato: VARIABILE _copula "uno" "stato" "."
    def_stato_valore: VARIABILE _copula PROPRIETA "."
    def_contatore: VARIABILE _copula "un" "contatore" "."
    def_contatore_iniziale: VARIABILE ( "parte" | "partono" ) "da" NUMERO "."

    // --- TOPOLOGIA: DIREZIONI PERSONALIZZATE ---
    def_direzioni: DIREZIONE "e" DIREZIONE "sono" "direzioni" "opposte" "."

    // --- ESITO TEMPORALE (A9): battuta opzionale + conseguenze ---
    // Regola INLINE condivisa da eventi e demoni: o 'dire "…"' con conseguenze in
    // coda, OPPURE una o più conseguenze SENZA testo (tick silenzioso). Dopo ':'
    // il lookahead "dire" vs primo-token-di-conseguenza distingue → 0-ambiguo.
    _esito_temporale: "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )?
                    | conseguenza ( "e" "adesso"? conseguenza )*

    // --- EVENTI A TURNI ---
    def_evento: "Al" "turno" NUMERO ":" _esito_temporale "." -> evento_al
              | "Ogni" NUMERO ( "turno" | "turni" ) ":" _esito_temporale "." -> evento_ogni

    // --- DEMONI / EVENTI CONDIZIONALI (Livello 8) ---
    def_demone: "Ogni" "turno" "se" condizione ":" _esito_temporale "." -> demone_ogni
              | "Quando" condizione ( "diventa" "vera" )? ":" _esito_temporale "." -> demone_quando

    // --- NPC E DIALOGHI ---
    def_dialogo_inizio: "Il" "dialogo" _PREP_DESCR ENTITA "comincia" "con" TESTO_QUOTATO "."
    def_battuta: ENTITA "al" "nodo" TESTO_QUOTATO "dice" TESTO_QUOTATO "."
    def_opzione: "Al" "nodo" TESTO_QUOTATO "l'" "opzione" TESTO_QUOTATO ( "se" condizione )? opzione_esito ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "."
    opzione_esito: "conduce" "al" "nodo" TESTO_QUOTATO -> esito_conduce
                 | "chiude" "il" "dialogo"             -> esito_chiude

    // --- REGOLE (INVECE DI) ---
    def_regola: "Invece" "di" ( VERBO_MULTI | VERBO ) regola_target? ( "se" condizione )? ":" _esito_temporale "."   // [0.30.0/A3] dire opzionale: riusa _esito_temporale (come evento/demone)
    regola_target: ( ENTITA | DIREZIONE ) ( PREP_AZIONE ENTITA )?

    // --- CONDIZIONI (logica booleana: OR < AND < atomo) ---
    ?condizione: cond_or
    ?cond_or: cond_and ( "oppure" cond_and )+ -> make_or
            | cond_and
    ?cond_and: cond_base ( "e" cond_base )+ -> make_and
             | cond_base
    ?cond_base: cond_possesso
              | cond_possesso_neg
              | cond_posizione_giocatore
              | cond_posizione_giocatore_neg
              | cond_proprieta
              | cond_proprieta_neg
              | cond_variabile
              | cond_variabile_neg
              | cond_contatore_eq
              | cond_contatore_neq
              | cond_contatore_gte
              | cond_contatore_gt
              | cond_contatore_lt
              | cond_contatore_lte
              | cond_non_gruppo
              | "(" cond_or ")"
    cond_possesso: "il" "giocatore" "ha" ENTITA
    cond_possesso_neg: "il" "giocatore" "non" "ha" ENTITA
    cond_posizione_giocatore: "il" "giocatore" _copula PREP_LUOGO ENTITA
    cond_posizione_giocatore_neg: "il" "giocatore" "non" _copula PREP_LUOGO ENTITA
    cond_proprieta: ENTITA _copula PROPRIETA
    cond_proprieta_neg: ENTITA "non" _copula PROPRIETA
    cond_variabile: VARIABILE "è" PROPRIETA
    cond_variabile_neg: VARIABILE "non" "è" PROPRIETA
    // [0.31.0 / Tema 1b] Il termine di confronto è un operando_confronto: NUMERO
    // letterale OPPURE il valore di un contatore '[forza]' → confronti
    // grandezza↔grandezza. FIRST(operando_confronto) = {NUMERO, "["} resta
    // disgiunto da PROPRIETA (cond_variabile) e dalle keyword almeno/più/meno/al.
    cond_contatore_eq: VARIABILE "è" operando_confronto
    cond_contatore_neq: VARIABILE "non" "è" operando_confronto
    cond_contatore_gte: VARIABILE "è" "almeno" operando_confronto
    cond_contatore_gt: VARIABILE "è" "più" "di" operando_confronto
    cond_contatore_lt: VARIABILE "è" "meno" "di" operando_confronto
    cond_contatore_lte: VARIABILE "è" "al" "massimo" operando_confronto
    cond_non_gruppo: "non" "(" cond_or ")"

    // --- CONSEGUENZE (clausola 'e adesso') ---
    ?conseguenza: ENTITA _copula PREP_LUOGO ENTITA -> cons_spostamento
                | ENTITA _copula PROPRIETA          -> cons_proprieta
                | "il" "giocatore" _copula PREP_LUOGO ENTITA -> cons_giocatore_sposta
                | ENTITA "va" PREP_LUOGO ENTITA  -> cons_png_va
                | ENTITA "cambia" "stanza"       -> cons_png_cambia
                | VARIABILE "è" PROPRIETA        -> cons_variabile
                // [0.31.0 / Tema 1a + casualità] La QUANTITÀ è un operando (NUMERO,
                // valore di contatore [forza], o 'un numero fra A e B').
                | "aumenta" VARIABILE ( "di" operando )?    -> cons_aumenta
                | "diminuisci" VARIABILE ( "di" operando )? -> cons_diminuisci
                | VARIABILE "diventa" operando   -> cons_contatore_set
                | "vinci" TESTO_QUOTATO?         -> cons_vinci
                | "perdi" TESTO_QUOTATO?         -> cons_perdi
                | "termina" TESTO_QUOTATO?       -> cons_termina

    // --- OPERANDO-QUANTITÀ (Tema 1a + estrazione casuale, 0.31.0) ---
    // Ciò che produce un intero al momento dell'uso. Le tre forme partono da
    // token disgiunti (NUMERO | "[" | "un") → LALR(1) 0-ambiguo. La forma
    // "[" VARIABILE "]" rispecchia l'interpolazione [nome] dei testi.
    operando: NUMERO                                  -> operando_numero
            | "[" VARIABILE "]"                        -> operando_variabile
            | "un" "numero" "fra" NUMERO "e" NUMERO    -> operando_casuale
    // Operando dei CONFRONTI fra contatori: solo letterale o valore di contatore
    // (niente estrazione casuale in una condizione).
    operando_confronto: NUMERO                 -> operando_numero
                      | "[" VARIABILE "]"       -> operando_variabile
```

## 3. Terminali

### 3.1 Terminali fissi

```ebnf
    // [0.28.0/D] regex con CONFINE DESTRO sulle forme semplici (insieme articolato
    // completo): 'in'/'nel'/'sul'… non si staccano più dall'inizio di un aggettivo
    // monoparola ('è incisa' ≠ 'in'+'cisa'). Apostrofo (nell'/sull') senza confine.
    PREP_LUOGO: /nell'|sull'|(?:in|nel|nello|nella|nei|negli|nelle|sul|sullo|sulla|sui|sugli|sulle)(?![a-zA-ZÀ-ÿ0-9'])/i
    PREP_AZIONE: "sull'" | "sul" | "sullo" | "sulla" | "sui" | "sugli" | "sulle" | "su" | "con" | "contro" | "nell'" | "nel" | "nello" | "nella" | "nei" | "negli" | "nelle" | "in"
    _PREP_DESCR: "di" | "del" | "dei" | "della" | "dell'" | "degli" | "delle"
    VERBO: WORD
    WORD: /[a-zA-ZÀ-ÿ0-9']+/
    NUMERO.2: /[0-9]+/
    PROPRIETA.-1: /[a-zA-ZÀ-ÿ0-9']+/
    TESTO_QUOTATO: /"(\\.|[^"\\])*"/
```

Note di disambiguazione lessicale:

- **`PROPRIETA`** è un aggettivo di stato coniato, **monoparola**, a priorità
  **bassa** (`.-1`): i keyword strutturali vincono sempre la contesa lessicale.
- **`NUMERO`** ha priorità **alta** (`.2`): un token tutto-cifre si risolve a
  numero (contatori e capacità), non a proprietà.
- **`PREP_AZIONE`** (A4, 0.18.0) include le forme articolate, simmetriche a
  `PREP_LUOGO`. La sovrapposizione fra i due terminali è innocua: non sono mai
  validi nello stesso stato LALR.
- **`_PREP_DESCR`** (A2, 0.18.0) include `dei`. È un terminale unico filtrato
  (maximal-munch).

### 3.2 Terminali CHIUSI generati per-file

Sostituiti in Passata 2 dai simboli raccolti in Passata 1
(`costruisci_grammatica`):

```ebnf
    DIREZIONE.2: /(?:__DIREZIONE_ALT__)\b/i
    VERBO_MULTI.3: /(?:__VERBI_MULTI__)\b/i
    ENTITA: /__ENTITA__/i
    VARIABILE: /__VARIABILE__/i
```

- **`ENTITA`** — alternanza chiusa dei nomi di stanze e oggetti dichiarati (più
  gli pseudo-simboli `inventario` e `nulla`). Articolo iniziale **opzionale**,
  confine di parola finale `\b`, ordinamento per lunghezza decrescente
  (longest-match). Supporta nomi **multiparola**.
- **`VARIABILE`** — alternanza chiusa degli «stati»/contatori dichiarati,
  **disgiunta** da `ENTITA`.
- **`DIREZIONE`** — forme di base più le direzioni personalizzate dichiarate.
- **`VERBO_MULTI`** (0.18.0 / B6) — alternanza chiusa dei verbi personalizzati
  **multi-parola** dichiarati, con spazi flessibili (`\s+`) e priorità **alta**
  (`.3`). Vale anche per i verbi multi-parola dichiarati **intransitivi** (A7).
- Un terminale chiuso **vuoto** diventa la regex `[^\s\S]` (non matcha mai).

```ebnf
    %import common.WS
    %ignore WS
    COMMENT: /#[^\n]*/
    %ignore COMMENT
```

## 4. Lessico ausiliario (fuori grammatica)

Alcuni elementi vivono **dentro** `TESTO_QUOTATO` e sono perciò invisibili alla
grammatica (zero rischio di ambiguità): l'interpolazione `[nome]`, la direttiva
`Includi "file.fav".`, e la parola-comando dei verbi personalizzati (mono e
multi-parola, transitivi e intransitivi).

## 5. Vincoli di stabilità

- La grammatica resta **LALR(1) 0-ambigua**; una guardia permanente nella suite
  verifica «1 albero / 0 conflitti» a ogni costrutto.
- Il *vocabolario nuovo* (alias, verbi, etichette di nodo, testi delle opzioni,
  path di import) si introduce **sempre tra virgolette**.

## 6. Semantica dei demoni (Livello 8)

I demoni sono due produzioni che riusano `condizione` e l'esito temporale,
valutati a **fine turno** dopo gli eventi a tempo.

- **`demone_ogni` — `Ogni turno se [cond]: …`** (a **livello**): scatta a ogni
  turno in cui la condizione è vera.
- **`demone_quando` — `Quando [cond] (diventa vera)?: …`** (sul **fronte di
  salita**): scatta **una sola volta**, quando la condizione passa da falsa a
  vera. `Demone.era_vera` è inizializzato a fine compilazione.

## 7. Consolidamento v0.18.0 — semantica delle integrazioni

(Invariato rispetto alla 0.18.0: regole a 2 oggetti con `se`, posizione/
teletrasporto del giocatore, testo d'esito, verbi multi-parola. Vedi
`grammatica-0.18.0.md`.)

## 8. Lezioni dallo stress-test di genere — semantica v0.19.0

Tre integrazioni nate costruendo un **simulatore di guida testuale** (un genere
fuori dall'asse del design originale): i punti d'attrito sono diventati primitive.

- **A7 (verbi intransitivi).** `dichiara_verbo(verbo, intransitivo=True)` popola
  `Mondo.verbi_intransitivi` (sottoinsieme di `verbi_personalizzati`). In
  `carica_azioni` i verbi custom si dividono: i **transitivi** vanno all'azione
  `_personalizzata`, gli **intransitivi** a `_personalizzata_intransitiva`. A
  runtime un verbo intransitivo raggiunge la **fase delle regole globali**, dove
  una `Invece di accelera: …` senza bersaglio lo gestisce. Vale anche multi-parola.
- **A8 (inventario iniziale).** `def_giocatore_inventario` registra l'oggetto in
  `_pending_inventario_iniziale`; in `valida_post` l'oggetto è messo in
  `Mondo.inventario`. Oggetto inesistente = errore bloccante. Un oggetto per frase.
- **A9 (esito temporale senza testo).** La regola inline `_esito_temporale`
  rende opzionale la battuta `dire "…"` di eventi e demoni, a patto che ci sia
  almeno una conseguenza. Il runtime stampa la battuta solo se non vuota.

Riservate aggiunte da questo ciclo: `senza`, `oggetto` (A7).

## 9. Varietà nelle risposte — semantica v0.22.0 (A2)

`def_descrizione` delega il valore a **`descr_valore`**, che ha tre forme alias:

- **`descr_singola`** (`"…"`): una stringa, comportamento storico.
- **`descr_casuale`** (`una di: "a", "b", …`) e **`descr_sequenza`**
  (`in sequenza: "a", "b", …`): il transformer costruisce una
  **`VariantiDescrizione(testi, politica)`** (`strutture.py`).

A render-time, `strutture._descrizione_attuale` risolve una `VariantiDescrizione`
chiamando `.scegli(mondo)`: **sequenza** avanza un indice interno (sull'ultima
resta); **casuale** pesca da `mondo.rng` (`random.Random(SEME_CASUALE_DEFAULT)`)
evitando di ripetere subito l'ultima variante. `mondo.rng` e gli indici sono
**stato del mondo**: catturati e ripristinati dalle istantanee di **ANNULLA**.
Riservata aggiunta: `sequenza`.

## 10. Buio e luce — semantica v0.24.0 (A4)

Il pattern «stanza buia finché non hai una luce», universale nell'IF, è una
primitiva del motore.

- **Stanza al buio.** `La cantina è buia.` non ha una regola di grammatica
  dedicata: `buia` è una **proprietà speciale**, riconosciuta nel transformer
  (`_applica_proprieta`) per **radice** (`bui-` → buia/buio/buie), che imposta
  `Stanza.buia = True`. È l'unica proprietà ammessa su una stanza (ogni altra
  resta un errore). Il buio è **statico** (la stanza non si «illumina» da sé): la
  luce nel mondo cambia accendendo/spegnendo le fonti, non la stanza.
- **Fonte di luce.** `La torcia illumina.` è la regola di capacità **`def_illumina`**
  (`ENTITA "illumina" "."`), additiva e order-independent (crea-su-riferimento),
  che imposta `Oggetto.illumina = True`. Riservate aggiunte: `buia`, `buio`,
  `illumina`.
- **Visibilità.** `Mondo.c_e_luce()` (in `strutture.py`) è vero se la stanza
  corrente non è buia **oppure** è raggiungibile una fonte `illumina` accesa.
  «Accesa» = `illumina` **e** non «spenta» (folding per radice `spent-`, così
  l'interazione con le opposte accesa/spenta è automatica; una torcia senza stato
  illumina sempre). La raggiungibilità riusa `oggetti_raggiungibili()`: una fonte
  dentro un **contenitore chiuso** non illumina; una in mano (inventario) o una
  che brilla a terra nella stanza sì.
- **Runtime.** In una stanza buia senza luce, `mostra_stanza`/`guarda` stampano
  «È buio pesto.» (niente descrizione, oggetti, uscite) ed `esamina`/`prendi`/
  `metti` rispondono «È troppo buio per vederci.». Le **uscite restano
  percorribili** (il movimento funziona alla cieca). Le regole d'autore
  (`Invece di esamina X`) hanno la precedenza sulla logica di default: un autore
  può rendere qualcosa percepibile anche al buio. **Grammatica LALR(1) 0-ambigua**
  per costruzione (`def_illumina` distinta dopo ENTITA sul lookahead `illumina`).

## 11. Movimento degli NPC — semantica v0.25.0 (A5)

I personaggi (Livello 5b) erano statici: i demoni (Livello 8) forniscono già il
*quando*, mancava la conseguenza di *movimento*. Due conseguenze nuove (classe
`ConseguenzaMovimentoPNG`), usabili in regole, eventi, demoni e opzioni di dialogo:

- **`cons_png_va`** — `la guardia va nel corridoio` (deterministica): sposta il
  personaggio nella stanza indicata (validata a compile-time come esistente).
- **`cons_png_cambia`** — `il gatto cambia stanza` (casuale): lo sposta in una
  stanza **adiacente** scelta a caso fra le uscite della stanza in cui si trova,
  usando `mondo.rng` (riproducibile e ANNULLA-safe, come le varianti A2). Senza
  uscite, il personaggio resta dov'è.
- **Annunci.** Se la mossa coinvolge la stanza del giocatore — l'NPC ne **esce**
  («La guardia se ne va verso nord.», con la direzione se la destinazione è
  adiacente; «… se ne va.» altrimenti) o vi **entra** («Il gatto arriva.») — il
  motore accoda un messaggio in `Mondo.annunci`. Le conseguenze restano **pure**
  (non stampano): il loop di gioco svuota la coda (`_stampa_annunci`) dopo ogni
  blocco di conseguenze (eventi/demoni a fine turno, regole, scelte di dialogo).
  `annunci` è stato di sessione, escluso dalle istantanee di ANNULLA.
- **LALR-safe.** Entrambe iniziano con `ENTITA`; dopo l'entità il lookahead
  distingue `_copula` (spostamento/proprietà) da `va` e `cambia`. La forma casuale
  evita di proposito `va in una stanza adiacente`, che collide col lessico su
  `PREP_LUOGO` `in`: `cambia stanza` è l'equivalente privo di collisioni.
  Riservate aggiunte: `va`, `cambia`.

## 12. Sinonimi di verbo — semantica v0.26.0 (A6)

`"ghermisci" è come prendi.` (`def_sinonimo`) registra in `Mondo.sinonimi_verbo`
una mappa parola-nuova → verbo di libreria. A differenza di un verbo personalizzato
(`"spingi" è un comando.`, che richiede una regola `Invece di` per ogni oggetto),
un sinonimo **rimappa** al verbo di libreria: il parser dei comandi (`gioco._esegui_comando`)
riscrive la parola-comando in testa nel canonico **prima** di ogni altro
trattamento, così il sinonimo eredita tutto — regole `Invece di prendi …`, anafora,
logica di default. Come per gli alias di oggetto, il sinonimo serve **l'input del
giocatore**; nelle regole d'autore vale il verbo canonico. Il bersaglio dev'essere
un verbo noto al motore (`VERBI_VALIDI`), altrimenti il sinonimo è morto (warning
non bloccante). Riservata aggiunta: `come`. La parola-nuova è **monoparola** a
runtime (in testa al comando). **Grammatica LALR(1) 0-ambigua** (`def_sinonimo`
distinta da `def_verbo` sul lookahead `come` vs `un`).

## 13. Cassetto A — robustezza e diagnostica v0.30.0

Quattro rifiniture a basso rischio, una sola delle quali tocca l'EBNF.

- **A1 — nomi non validi (Passata 1).** Ogni nome dichiarato (entità, stato,
  contatore, direzione personalizzata, verbo multiparola) diventa un terminale
  CHIUSO generato per-file, incassato in un letterale regex `/…/`. Un carattere
  come `/` lo chiude in anticipo e corrompe l'intera grammatica: in passato
  l'autore vedeva un `GrammarError` interno e incomprensibile, su una riga della
  grammatica *generata*. `valida_nomi_dichiarati` lo intercetta **prima** di
  costruire il parser, con un errore d'autore localizzato (riga, colonna,
  carattere incriminato) e codice diagnostico `nome-non-valido`. Alfabeto
  ammesso nei nomi: lettere (anche accentate, `À-ÿ`), cifre, spazi e l'apostrofo
  — lo stesso del terminale `WORD`.

- **A2 — punto dentro le virgolette: RIMANDATO.** Lo scanner di Passata 1 svuota
  le stringhe quotate (`_RE_QUOTATO`); un punto-fine-frase scritto *dentro* le
  virgolette viene rimosso con la stringa, fondendo due frasi e facendo cadere
  l'errore su una riga lontana. Una diagnostica proattiva non è perseguibile
  senza falsi positivi: la continuazione legittima `dire "X."` seguita a capo da
  `e adesso …` è **indistinguibile**, in Passata 1, dall'errore — distinguere
  richiederebbe il parser, che la Passata 1 deliberatamente non è. La regola
  d'autore «il punto va fuori dalle virgolette» resta documentata nel manuale.

- **A3 — `dire` opzionale nelle regole.** Unica modifica di grammatica (vedi
  §2): `def_regola` riusa l'inline `_esito_temporale`. Il transformer estraeva
  già la risposta per tipo (stringa opzionale, default `""`), quindi i metodi
  restano invariati; a runtime una regola con risposta vuota NON stampa una riga
  vuota (guardia `if regola.risposta:`, come per eventi e demoni).

- **A4 — idioma di direzione.** `"sinistra" è come est.` non rimappa una
  direzione: `è come` (`def_sinonimo`) vale **solo per i verbi**. Decisione:
  mantenere l'idioma esistente — più pulito — `Sinistra e destra sono direzioni
  opposte.` (`def_direzioni`), e **migliorare l'avviso**: quando il bersaglio di
  `è come` è una forma di direzione, il warning lo dice esplicitamente e indica
  l'idioma corretto, invece del generico «non è un verbo noto». Nessuna modifica
  di grammatica.

## 14. Tema 1 — i contatori si parlano (operando-quantità) v0.31.0

Fino alla 0.30.0 i contatori erano **celle isolate**: aritmetica e confronti
solo contro **costanti letterali**. La 0.31.0 li fa parlare introducendo
l'**operando**, l'unità che produce un intero al momento dell'uso.

- **Modello.** Un `Operando` (in `strutture.py`) ha un solo metodo,
  `valore(mondo) -> int`. Tre concretizzazioni:
  - **`OperandoNumero`** (`di 3`) — un intero letterale.
  - **`OperandoVariabile`** (`di [forza]`) — il valore corrente di un contatore;
    un contatore mai impostato, o uno «stato» non numerico, vale **0** (stessa
    tolleranza di `CondizioneContatore`). La forma `[x]` rispecchia
    l'interpolazione `[x]` dei testi: in entrambi i casi significa «il valore
    corrente di x».
  - **`OperandoCasuale`** (`di un numero fra 2 e 6`) — un'estrazione uniforme
    nell'intervallo **chiuso** `[min, max]`, pescata da `mondo.rng` (il
    generatore seedato del mondo, `random.Random(SEME_CASUALE_DEFAULT)`). Estremi
    invertiti (`fra 6 e 2`) riordinati. Essendo `mondo.rng` **stato del mondo**,
    le istantanee di **ANNULLA** lo catturano e lo ripristinano: rigiocando la
    stessa azione si riottiene la stessa estrazione (come per A2/A5).

- **Quantità (Tema 1a).** Le tre conseguenze di contatore prendono un `operando`
  (regola `operando`, tutte e tre le forme): `cons_aumenta`/`cons_diminuisci`
  (`… di operando`, default `OperandoNumero(1)` se `di` è assente) e
  `cons_contatore_set` (`… diventa operando`). `ConseguenzaContatore.esegui`
  risolve `self.valore.valore(mondo)` al momento dell'applicazione.

- **Confronti (Tema 1b).** Le sei `cond_contatore_*` prendono un
  `operando_confronto` (`NUMERO` o `[VARIABILE]`, **niente** estrazione casuale).
  `CondizioneContatore.valuta` risolve la soglia `self.valore.valore(mondo)` a
  ogni valutazione: il confronto è **dinamico** (se la cella di destra cambia, il
  confronto cambia). Abilita le relazioni *relative* (gelosie, soglie mobili,
  danno ∝ statistica) che prima richiedevano batterie di demoni a soglia.

- **Grammatica e disambiguazione.** Le tre forme dell'operando iniziano con
  token **disgiunti** (`NUMERO`, `"["`, `"un"`): un solo token di lookahead
  sceglie l'alternativa, quindi `è più di 3` (NUMERO) e `è più di [forza]`
  (VARIABILE) convivono senza conflitti. Le parentesi quadre `[` `]`, prima
  presenti solo **dentro** `TESTO_QUOTATO` (invisibili alla grammatica), sono ora
  due terminali letterali anonimi: non collidono con nulla perché fuori dalle
  stringhe non comparivano. **LALR(1) 0-ambiguo** per costruzione (guardia
  permanente estesa ai nuovi costrutti).

- **Diagnostica.** Un contatore citato **solo** come operando (`di [bonus]`, o
  come termine di confronto `è più di [bonus]`) è considerato **usato** dal
  linter (`_variabili_in_operando` alimenta sia il raccoglitore delle condizioni
  sia quello delle conseguenze): non genera più un falso «dichiarato ma mai
  usato». Il VARIABILE è un terminale **chiuso**, quindi un nome non dichiarato
  non parsa affatto (errore d'autore precoce, non un riferimento morto).

- **Serializzazione (IDE).** `_operando_to_json` espone il letterale come **int
  semplice** (forma storica, retrocompatibile) e le forme dinamiche come oggetto:
  `{"kind":"var","name":…}` e `{"kind":"rand","min":…,"max":…}`.

- **Scartato — 1c «valore successivo».** Il cambio di marcia (`sali di una
  marcia`) avrebbe richiesto un concetto di «scala ordinata» di stati. Valutato e
  **non fatto**: le N regole esplicite (`Quando la marcia è prima: …`) sono più
  leggibili di un nuovo concetto, e il principio 6 (la semplicità è una feature)
  pesa di più del risparmio. Vedi `espansione-oltre-0.29.md`.
