# FAVELLA 1 — Specifica formale della grammatica (v0.12.0)

> ⚠️ **Specifica storica.** Fotografa la grammatica alla **v0.12.0**. La versione
> **corrente** è [`grammatica-0.18.0.md`](grammatica-0.18.0.md); questo documento è
> conservato come cronaca dell'evoluzione del linguaggio.

> Documento **tecnico** versionato. Fissa lo *scheletro statico* della grammatica
> di FAVELLA 1 e il modello dei *terminali chiusi generati per-file*. **Non** è il
> manuale d'autore: descrive il linguaggio dal punto di vista del compilatore.
>
> Fonte di verità del codice: `compilatore.FAVELLA_GRAMMAR`/`_GRAMMAR_TEMPLATE`.
> Un test della suite (`test_spec_ebnf_allineata_alla_grammatica`) verifica che
> questa spec resti allineata ai nomi di regola della grammatica reale.

## 1. Modello di compilazione (due passate + preprocessore)

La compilazione di un file `.fav` avviene in tre fasi:

- **Passata 0 — Preprocessore degli import** (`espandi_inclusioni`): espande le
  direttive `Includi "file.fav".` in un unico sorgente, **prima** del parsing.
  La direttiva non raggiunge mai il parser, quindi non incide sulla grammatica.
- **Passata 1 — Scanner / symbol table** (`costruisci_symbol_table`): raccoglie i
  nomi dichiarati di stanze e oggetti (**ENTITÀ**), di stati e contatori
  (**VARIABILE**) e le coppie di direzioni personalizzate.
- **Passata 2 — Parsing LALR(1)** (`costruisci_parser` + `FavellaTransformer`): la
  grammatica concreta viene generata per-file sostituendo i terminali chiusi, poi
  un parser **LALR(1)** produce l'AST, trasformato nell'oggetto `Mondo`.

**Invariante fondamentale:** la grammatica è **LALR(1), non ambigua per
costruzione**. I nomi (ENTITÀ/VARIABILE/DIREZIONE) sono *terminali chiusi*
(alternanza dei soli simboli dichiarati), il che elimina alla radice l'ambiguità
del vecchio `entita: WORD+` aperto. Ogni eventuale conflitto emerge a build-time
come `GrammarError`, mai come scelta silenziosa a runtime.

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
                  | def_contenitore
                  | def_supporto
                  | def_personaggio
                  | def_dialogo_inizio
                  | def_battuta
                  | def_opzione
                  | def_direzioni
                  | def_evento

    // --- DEFINIZIONI BASE ---
    def_stanza: ENTITA "è" "una" "stanza" "."
    def_oggetto: ENTITA "è" "una" "cosa" "."
    def_contenitore: ENTITA "è" "un" "contenitore" "."
    def_supporto: ENTITA "è" "un" "supporto" "."
    def_personaggio: ENTITA "è" "un" "personaggio" "."
    def_verbo: TESTO_QUOTATO "è" "un" "comando" "."
    def_descrizione: "La" "descrizione" _PREP_DESCR ENTITA ( "se" condizione )? "è" TESTO_QUOTATO "."
    def_posizione: ENTITA "è" PREP_LUOGO ENTITA "."
    def_proprieta: ENTITA "è" PROPRIETA "."
    def_opposti: PROPRIETA "e" PROPRIETA "sono" "opposte" "."
    def_alias: ENTITA "si" "chiama" "anche" TESTO_QUOTATO "."
    def_connessione: ENTITA "collega" DIREZIONE "a" ENTITA "."
    def_giocatore: "Il" "giocatore" ( "comincia" | "inizia" | "parte" ) PREP_LUOGO ENTITA "."

    // --- STATO ASTRATTO (stati e contatori) ---
    def_stato: VARIABILE "è" "uno" "stato" "."
    def_stato_valore: VARIABILE "è" PROPRIETA "."
    def_contatore: VARIABILE "è" "un" "contatore" "."

    // --- TOPOLOGIA: DIREZIONI PERSONALIZZATE ---
    def_direzioni: DIREZIONE "e" DIREZIONE "sono" "direzioni" "opposte" "."

    // --- EVENTI A TURNI ---
    def_evento: "Al" "turno" NUMERO ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "." -> evento_al
              | "Ogni" NUMERO ( "turno" | "turni" ) ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "." -> evento_ogni

    // --- NPC E DIALOGHI ---
    def_dialogo_inizio: "Il" "dialogo" _PREP_DESCR ENTITA "comincia" "con" TESTO_QUOTATO "."
    def_battuta: ENTITA "al" "nodo" TESTO_QUOTATO "dice" TESTO_QUOTATO "."
    def_opzione: "Al" "nodo" TESTO_QUOTATO "l'" "opzione" TESTO_QUOTATO ( "se" condizione )? opzione_esito ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "."
    opzione_esito: "conduce" "al" "nodo" TESTO_QUOTATO -> esito_conduce
                 | "chiude" "il" "dialogo"             -> esito_chiude

    // --- REGOLE (INVECE DI) ---
    def_regola: "Invece" "di" VERBO regola_target? ( "se" condizione )? ":" "dire" TESTO_QUOTATO ( "e" "adesso" conseguenza ( "e" "adesso"? conseguenza )* )? "."
    regola_target: ( ENTITA | DIREZIONE ) ( PREP_AZIONE ENTITA )?

    // --- CONDIZIONI (logica booleana: OR < AND < atomo) ---
    ?condizione: cond_or
    ?cond_or: cond_and ( "oppure" cond_and )+ -> make_or
            | cond_and
    ?cond_and: cond_base ( "e" cond_base )+ -> make_and
             | cond_base
    ?cond_base: cond_possesso
              | cond_possesso_neg
              | cond_proprieta
              | cond_proprieta_neg
              | cond_variabile
              | cond_variabile_neg
              | cond_contatore_eq
              | cond_contatore_gte
              | cond_contatore_gt
              | cond_contatore_lt
              | "(" cond_or ")"
    cond_possesso: "il" "giocatore" "ha" ENTITA
    cond_possesso_neg: "il" "giocatore" "non" "ha" ENTITA
    cond_proprieta: ENTITA "è" PROPRIETA
    cond_proprieta_neg: ENTITA "non" "è" PROPRIETA
    cond_variabile: VARIABILE "è" PROPRIETA
    cond_variabile_neg: VARIABILE "non" "è" PROPRIETA
    cond_contatore_eq: VARIABILE "è" NUMERO
    cond_contatore_gte: VARIABILE "è" "almeno" NUMERO
    cond_contatore_gt: VARIABILE "è" "più" "di" NUMERO
    cond_contatore_lt: VARIABILE "è" "meno" "di" NUMERO

    // --- CONSEGUENZE (clausola 'e adesso') ---
    ?conseguenza: ENTITA "è" PREP_LUOGO ENTITA -> cons_spostamento
                | ENTITA "è" PROPRIETA          -> cons_proprieta
                | VARIABILE "è" PROPRIETA        -> cons_variabile
                | "aumenta" VARIABILE ( "di" NUMERO )?    -> cons_aumenta
                | "diminuisci" VARIABILE ( "di" NUMERO )? -> cons_diminuisci
                | VARIABILE "diventa" NUMERO     -> cons_contatore_set
                | "vinci"                        -> cons_vinci
                | "perdi"                        -> cons_perdi
                | "termina"                      -> cons_termina
