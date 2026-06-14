# FAVELLA 1 — Specifica formale della grammatica (v0.24.0)

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
> Versione corrente: **0.24.0**.
>
> **Nota sulle release 0.20.0, 0.21.0 e 0.23.0.** Sono state **senza modifiche di
> grammatica**: A1 pronomi e anafora (0.20.0, parser dei comandi del giocatore), A3
> comandi di servizio ANNULLA/ANCORA/TRASCRIZIONE (0.21.0, runtime), e il
> collaudatore statico `collaudo.py` (0.23.0, strumento esterno). Non compaiono in
> questa EBNF perché non sono sintassi d'autore.
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
    def_stato: VARIABILE "è" "uno" "stato" "."
    def_stato_valore: VARIABILE "è" PROPRIETA "."
    def_contatore: VARIABILE "è" "un" "contatore" "."
    def_contatore_iniziale: VARIABILE "parte" "da" NUMERO "."

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
    def_regola: "Invece" "di" ( VERBO_MULTI | VERBO ) regola_target? ( "se" condizione )? ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "."
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
    cond_contatore_eq: VARIABILE "è" NUMERO
    cond_contatore_neq: VARIABILE "non" "è" NUMERO
    cond_contatore_gte: VARIABILE "è" "almeno" NUMERO
    cond_contatore_gt: VARIABILE "è" "più" "di" NUMERO
    cond_contatore_lt: VARIABILE "è" "meno" "di" NUMERO
    cond_contatore_lte: VARIABILE "è" "al" "massimo" NUMERO
    cond_non_gruppo: "non" "(" cond_or ")"

    // --- CONSEGUENZE (clausola 'e adesso') ---
    ?conseguenza: ENTITA _copula PREP_LUOGO ENTITA -> cons_spostamento
                | ENTITA _copula PROPRIETA          -> cons_proprieta
                | "il" "giocatore" _copula PREP_LUOGO ENTITA -> cons_giocatore_sposta
                | VARIABILE "è" PROPRIETA        -> cons_variabile
                | "aumenta" VARIABILE ( "di" NUMERO )?    -> cons_aumenta
                | "diminuisci" VARIABILE ( "di" NUMERO )? -> cons_diminuisci
                | VARIABILE "diventa" NUMERO     -> cons_contatore_set
                | "vinci" TESTO_QUOTATO?         -> cons_vinci
                | "perdi" TESTO_QUOTATO?         -> cons_perdi
                | "termina" TESTO_QUOTATO?       -> cons_termina
```

## 3. Terminali

### 3.1 Terminali fissi

```ebnf
    PREP_LUOGO: "in" | "nel" | "nella" | "negli" | "nelle" | "nell'" | "sul" | "sulla" | "sullo" | "sui" | "sugli" | "sulle"
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