```

## 3. Terminali

### 3.1 Terminali fissi

```ebnf
    PREP_LUOGO: "in" | "nel" | "nella" | "negli" | "nelle" | "nell'" | "sul" | "sulla" | "sullo" | "sui" | "sugli" | "sulle"
    PREP_AZIONE: "su" | "con" | "contro" | "in"
    _PREP_DESCR: "di" | "del" | "della" | "dell'" | "degli" | "delle"
    VERBO: WORD
    WORD: /[a-zA-ZÀ-ÿ0-9']+/
    NUMERO.2: /[0-9]+/
    PROPRIETA.-1: /[a-zA-ZÀ-ÿ0-9']+/
    TESTO_QUOTATO: /"(\\.|[^"\\])*"/
```

Note di disambiguazione lessicale:

- **`PROPRIETA`** è un aggettivo di stato coniato, **monoparola**, a priorità
  **bassa** (`.-1`): i keyword strutturali (`e`, `oppure`, `:`, …) vincono sempre
  la contesa lessicale, così una proprietà non «inghiotte» i token che la seguono.
- **`NUMERO`** ha priorità **alta** (`.2`): un token tutto-cifre si risolve a
  numero (contatori), non a proprietà.
- **`_PREP_DESCR`** è un terminale unico filtrato (maximal-munch): `della` non si
  spezza in `del` + `la`. Elimina un'ambiguità storica di `def_descrizione`.

### 3.2 Terminali CHIUSI generati per-file

Sostituiti in Passata 2 dai simboli raccolti in Passata 1
(`costruisci_grammatica`):

```ebnf
    DIREZIONE.2: /(?:__DIREZIONE_ALT__)\b/i
    ENTITA: /__ENTITA__/i
    VARIABILE: /__VARIABILE__/i
```

- **`ENTITA`** — alternanza chiusa dei nomi di stanze e oggetti dichiarati (più
  gli pseudo-simboli `inventario` e `nulla`). Articolo iniziale **opzionale**,
  confine di parola finale `\b`, ordinamento per lunghezza decrescente per
  garantire il **longest-match** (`re` è leftmost-first, non longest). Supporta
  nomi **multiparola** (es. `cella di contenimento`).
- **`VARIABILE`** — alternanza chiusa degli «stati»/contatori dichiarati,
  **disgiunta** da `ENTITA`: LALR distingue i costrutti su variabile da quelli su
  oggetto al **primo token**, anche con parole-valore omonime a proprietà.
- **`DIREZIONE`** — forme di base (`utils.DIREZIONI_BASE`) più le direzioni
  personalizzate dichiarate; regex con `\b` e priorità **alta** (`.2`) per vincere
  il longest-match contro keyword di cui una direzione condivide il prefisso
  (es. `alto` vs `al` di «Al turno»).
- Un terminale chiuso **vuoto** (nessun simbolo dichiarato) diventa la regex
  `[^\s\S]` (non matcha mai; Lark rifiuta i terminali a larghezza zero).

```ebnf
    %import common.WS
    %ignore WS
    COMMENT: /#[^\n]*/
    %ignore COMMENT
```

## 4. Lessico ausiliario (fuori grammatica)

Alcuni elementi vivono **dentro** `TESTO_QUOTATO` e sono perciò invisibili alla
grammatica (zero rischio di ambiguità):

- **Interpolazione** `[nome]` — sostituita a render-time con il valore di uno
  stato/contatore o col nome di un oggetto (`utils.rendi_testo`).
- **Direttiva di import** `Includi "file.fav".` — gestita dal preprocessore
  (Passata 0), mai vista dal parser.

## 5. Vincoli di stabilità

- La grammatica resta **LALR(1) 0-ambigua**; una guardia permanente nella suite
  (`test_guardia_*`) verifica «1 albero / 0 conflitti» a ogni costrutto.
- Il *vocabolario nuovo* (alias, verbi, etichette di nodo, testi delle opzioni,
  path di import) si introduce **sempre tra virgolette**, così non riapre
  l'ambiguità dei nomi come simboli chiusi.
